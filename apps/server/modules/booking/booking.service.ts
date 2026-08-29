import dayjs from "dayjs";
import { eq, and, ne, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.model.js";
import { bookings } from "./bookings.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput } from "./booking.schema.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { reviewers } from "../auth/reviewers.model.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { bookingConfirmationTemplate } from "../../emails/templates/bookingConfirmation.js";


export const bookingService = {
  // Doc section 7: "All booking links for a reviewer share the same calendar"
  // — a slot booked under one event type must also block the same
  // reviewer's slots under OTHER event types. No need to touch the
  // `bookings` table for this — we check the `slots` table directly for
  // any overlapping 'held'/'booked' slot on the same reviewer + date,
  // excluding the current slot.
  checkCrossEventConflict: async (
    reviewerId: number,
    slotDate: string,
    startTime: string,
    endTime: string,
    excludeSlotId: number
  ) => {
    const conflicts = await db
      .select()
      .from(slots)
      .where(
        and(
          eq(slots.reviewerId, reviewerId),
          eq(slots.slotDate, slotDate),
          ne(slots.id, excludeSlotId),
          sql`${slots.status} IN ('held', 'booked')`,
          sql`(${slots.startTime}, ${slots.endTime}) OVERLAPS (${startTime}::time, ${endTime}::time)`
        )
      );

    return conflicts.length > 0;
  },

  // Called when the advisor submits the booking form — verifies the
  // holdToken and confirms the slot. Must run inside a transaction: slot
  // lookup + cross-conflict check + booking insert + slot status update
  // all need to be atomic, otherwise we risk a partial state (slot marked
  // booked with no matching booking row).
  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
      // 1. Look up the slot by holdToken — must still be held and not expired.
      const [slot] = await tx
        .select()
        .from(slots)
        .where(
          and(
            eq(slots.holdToken, data.holdToken),
            eq(slots.status, "held"),
            sql`${slots.holdExpiresAt} > now()`
          )
        )
        .limit(1);

      if (!slot) {
        throw new AppError(
          "Hold expired or invalid — please select the slot again",
          410
        );
      }

      // 2. Defensive re-check for cross-event-type conflicts. This was
      //    already checked at hold time, but we check again right before
      //    confirming in case something else got booked in the race window.
      const hasConflict = await bookingService.checkCrossEventConflict(
        slot.reviewerId,
        slot.slotDate,
        slot.startTime,
        slot.endTime,
        slot.id
      );

      if (hasConflict) {
        throw new AppError(
          "This time is no longer available — it overlaps with another booking",
          409
        );
      }

      // 3. The `bookings` table has no slotId column — combine the slot's
      //    date with its time-only startTime/endTime into a full timestamp
      //    (bookings.startTime/endTime are timestamptz columns).
      const startTimestamp = dayjs(
        `${slot.slotDate}T${slot.startTime}`
      ).toDate();
      const endTimestamp = dayjs(`${slot.slotDate}T${slot.endTime}`).toDate();

      // NOTE: advisorName is not persisted — the `bookings` table has no
      // matching column (flagged with Adil, needs a schema change if this
      // should be stored). We still include it in the returned object below
      // so the confirmation response has it.
      const [booking] = await tx
        .insert(bookings)
        .values({
          eventTypeId: slot.eventTypeId,
          reviewerId: slot.reviewerId,
          internName: data.internName,
          batch: data.batch,
          advisorEmail: data.advisorEmail,
          internEmails: data.internEmails,
          weekStage: data.weekStage,
          startTime: startTimestamp,
          endTime: endTimestamp,
          status: "confirmed",
        })
        .returning();

        if (!booking) {
  throw new AppError("Failed to create booking", 500);
}

      // 4. Mark the slot as booked — only after the booking insert
      //    succeeds. Since this is all inside one transaction, if any step
      //    fails, everything rolls back together.
      await tx
        .update(slots)
        .set({ status: "booked", updatedAt: new Date() })
        .where(eq(slots.id, slot.id));

      // Include advisorName in the response even though it's not stored
      // in the DB, so the confirmation page/email can display it.
      return { ...booking, advisorName: data.advisorName };
    });
  },

       // Runs AFTER createBooking's transaction has committed — deliberately
  // kept out of the transaction. Google Calendar + Resend are both
  // external services with no rollback semantics here; a slow/failing
  // Meet-event or email call must never undo an already-confirmed
  // booking. Both steps are individually best-effort (each has its own
  // try/catch), so a Calendar hiccup still lets emails go out, and vice
  // versa.
  finalizeBooking: async (booking: {
    id: number;
    eventTypeId: number;
    reviewerId: number;
    internName: string;
    advisorEmail: string;
    internEmails: string[] | null;
    weekStage: string;
    startTime: Date;
    endTime: Date;
    advisorName: string;
  }) => {
    const [eventType] = await db
      .select({
        name: eventTypes.name,
        meetingLink: eventTypes.meetingLink,
      })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, booking.reviewerId))
      .limit(1);

    if (!eventType || !reviewer) return { meetLink: null };

    const timezone = "Asia/Kolkata";

    let meetLink: string | null = null;

    try {
      const meetEvent = await calendarService.createMeetEvent({
        reviewerId: booking.reviewerId,
        summary: `${eventType.name} — ${booking.advisorName}`,
        description: `RevSlot session: ${eventType.name} (${booking.weekStage})`,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timezone,
        attendeeEmails: [
          reviewer.email,
          booking.advisorEmail,
          ...(booking.internEmails ?? []),
        ],
      });

      if (meetEvent) {
        meetLink = meetEvent.meetLink;

        await db
          .update(bookings)
          .set({
            meetLink: meetEvent.meetLink,
            googleEventId: meetEvent.googleEventId,
          })
          .where(eq(bookings.id, booking.id));
      }
    } catch (err) {
      console.error(
        `[Booking] Meet event creation failed for booking ${booking.id}:`,
        err
      );
    }

    // Reviewer hasn't connected Google Calendar — fall back to the
    // static link they set on the event type itself, if any.
    if (!meetLink && eventType.meetingLink) {
      meetLink = eventType.meetingLink;
    }

    const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");

    const formattedTime = `${dayjs(booking.startTime).format(
      "h:mm A"
    )} – ${dayjs(booking.endTime).format("h:mm A")} (${timezone})`;

    const recipients: {
      email: string;
      name: string;
      role: "advisor" | "reviewer" | "intern";
    }[] = [
      {
        email: booking.advisorEmail,
        name: booking.advisorName,
        role: "advisor",
      },
      {
        email: reviewer.email,
        name: reviewer.name,
        role: "reviewer",
      },
      ...(booking.internEmails ?? []).map((email) => ({
        email,
        name: booking.internName,
        role: "intern" as const,
      })),
    ];

    await Promise.all(
      recipients.map(({ email, name, role }) => {
        const { subject, html } = bookingConfirmationTemplate({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          internName: booking.internName,
          advisorName: booking.advisorName,
          formattedDate,
          formattedTime,
          meetLink,
        });

        return emailService
          .sendEmail({
            to: email,
            subject,
            html,
          })
          .catch((err) => {
            console.error(
              `[Booking] Failed to send confirmation email to ${email}:`,
              err
            );
          });
      })
    );

    return { meetLink };
  },

};


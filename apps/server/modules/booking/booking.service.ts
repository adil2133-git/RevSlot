import dayjs from "dayjs";
import { eq, and, ne, inArray, gte, lte, lt, sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { slots } from "../slot/slots.model.js";
import { bookings } from "./bookings.model.js";
import { AppError } from "../../core/errors/AppError.js";
import type { CreateBookingInput, CancelBookingInput, RescheduleBookingInput } from "./booking.schema.js";
import { eventTypes } from "../eventType/eventTypes.model.js";
import { reviewers } from "../auth/reviewers.model.js";
import { calendarService } from "../calendar/calendar.service.js";
import { emailService } from "../../services/email.service.js";
import { bookingConfirmationTemplate } from "../../emails/templates/bookingConfirmation.js";
import { bookingCancelledTemplate } from "../../emails/templates/bookingCancelled.js";
import { bookingRescheduledTemplate } from "../../emails/templates/bookingRescheduled.js";
import { slotService } from "../slot/slot.service.js";

export interface GetMyBookingsOptions {
  page: number;
  limit: number;
  status?: ("confirmed" | "completed" | "rescheduled" | "cancelled")[] | undefined;
  scope?: "upcoming" | "past" | "ongoing" | undefined;
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const CANCEL_CUTOFF_HOURS = 3;

const getOwnedBookingOrThrow = async (reviewerId: number, bookingId: number) => {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
    .limit(1);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  return booking;
};

const assertOutsideCutoff = (startTime: Date) => {
  const hoursUntilStart = dayjs(startTime).diff(dayjs(), "hour", true);
  if (hoursUntilStart < CANCEL_CUTOFF_HOURS) {
    throw new AppError(
      "This session starts in less than " + CANCEL_CUTOFF_HOURS + " hours and can no longer be changed here",
      409
    );
  }
};

const releaseBookingSlot = async (tx: Transaction, booking: typeof bookings.$inferSelect) => {
  const slotDate = dayjs(booking.startTime).format("YYYY-MM-DD");
  const startTime = dayjs(booking.startTime).format("HH:mm:ss");
  const endTime = dayjs(booking.endTime).format("HH:mm:ss");

  await tx
    .update(slots)
    .set({ status: "available", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(slots.eventTypeId, booking.eventTypeId),
        eq(slots.slotDate, slotDate),
        eq(slots.startTime, startTime),
        eq(slots.endTime, endTime),
        eq(slots.status, "booked")
      )
    );
};

export const bookingService = {
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

  createBooking: async (data: CreateBookingInput) => {
    return db.transaction(async (tx) => {
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

      const startTimestamp = dayjs(
        `${slot.slotDate}T${slot.startTime}`
      ).toDate();
      const endTimestamp = dayjs(`${slot.slotDate}T${slot.endTime}`).toDate();

      const [booking] = await tx
        .insert(bookings)
        .values({
          eventTypeId: slot.eventTypeId,
          reviewerId: slot.reviewerId,
          internName: data.internName,
          batch: data.batch,
          advisorName: data.advisorName,
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

      await tx
        .update(slots)
        .set({ status: "booked", updatedAt: new Date() })
        .where(eq(slots.id, slot.id));

      return booking;
    });
  },

  finalizeBooking: async (booking: {
    id: number;
    eventTypeId: number;
    reviewerId: number;
    internName: string;
    advisorName: string;
    advisorEmail: string;
    internEmails: string[] | null;
    weekStage: string;
    startTime: Date;
    endTime: Date;
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

  // Reviewer's own bookings — paginated, filterable by status, and scoped
  // to upcoming/past. Joins eventTypes for name/id/bookingWindowDays so
  // the frontend can open the reschedule modal without a second fetch.
  getMyBookings: async (
    reviewerId: number,
    options: GetMyBookingsOptions
  ) => {
    const { page, limit, status, scope } = options;
    const offset = (page - 1) * limit;
    const now = new Date();

    const conditions = [eq(bookings.reviewerId, reviewerId)];

    if (status && status.length > 0) {
      conditions.push(inArray(bookings.status, status));
    }

    if (scope === "upcoming") {
      conditions.push(gte(bookings.startTime, now));
    } else if (scope === "past") {
      conditions.push(lt(bookings.startTime, now));
    } else if (scope === "ongoing") {
      conditions.push(lte(bookings.startTime, now));
      conditions.push(gte(bookings.endTime, now));
    }

    const orderBy = scope === "past" ? sql`${bookings.startTime} DESC` : sql`${bookings.startTime} ASC`;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: bookings.id,
          eventTypeId: bookings.eventTypeId,
          internName: bookings.internName,
          batch: bookings.batch,
          advisorName: bookings.advisorName,
          advisorEmail: bookings.advisorEmail,
          weekStage: bookings.weekStage,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          status: bookings.status,
          meetLink: bookings.meetLink,
          cancelledAt: bookings.cancelledAt,
          cancelledReason: bookings.cancelledReason,
          eventTypeName: eventTypes.name,
          bookingWindowDays: eventTypes.bookingWindowDays,
        })
        .from(bookings)
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .where(and(...conditions)),
    ]);

    const totalCount = countResult[0]?.count ?? 0;

    return {
      bookings: rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  },

  getBookingById: async (reviewerId: number, bookingId: number) => {
    const [row] = await db
      .select({
        id: bookings.id,
        eventTypeId: bookings.eventTypeId,
        internName: bookings.internName,
        batch: bookings.batch,
        advisorName: bookings.advisorName,
        advisorEmail: bookings.advisorEmail,
        internEmails: bookings.internEmails,
        weekStage: bookings.weekStage,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        status: bookings.status,
        meetLink: bookings.meetLink,
        cancelledAt: bookings.cancelledAt,
        cancelledReason: bookings.cancelledReason,
        rescheduledFromBookingId: bookings.rescheduledFromBookingId,
        eventTypeName: eventTypes.name,
        bookingWindowDays: eventTypes.bookingWindowDays,
      })
      .from(bookings)
      .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.reviewerId, reviewerId)))
      .limit(1);

    if (!row) {
      throw new AppError("Booking not found", 404);
    }

    return row;
  },

  cancelBooking: async (reviewerId: number, bookingId: number, data: CancelBookingInput) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be cancelled", 400);
    }

    assertOutsideCutoff(booking.startTime);

    const [eventType] = await db
      .select({ name: eventTypes.name })
      .from(eventTypes)
      .where(eq(eventTypes.id, booking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, reviewerId))
      .limit(1);

    const updated = await db.transaction(async (tx) => {
      const [result] = await tx
        .update(bookings)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledReason: data.reason,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      await releaseBookingSlot(tx, booking);

      return result;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[Booking] Failed to cancel Calendar event for booking ${bookingId}:`, err);
      });
    }

    if (eventType && reviewer) {
      const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");
      const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")}`;

      const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern" }[] = [
        { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" },
        { email: reviewer.email, name: reviewer.name, role: "reviewer" },
        ...(booking.internEmails ?? []).map((email) => ({
          email,
          name: booking.internName,
          role: "intern" as const,
        })),
      ];

      await Promise.all(
        recipients.map(({ email, name, role }) => {
          const { subject, html } = bookingCancelledTemplate({
            recipientName: name,
            recipientRole: role,
            eventTypeName: eventType.name,
            reviewerName: reviewer.name,
            advisorName: booking.advisorName,
            formattedDate,
            formattedTime,
            reason: data.reason,
          });
          return emailService.sendEmail({ to: email, subject, html }).catch((err) => {
            console.error(`[Booking] Failed to send cancellation email to ${email}:`, err);
          });
        })
      );
    }

    return updated;
  },

  rescheduleBooking: async (reviewerId: number, bookingId: number, data: RescheduleBookingInput) => {
    const booking = await getOwnedBookingOrThrow(reviewerId, bookingId);

    if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
      throw new AppError("Only confirmed or rescheduled bookings can be rescheduled", 400);
    }

    assertOutsideCutoff(booking.startTime);

    const hold = await slotService.holdSlot({
      eventTypeId: booking.eventTypeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const newStartTime = dayjs(`${data.date}T${data.startTime}`).toDate();
    const newEndTime = dayjs(`${data.date}T${data.endTime}`).toDate();

    const updatedBooking = await db.transaction(async (tx) => {
      // Release old slot occupied by previous start/end time
      await releaseBookingSlot(tx, booking);

      // Update existing booking row in place with status 'rescheduled'
      const [updated] = await tx
        .update(bookings)
        .set({
          startTime: newStartTime,
          endTime: newEndTime,
          status: "rescheduled",
          meetLink: null,
          googleEventId: null,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      if (!updated) {
        throw new AppError("Failed to reschedule booking", 500);
      }

      // Mark the new slot as booked
      await tx
        .update(slots)
        .set({ status: "booked", holdToken: null, holdExpiresAt: null, updatedAt: new Date() })
        .where(eq(slots.id, hold.slotId));

      return updated;
    });

    if (booking.googleEventId) {
      await calendarService.cancelMeetEvent(reviewerId, booking.googleEventId).catch((err) => {
        console.error(`[Booking] Failed to cancel old Calendar event for booking ${bookingId}:`, err);
      });
    }

    return updatedBooking;
  },

  finalizeReschedule: async (
    oldBooking: { startTime: Date; endTime: Date },
    newBooking: {
      id: number;
      eventTypeId: number;
      reviewerId: number;
      internName: string;
      advisorName: string;
      advisorEmail: string;
      internEmails: string[] | null;
      weekStage: string;
      startTime: Date;
      endTime: Date;
    }
  ) => {
    const [eventType] = await db
      .select({ name: eventTypes.name, meetingLink: eventTypes.meetingLink })
      .from(eventTypes)
      .where(eq(eventTypes.id, newBooking.eventTypeId))
      .limit(1);

    const [reviewer] = await db
      .select({ name: reviewers.name, email: reviewers.email })
      .from(reviewers)
      .where(eq(reviewers.id, newBooking.reviewerId))
      .limit(1);

    if (!eventType || !reviewer) return { meetLink: null };

    const timezone = "Asia/Kolkata";
    let meetLink: string | null = null;

    try {
      const meetEvent = await calendarService.createMeetEvent({
        reviewerId: newBooking.reviewerId,
        summary: `${eventType.name} — ${newBooking.advisorName}`,
        description: `RevSlot session: ${eventType.name} (${newBooking.weekStage})`,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        timezone,
        attendeeEmails: [
          reviewer.email,
          newBooking.advisorEmail,
          ...(newBooking.internEmails ?? []),
        ],
      });

      if (meetEvent) {
        meetLink = meetEvent.meetLink;
        await db
          .update(bookings)
          .set({ meetLink: meetEvent.meetLink, googleEventId: meetEvent.googleEventId })
          .where(eq(bookings.id, newBooking.id));
      }
    } catch (err) {
      console.error(`[Booking] Meet event creation failed for rescheduled booking ${newBooking.id}:`, err);
    }

    if (!meetLink && eventType.meetingLink) {
      meetLink = eventType.meetingLink;
    }

    const oldFormattedDate = dayjs(oldBooking.startTime).format("ddd, MMM D");
    const oldFormattedTime = `${dayjs(oldBooking.startTime).format("h:mm A")} – ${dayjs(oldBooking.endTime).format("h:mm A")}`;
    const newFormattedDate = dayjs(newBooking.startTime).format("ddd, MMM D");
    const newFormattedTime = `${dayjs(newBooking.startTime).format("h:mm A")} – ${dayjs(newBooking.endTime).format("h:mm A")} (${timezone})`;

    const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern" }[] = [
      { email: newBooking.advisorEmail, name: newBooking.advisorName, role: "advisor" },
      { email: reviewer.email, name: reviewer.name, role: "reviewer" },
      ...(newBooking.internEmails ?? []).map((email) => ({
        email,
        name: newBooking.internName,
        role: "intern" as const,
      })),
    ];

    await Promise.all(
      recipients.map(({ email, name, role }) => {
        const { subject, html } = bookingRescheduledTemplate({
          recipientName: name,
          recipientRole: role,
          eventTypeName: eventType.name,
          reviewerName: reviewer.name,
          advisorName: newBooking.advisorName,
          oldFormattedDate,
          oldFormattedTime,
          newFormattedDate,
          newFormattedTime,
          meetLink,
        });
        return emailService.sendEmail({ to: email, subject, html }).catch((err) => {
          console.error(`[Booking] Failed to send reschedule email to ${email}:`, err);
        });
      })
    );

    return { meetLink };
  },
};
import dayjs from "dayjs";
import { and, inArray, isNull, lte, gt, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { bookings } from "./bookings.schema.js";
import { eventTypes } from "../eventType/eventTypes.schema.js";
import { reviewers } from "../auth/reviewers.schema.js";
import { emailService } from "../../services/email.service.js";
import { sessionReminderTemplate, sessionReminderTemplateData } from "../../emails/templates/sessionReminder.js";
import { notificationService } from "../notification/notification.service.js";

export const bookingReminderService = {
  checkAndSendReminders: async () => {
    try {
      const now = new Date();
      const inOneHour = dayjs(now).add(60, "minute").toDate();

      // Find upcoming confirmed or rescheduled bookings starting within 60 minutes
      // that haven't had a reminder sent yet
      const upcoming = await db
        .select({
          id: bookings.id,
          reviewerId: bookings.reviewerId,
          eventTypeId: bookings.eventTypeId,
          internName: bookings.internName,
          advisorName: bookings.advisorName,
          advisorEmail: bookings.advisorEmail,
          internEmails: bookings.internEmails,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          meetLink: bookings.meetLink,
          eventTypeName: eventTypes.name,
          reviewerName: reviewers.name,
          reviewerEmail: reviewers.email,
        })
        .from(bookings)
        .innerJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .innerJoin(reviewers, eq(bookings.reviewerId, reviewers.id))
        .where(
          and(
            inArray(bookings.status, ["confirmed", "rescheduled"]),
            gt(bookings.startTime, now),
            lte(bookings.startTime, inOneHour),
            isNull(bookings.reminderSentAt)
          )
        );

      if (upcoming.length === 0) return;

      for (const booking of upcoming) {
        try {
          const diffMins = Math.max(1, dayjs(booking.startTime).diff(dayjs(now), "minute"));
          const startsInText = diffMins > 50 ? "in ~1 hour" : `in ${diffMins} minutes`;
          const formattedDate = dayjs(booking.startTime).format("ddd, MMM D");
          const formattedTime = `${dayjs(booking.startTime).format("h:mm A")} – ${dayjs(booking.endTime).format("h:mm A")}`;

          // 1. Mark as sent FIRST so concurrent executions cannot double-send
          await db
            .update(bookings)
            .set({ reminderSentAt: new Date() })
            .where(eq(bookings.id, booking.id));

          // 2. Send in-app notification to reviewer (emits real-time socket alert)
          await notificationService.createNotification({
            reviewerId: booking.reviewerId,
            type: "session_reminder",
            title: `Session starts ${startsInText}`,
            message: `Your session with ${booking.advisorName} (${booking.internName}) starts at ${dayjs(booking.startTime).format("h:mm A")}`,
            bookingId: booking.id,
          });

          // 3. Dispatch emails to all attendees
          const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern" }[] = [
            { email: booking.advisorEmail, name: booking.advisorName, role: "advisor" },
            { email: booking.reviewerEmail, name: booking.reviewerName, role: "reviewer" },
            ...(booking.internEmails ?? []).map((email) => ({
              email,
              name: booking.internName,
              role: "intern" as const,
            })),
          ];

          await Promise.all(
            recipients.map(({ email, name, role }) => {
              const { html: fallbackHtml } = sessionReminderTemplate({
                recipientName: name,
                recipientRole: role,
                eventTypeName: booking.eventTypeName,
                reviewerName: booking.reviewerName,
                internName: booking.internName,
                advisorName: booking.advisorName,
                formattedDate,
                formattedTime,
                meetLink: booking.meetLink,
                startsInText,
              });
              const { templateId, subject, variables } = sessionReminderTemplateData({
                recipientName: name,
                recipientRole: role,
                eventTypeName: booking.eventTypeName,
                reviewerName: booking.reviewerName,
                internName: booking.internName,
                advisorName: booking.advisorName,
                formattedDate,
                formattedTime,
                meetLink: booking.meetLink,
                startsInText,
              });

              return emailService.sendTemplateEmail({ to: email, templateId, subject, variables, fallbackHtml }).catch((err) => {
                console.error(`[Reminder] Failed to send email to ${email}:`, err);
              });
            })
          );
        } catch (itemError) {
          console.error(`[Reminder] Error processing booking #${booking.id}:`, itemError);
        }
      }
    } catch (err) {
      console.error("[ReminderService] Error running reminders job:", err);
    }
  },
};
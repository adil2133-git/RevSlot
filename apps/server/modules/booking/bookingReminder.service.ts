import dayjs from "../../config/dayjs.js";
import { emailService } from "../../services/email.service.js";
import { sessionReminderTemplate, sessionReminderTemplateData } from "../../emails/templates/sessionReminder.js";
import { notificationService } from "../notification/notification.service.js";
import {
  findUpcomingBookingsNeedingRemindersRepo,
  markBookingReminderSentRepo,
} from "./booking.repository.js";

export const bookingReminderService = {
  checkAndSendReminders: async () => {
    try {
      const now = new Date();
      const inOneHour = dayjs(now).add(60, "minute").toDate();

      // Find upcoming confirmed or rescheduled bookings starting within 60 minutes
      // that haven't had a reminder sent yet
      const upcoming = await findUpcomingBookingsNeedingRemindersRepo(now, inOneHour);

      if (upcoming.length === 0) return;

      for (const booking of upcoming) {
        try {
          const reviewerTimezone = booking.timezone || "Asia/Kolkata";
          const clientTimezone = (booking.formData as Record<string, string> | null)?.clientTimezone || reviewerTimezone;

          const diffMins = Math.max(1, dayjs(booking.startTime).diff(dayjs(now), "minute"));
          const startsInText = diffMins > 50 ? "in ~1 hour" : `in ${diffMins} minutes`;

          // 1. Mark as sent FIRST so concurrent executions cannot double-send
          await markBookingReminderSentRepo(booking.id);

          // 2. Send in-app notification to reviewer (emits real-time socket alert)
          await notificationService.createNotification({
            reviewerId: booking.reviewerId,
            type: "session_reminder",
            title: `Session starts ${startsInText}`,
            message: `Your session with ${booking.advisorName} (${booking.internName}) starts at ${dayjs(booking.startTime).tz(reviewerTimezone).format("h:mm A")}`,
            bookingId: booking.id,
          });

          // 3. Dispatch emails to all attendees
          const recipients: { email: string; name: string; role: "advisor" | "reviewer" | "intern"; timezone: string }[] = [
            { email: booking.advisorEmail, name: booking.advisorName, role: "advisor", timezone: clientTimezone },
            { email: booking.reviewerEmail, name: booking.reviewerName, role: "reviewer", timezone: reviewerTimezone },
            ...(booking.internEmails ?? []).map((email) => ({
              email,
              name: booking.internName,
              role: "intern" as const,
              timezone: clientTimezone,
            })),
          ];

          await Promise.all(
            recipients.map(({ email, name, role, timezone: recipientTz }) => {
              const formattedDate = dayjs(booking.startTime).tz(recipientTz).format("ddd, MMM D");
              const formattedTime = `${dayjs(booking.startTime).tz(recipientTz).format("h:mm A")} – ${dayjs(booking.endTime).tz(recipientTz).format("h:mm A")} (${recipientTz})`;

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
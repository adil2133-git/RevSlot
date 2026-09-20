import cron from "node-cron";
import { notificationService } from "./notification.service.js";

/**
 * Daily Notification Cleanup Job
 * Runs every day at 02:00 AM server time (off-peak).
 * Expression: 0 2 * * *
 * - Deletes read notifications older than 30 days.
 * - Deletes unread notifications older than 90 days.
 */
export const startNotificationCron = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log(`[NotificationCron] Running daily notification cleanup at ${new Date().toISOString()}`);
    try {
      await notificationService.cleanupStaleNotifications();
    } catch (error) {
      console.error("[NotificationCron] Cleanup job failed:", error);
    }
  });

  console.log("[NotificationCron] Scheduled daily notification cleanup job (02:00 AM daily)");
};

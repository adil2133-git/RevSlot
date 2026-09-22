import { Worker } from "bullmq";
import { bullmqConnection } from "../config/bullmqRedis.js";
import { EMAIL_QUEUE_NAME, type EmailJobData } from "./email.queue.js";
import { sendEmailNow, sendTemplateEmailNow } from "../services/email.service.js";

let worker: Worker<EmailJobData> | null = null;

// Starts the background worker that drains the email queue. Called once
// from server.ts, the same way startNotificationCron() and
// bookingReminderService's cron are started — runs in-process alongside
// the API server.
export function startEmailWorker(): Worker<EmailJobData> {
  if (worker) return worker;

  worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const data = job.data;

      if (data.kind === "raw") {
        return sendEmailNow({ to: data.to, subject: data.subject, html: data.html });
      }

      return sendTemplateEmailNow({
        to: data.to,
        templateId: data.templateId,
        variables: data.variables,
        ...(data.subject !== undefined ? { subject: data.subject } : {}),
        ...(data.fallbackHtml !== undefined ? { fallbackHtml: data.fallbackHtml } : {}),
      });
    },
    {
      connection: bullmqConnection,
      concurrency: 5,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(
      `[EmailWorker] Job ${job?.id} failed after ${job?.attemptsMade ?? "?"} attempt(s):`,
      err.message || err
    );
  });

  if (process.env.NODE_ENV !== "production") {
    worker.on("completed", (job) => {
      const label = job.data.kind === "template" ? job.data.templateId : job.data.subject;
      console.log(`[EmailWorker] Job ${job.id} completed (${label})`);
    });
  }

  console.log("[EmailWorker] Started, listening for email jobs.");
  return worker;
}
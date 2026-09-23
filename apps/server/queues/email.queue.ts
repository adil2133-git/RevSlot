import { Queue } from "bullmq";
import { bullmqConnection } from "../config/bullmqRedis.js";

export const EMAIL_QUEUE_NAME = "email";

export type EmailJobData =
  | {
      kind: "raw";
      to: string;
      subject: string;
      html: string;
    }
  | {
      kind: "template";
      to: string;
      templateId: string;
      variables: Record<string, string | number>;
      subject?: string;
      // Rendered HTML the worker falls back to if the Resend Templates
      // call fails (unpublished template, account not enabled, etc.).
      fallbackHtml?: string;
    };

// Every email in the app is queued here instead of sent inline, so a
// route handler never blocks on Resend's ~1-2s round trip. The worker
// (email.worker.ts) is what actually performs the send.
export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    // Keep a rolling window of completed/failed jobs for debugging without
    // letting Redis grow unbounded.
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  },
});
import { Resend } from "resend";
import { AppError } from "../core/errors/AppError.js";
import { emailQueue } from "../queues/email.queue.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const EMAIL_FROM = process.env.EMAIL_FROM as string;

if (!RESEND_API_KEY || !EMAIL_FROM) {
  throw new Error("Resend env vars are not set (RESEND_API_KEY, EMAIL_FROM)");
}

const resend = new Resend(RESEND_API_KEY);

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

interface SendTemplateEmailInput {
  to: string;
  // The Resend Template ID (created in the Resend dashboard's Template
  // editor, or pushed via scripts/provisionResendTemplates.ts).
  templateId: string;
  // Values for the {{{VARIABLE}}} placeholders defined on the template.
  variables: Record<string, string | number>;
  // Optional — overrides the template's default subject for this send.
  subject?: string;
  // Fully-rendered HTML to send instead, if the templated send fails
  // (e.g. the template hasn't been created/published on Resend yet, or
  // the account doesn't have Templates access).
  fallbackHtml?: string;
}

async function sendViaHtml({ to, subject, html }: SendEmailInput) {
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new AppError(`Failed to send email: ${error.message}`, 502);
  }

  return data;
}

// The functions that actually talk to Resend. ONLY called by the BullMQ
// worker (queues/email.worker.ts) — never call these directly from a
// route handler or service, since that reintroduces the 1-2s delay the
// queue exists to remove. Everywhere else in the app uses
// emailService.sendEmail / sendTemplateEmail below instead.
export async function sendEmailNow({ to, subject, html }: SendEmailInput) {
  try {
    return await sendViaHtml({ to, subject, html });
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send email to ${to} ("${subject}"):`, err.message || err);
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn(`[DEV ONLY] Suppressed email sending error to keep development flow working.`);
    return null;
  }
}

export async function sendTemplateEmailNow({ to, templateId, variables, subject, fallbackHtml }: SendTemplateEmailInput) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      ...(subject ? { subject } : {}),
      template: { id: templateId, variables },
    });

    if (error) {
      throw new AppError(`Failed to send templated email: ${error.message}`, 502);
    }

    return data;
  } catch (err: any) {
    console.error(
      `[Email Service Error] Templated send failed for ${to} (template: ${templateId}):`,
      err.message || err
    );

    // Resend Templates is newer / limited-access. If the template isn't
    // published yet, or this account doesn't have Templates enabled,
    // fall back to the plain HTML version so delivery isn't blocked.
    if (fallbackHtml && subject) {
      console.warn(`[Email Service] Falling back to raw HTML send for ${to}.`);
      try {
        return await sendViaHtml({ to, subject, html: fallbackHtml });
      } catch (fallbackErr: any) {
        console.error(
          `[Email Service Error] Fallback HTML send also failed for ${to}:`,
          fallbackErr.message || fallbackErr
        );
        if (process.env.NODE_ENV === "production") {
          throw fallbackErr;
        }
        return null;
      }
    }

    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn(`[DEV ONLY] Suppressed templated email error to keep development flow working.`);
    return null;
  }
}

// Public API used throughout the app (auth, booking, dispute, feedback,
// payout, vacation, advisor services, etc.) — signatures are UNCHANGED
// from before BullMQ was introduced, so no call site needs to change.
// Instead of blocking on Resend's network round trip, this pushes a job
// onto the email queue (~milliseconds) and returns immediately; the
// worker in queues/email.worker.ts picks it up and does the real send,
// with automatic retries on failure.
export const emailService = {
  sendEmail: async (input: SendEmailInput) => {
    await emailQueue.add("send-email", { kind: "raw", ...input });
  },

  sendTemplateEmail: async (input: SendTemplateEmailInput) => {
    await emailQueue.add("send-template-email", { kind: "template", ...input });
  },
};
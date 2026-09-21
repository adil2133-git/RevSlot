import { Resend } from "resend";
import { AppError } from "../core/errors/AppError.js";

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

export const emailService = {
  sendEmail: async ({ to, subject, html }: SendEmailInput) => {
    try {
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
    } catch (err: any) {
      console.error(`[Email Service Error] Failed to send email to ${to} ("${subject}"):`, err.message || err);
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
      console.warn(`[DEV ONLY] Suppressed email sending error to keep development flow working.`);
      return null;
    }
  },
};
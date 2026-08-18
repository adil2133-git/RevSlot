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
  },
};
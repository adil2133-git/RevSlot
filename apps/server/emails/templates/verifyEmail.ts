import { BRAND, renderEmailShell, renderCodeBox } from "../layout.js";

interface VerifyEmailParams {
  name: string;
  otpCode: string;
}

// The Resend Template ID — matches the template pushed by
// scripts/provisionResendTemplates.ts (or created by hand in the
// Resend dashboard's Template editor with the same variable names).
export const VERIFY_EMAIL_TEMPLATE_ID = "revslot-verify-email";

// Variables + subject for emailService.sendTemplateEmail(). Kept alongside
// verifyEmailTemplate() below, which still builds the fallback HTML.
export const verifyEmailTemplateData = ({ name, otpCode }: VerifyEmailParams) => ({
  templateId: VERIFY_EMAIL_TEMPLATE_ID,
  subject: "Verify your RevSlot email address",
  variables: { NAME: name, OTP_CODE: otpCode },
});

export const verifyEmailTemplate = ({ name, otpCode }: VerifyEmailParams) => {
  const subject = "Verify your RevSlot email address";

  const html = renderEmailShell({
    subtitle: "Email Verification",
    bodyHtml: `
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
        Hi ${name},
      </p>
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
        Thanks for signing up for RevSlot. Enter the code below to verify your email and activate your reviewer account.
      </p>
      ${renderCodeBox(otpCode)}
      <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
        This code expires in 10 minutes. If you didn't create a RevSlot account, you can safely ignore this email.
      </p>
    `,
  });

  return { subject, html };
};
import { BRAND, renderEmailShell, renderCodeBox } from "../layout.js";

interface ForgotPasswordParams {
  name: string;
  otpCode: string;
}

export const FORGOT_PASSWORD_TEMPLATE_ID = "revslot-forgot-password";

export const forgotPasswordTemplateData = ({ name, otpCode }: ForgotPasswordParams) => ({
  templateId: FORGOT_PASSWORD_TEMPLATE_ID,
  subject: "Reset your RevSlot password",
  variables: { NAME: name, OTP_CODE: otpCode },
});

export const forgotPasswordTemplate = ({ name, otpCode }: ForgotPasswordParams) => {
  const subject = "Reset your RevSlot password";

  const html = renderEmailShell({
    subtitle: "Password Reset",
    bodyHtml: `
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
        Hi ${name},
      </p>
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
        Use the code below to reset your RevSlot password. This code expires in 10 minutes.
      </p>
      ${renderCodeBox(otpCode)}
      <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email — your password won't change.
      </p>
    `,
  });

  return { subject, html };
};
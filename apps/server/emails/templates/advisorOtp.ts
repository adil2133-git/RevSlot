import { BRAND, renderEmailShell, renderCodeBox } from "../layout.js";

interface AdvisorOtpParams {
  advisorEmail: string;
  otpCode: string;
}

export const ADVISOR_OTP_TEMPLATE_ID = "revslot-advisor-otp";

export const advisorOtpTemplateData = ({ advisorEmail, otpCode }: AdvisorOtpParams) => ({
  templateId: ADVISOR_OTP_TEMPLATE_ID,
  subject: `${otpCode} is your RevSlot verification code`,
  variables: { ADVISOR_EMAIL: advisorEmail, OTP_CODE: otpCode },
});

export const advisorOtpTemplate = ({ advisorEmail, otpCode }: AdvisorOtpParams) => {
  const subject = `${otpCode} is your RevSlot verification code`;

  const html = renderEmailShell({
    subtitle: "Advisor Portal Access",
    bodyHtml: `
      <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">
        Hello,
      </p>
      <p style="color: ${BRAND.bodyText}; font-size: 15px; line-height: 1.6;">
        Enter the verification code below to view and manage your booked slots associated with <strong>${advisorEmail}</strong>.
      </p>
      ${renderCodeBox(otpCode)}
      <p style="color: ${BRAND.muted}; font-size: 13px; line-height: 1.6; text-align: center;">
        This verification code is valid for 10 minutes. If you did not request this code, please ignore this email.
      </p>
    `,
  });

  return { subject, html };
};
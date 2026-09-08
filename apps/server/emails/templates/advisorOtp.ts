interface AdvisorOtpParams {
  advisorEmail: string;
  otpCode: string;
}

export const advisorOtpTemplate = ({ advisorEmail, otpCode }: AdvisorOtpParams) => {
  const subject = `${otpCode} is your RevSlot verification code`;

  const html = `
    <div style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #003366; margin: 0; font-size: 24px; font-weight: 700;">RevSlot</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Advisor Portal Access</p>
      </div>
      <p style="color: #1e293b; font-size: 15px; line-height: 1.6;">
        Hello,
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">
        Enter the verification code below to view and manage your booked slots associated with <strong>${advisorEmail}</strong>.
      </p>
      <div style="margin: 28px 0; padding: 18px; background: #e6eef5; border-radius: 12px; text-align: center;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #003366;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: center;">
        This verification code is valid for 10 minutes. If you did not request this code, please ignore this email.
      </p>
    </div>
  `;

  return { subject, html };
};

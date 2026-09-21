interface ForgotPasswordParams {
  name: string;
  otpCode: string;
}

export const forgotPasswordTemplate = ({ name, otpCode }: ForgotPasswordParams) => {
  const subject = "Reset your RevSlot password";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #111827; margin-bottom: 8px;">Reset your password</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Hi ${name},
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Use the code below to reset your RevSlot password. This code expires in 10 minutes.
      </p>
      <div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 8px; text-align: center;">
        <span style="font-size: 28px; font-weight: 600; letter-spacing: 6px; color: #111827;">
          ${otpCode}
        </span>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        If you didn't request a password reset, you can safely ignore this email — your password won't change.
      </p>
    </div>
  `;

  return { subject, html };
};
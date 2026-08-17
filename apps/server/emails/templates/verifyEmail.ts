interface VerifyEmailParams {
  name: string;
  verificationUrl: string;
}

export const verifyEmailTemplate = ({ name, verificationUrl }: VerifyEmailParams) => {
  const subject = "Verify your RevSlot email address";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #111827; margin-bottom: 8px;">Verify your email</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Hi ${name},
      </p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">
        Thanks for signing up for RevSlot. Confirm your email address to activate your reviewer account.
      </p>
      <a href="${verificationUrl}"
        style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">
        Verify Email
      </a>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        This link expires in 24 hours. If you didn't create a RevSlot account, you can safely ignore this email.
      </p>
    </div>
  `;

  return { subject, html };
};
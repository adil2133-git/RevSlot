import { otpService } from "./otp.service.js";
import { emailService } from "../../services/email.service.js";
import { advisorOtpTemplate } from "../../emails/templates/advisorOtp.js";
import { generateAdvisorToken } from "../../core/utils/jwt.js";
import { AppError } from "../../core/errors/AppError.js";

export const advisorAuthService = {
  sendOtp: async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const code = await otpService.generateOtp(trimmedEmail, "advisor_access");

    const { subject, html } = advisorOtpTemplate({
      advisorEmail: trimmedEmail,
      otpCode: code,
    });

    await emailService.sendEmail({
      to: trimmedEmail,
      subject,
      html,
    });

    return { message: "Verification code sent to email" };
  },

  verifyOtp: async (email: string, code: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const isValid = await otpService.verifyOtp(trimmedEmail, "advisor_access", code.trim());

    if (!isValid) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    const token = generateAdvisorToken(trimmedEmail);

    return {
      token,
      advisorEmail: trimmedEmail,
    };
  },
};

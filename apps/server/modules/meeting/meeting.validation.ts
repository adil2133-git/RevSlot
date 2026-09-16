import { z } from "zod";

export const BookingIdParamSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
});

export const MeetingTokenSchema = z.object({
  token: z.string().min(16),
});

export const JoinMeetingSchema = z.object({
  token: z.string().min(16),
  participantId: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  role: z.enum(["reviewer", "advisor", "intern", "guest"]),
});

export const HeartbeatSchema = z.object({
  token: z.string().min(16),
  participantId: z.string().min(1).max(100),
});

export const SignalSchema = z.object({
  token: z.string().min(16),
  from: z.string().min(1).max(100),
  to: z.string().min(1).max(100),
  type: z.enum(["offer", "answer", "ice-candidate"]),
  payload: z.unknown(),
});

export const ChatMessageSchema = z.object({
  token: z.string().min(16),
  participantId: z.string().min(1).max(100),
  message: z.string().trim().min(1).max(2000),
});

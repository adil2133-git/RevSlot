import { z } from "zod";
import { CreateBookingSchema } from "../booking/booking.validation.js";

export const CreateOrderSchema = z.object({
  holdToken: z.string().uuid("Invalid hold token"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// Same shape as booking creation, but the 3 payment fields are required
// here (they're optional on CreateBookingSchema since free bookings
// never send them).
export const VerifyPaymentSchema = CreateBookingSchema.extend({
  razorpayOrderId: z.string().min(1, "Missing razorpayOrderId"),
  razorpayPaymentId: z.string().min(1, "Missing razorpayPaymentId"),
  razorpaySignature: z.string().min(1, "Missing razorpaySignature"),
});
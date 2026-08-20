import { pgEnum } from 'drizzle-orm/pg-core';

export const slotStatus = pgEnum('slot_status', [
  'available', 'held', 'booked', 'unavailable', 'completed', 'no_show',
]);

export const bookingStatus = pgEnum('booking_status', [
  'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled',
]);

export const otpPurposeEnum = pgEnum('otp_purpose', [
  'check_bookings',
  'forgot_password',      
  'email_verification',   
]);

export const userRole = pgEnum('user_role', ['reviewer', 'admin']);
import { pgEnum } from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['reviewer', 'admin']);

export const slotStatus = pgEnum('slot_status', [
  'available', 'held', 'booked', 'unavailable', 'completed', 'no_show',
]);

export const bookingStatus = pgEnum('booking_status', [
  'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled',
]);

export const otpPurpose = pgEnum('otp_purpose', ['check_bookings']);
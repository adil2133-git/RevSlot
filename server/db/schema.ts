import { pgEnum } from 'drizzle-orm/pg-core';

// Used now — reviewers and admins are distinguished by this role
export const userRole = pgEnum('user_role', ['reviewer', 'admin']);

// Defined now, not used until slots/booking work starts
export const slotStatus = pgEnum('slot_status', [
  'available',
  'held',
  'booked',
  'unavailable',
  'completed',
  'no_show',
]);

export const bookingStatus = pgEnum('booking_status', [
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
  'rescheduled',
]);

export const otpPurpose = pgEnum('otp_purpose', ['check_bookings']);
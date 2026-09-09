import { pgEnum } from 'drizzle-orm/pg-core';

export const slotStatus = pgEnum('slot_status', [
  'available', 'held', 'booked', 'unavailable', 'completed', 'no_show',
]);

export const bookingStatus = pgEnum('booking_status', [
  'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled', 'reschedule_requested',
]);

export const otpPurposeEnum = pgEnum('otp_purpose', [
  'check_bookings',
  'forgot_password',      
  'email_verification',   
]);

export const userRole = pgEnum('user_role', ['reviewer', 'admin']);

export const feedbackFieldType = pgEnum('feedback_field_type', [
  'text', 'textarea', 'number', 'select',
]);

export const understandingLevel = pgEnum('understanding_level', [
  'excellent', 'good', 'average', 'needs_improvement',
]);

export const pendingQuestionStatus = pgEnum('pending_question_status', [
  'pending', 'reviewed',
]);

export const notificationType = pgEnum('notification_type', [
  'booking_created', 'booking_cancelled', 'booking_rescheduled', 'booking_completed', 'feedback_submitted',
]);
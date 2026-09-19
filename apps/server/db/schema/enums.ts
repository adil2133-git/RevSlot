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

export const paymentStatus = pgEnum('payment_status', [
  'created', 'captured', 'failed', 'refunded', 'partially_refunded',
]);

export const walletTxType = pgEnum('wallet_tx_type', [
  'credit_escrow', 'escrow_cleared', 'escrow_cancelled', 'withdrawal', 'cancellation_compensation',
]);

export const walletTxStatus = pgEnum('wallet_tx_status', [
  'pending', 'completed', 'failed', 'disputed',
]);

export const payoutMethod = pgEnum('payout_method', [
  'bank_account', 'upi',
]);

export const payoutRequestStatus = pgEnum('payout_request_status', [
  'requested', 'processing', 'completed', 'rejected',
]);

export const disputeReason = pgEnum('dispute_reason', [
  'reviewer_no_show', 'technical_issue', 'inadequate_review', 'other',
]);

export const disputeStatus = pgEnum('dispute_status', [
  'under_review', 'resolved_refunded', 'resolved_dismissed',
]);
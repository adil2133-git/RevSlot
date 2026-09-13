ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'reschedule_requested';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proposed_start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "proposed_end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_requested_by" varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_token" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "reschedule_token_expires_at" timestamp with time zone;
ALTER TYPE "public"."booking_status" ADD VALUE 'reschedule_requested';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "proposed_start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "proposed_end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_requested_by" varchar(50);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_reason" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_token" varchar(255);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_token_expires_at" timestamp with time zone;
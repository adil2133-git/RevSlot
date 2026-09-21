ALTER TABLE "admins" ALTER COLUMN "email_verified" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "reviewers" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "google_calendar_refresh_token" text;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "google_calendar_email" varchar(255);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "google_calendar_connected" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "meet_link" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "google_event_id" varchar(255);



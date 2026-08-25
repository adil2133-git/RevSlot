ALTER TABLE "slots" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "slots" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "booking_window_days" smallint DEFAULT 14 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "valid_booking_window" CHECK ("event_types"."booking_window_days" > 0);
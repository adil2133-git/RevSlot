ALTER TABLE "event_types" ALTER COLUMN "is_active" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "buffer_before_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "buffer_after_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_types" ADD COLUMN "meeting_link" varchar(500);
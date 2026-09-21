DO $$ BEGIN CREATE TYPE "public"."dispute_reason" AS ENUM('reviewer_no_show', 'technical_issue', 'inadequate_review', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "public"."dispute_status" AS ENUM('under_review', 'resolved_refunded', 'resolved_dismissed'); EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint
ALTER TYPE "public"."wallet_tx_status" ADD VALUE IF NOT EXISTS 'disputed';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"advisor_email" varchar(255) NOT NULL,
	"reason" "dispute_reason" NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'under_review' NOT NULL,
	"meeting_joined_by_reviewer" boolean DEFAULT false,
	"meeting_joined_by_client" boolean DEFAULT false,
	"admin_notes" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "admin_notes" text;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD COLUMN IF NOT EXISTS "processed_by" integer;--> statement-breakpoint
ALTER TABLE "booking_disputes" DROP CONSTRAINT IF EXISTS "booking_disputes_booking_id_bookings_id_fk";--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_disputes" DROP CONSTRAINT IF EXISTS "booking_disputes_resolved_by_admins_id_fk";--> statement-breakpoint
ALTER TABLE "booking_disputes" ADD CONSTRAINT "booking_disputes_resolved_by_admins_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
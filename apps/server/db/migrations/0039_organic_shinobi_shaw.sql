ALTER TYPE "public"."notification_type" ADD VALUE 'session_reminder';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_filed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'dispute_resolved';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payout_processed';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payout_rejected';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'admin_new_dispute';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'admin_new_payout';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'admin_new_reviewer';--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "reviewer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "admin_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_admin_created" ON "notifications" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_admin_unread" ON "notifications" USING btree ("admin_id","is_read");
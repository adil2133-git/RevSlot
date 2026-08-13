ALTER TABLE "admins" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
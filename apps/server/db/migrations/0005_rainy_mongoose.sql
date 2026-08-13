ALTER TABLE "admins" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviewers" ALTER COLUMN "password_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
ALTER TABLE "reviewers" ADD CONSTRAINT "reviewers_google_id_unique" UNIQUE("google_id");
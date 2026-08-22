ALTER TABLE "reviewers" ADD COLUMN "username" varchar(50);--> statement-breakpoint
ALTER TABLE "reviewers" ADD CONSTRAINT "reviewers_username_unique" UNIQUE("username");
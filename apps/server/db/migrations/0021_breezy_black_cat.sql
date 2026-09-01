ALTER TABLE "reviewers" ADD COLUMN "professional_headline" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "skills" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "current_role" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "current_company" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "degree" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "university" varchar(200);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "graduation_year" integer;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN "portfolio_url" text;
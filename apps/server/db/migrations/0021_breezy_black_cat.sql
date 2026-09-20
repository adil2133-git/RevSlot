ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "professional_headline" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "skills" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "current_role" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "current_company" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "degree" varchar(150);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "university" varchar(200);--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "graduation_year" integer;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "github_url" text;--> statement-breakpoint
ALTER TABLE "reviewers" ADD COLUMN IF NOT EXISTS "portfolio_url" text;
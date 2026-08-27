CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('check_bookings', 'forgot_password', 'email_verification');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('available', 'held', 'booked', 'unavailable', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('reviewer', 'admin');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"google_id" varchar(255),
	"avatar_url" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email"),
	CONSTRAINT "admins_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "reviewers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"username" varchar(50),
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"google_id" varchar(255),
	"whatsapp_number" varchar(20) NOT NULL,
	"avatar_url" text,
	"bio" text,
	"is_active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviewers_username_unique" UNIQUE("username"),
	CONSTRAINT "reviewers_email_unique" UNIQUE("email"),
	CONSTRAINT "reviewers_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "availability_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_template_name" UNIQUE("reviewer_id","name")
);
--> statement-breakpoint
CREATE TABLE "template_time_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"display_order" smallint,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_day_of_week" CHECK ("template_time_blocks"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "valid_time_range" CHECK ("template_time_blocks"."end_time" > "template_time_blocks"."start_time")
);
--> statement-breakpoint
CREATE TABLE "event_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"availability_template_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"meeting_link" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_event_type_slug" UNIQUE("reviewer_id","slug"),
	CONSTRAINT "valid_duration" CHECK ("event_types"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "vacation_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "valid_date_range" CHECK ("vacation_blocks"."end_date" >= "vacation_blocks"."start_date")
);
--> statement-breakpoint
CREATE TABLE "slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"slot_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "slot_status" DEFAULT 'available',
	"hold_token" text,
	"hold_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_slot_per_event" UNIQUE("event_type_id","slot_date","start_time")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"intern_name" varchar(150) NOT NULL,
	"batch" varchar(50) NOT NULL,
	"advisor_email" varchar(255) NOT NULL,
	"intern_emails" text[],
	"week_stage" varchar(255) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'confirmed',
	"cancelled_at" timestamp with time zone,
	"cancelled_reason" varchar(255),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_banks" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_bank_name" UNIQUE("reviewer_id","name")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"description" text,
	"display_order" smallint,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "template_override_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"override_id" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"display_order" smallint,
	CONSTRAINT "valid_override_time_range" CHECK ("template_override_blocks"."end_time" > "template_override_blocks"."start_time")
);
--> statement-breakpoint
CREATE TABLE "template_date_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"date" date NOT NULL,
	"is_unavailable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_template_override_date" UNIQUE("template_id","date")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" "user_role" NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "availability_templates" ADD CONSTRAINT "availability_templates_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_time_blocks" ADD CONSTRAINT "template_time_blocks_template_id_availability_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "public"."availability_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_blocks" ADD CONSTRAINT "vacation_blocks_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_question_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_override_blocks" ADD CONSTRAINT "template_override_blocks_override_id_template_date_overrides_id_fk" FOREIGN KEY ("override_id") REFERENCES "public"."template_date_overrides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_date_overrides" ADD CONSTRAINT "template_date_overrides_template_id_availability_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admins_email" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_reviewers_email" ON "reviewers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_availability_templates_reviewer" ON "availability_templates" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_template_time_blocks_template" ON "template_time_blocks" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_event_types_reviewer" ON "event_types" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_event_types_template" ON "event_types" USING btree ("availability_template_id");--> statement-breakpoint
CREATE INDEX "idx_vacation_blocks_reviewer_dates" ON "vacation_blocks" USING btree ("reviewer_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_slots_event_type_date" ON "slots" USING btree ("event_type_id","slot_date");--> statement-breakpoint
CREATE INDEX "idx_slots_reviewer_date" ON "slots" USING btree ("reviewer_id","slot_date");--> statement-breakpoint
CREATE INDEX "idx_slots_status" ON "slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_slots_hold_expiry" ON "slots" USING btree ("hold_expires_at") WHERE "slots"."status" = 'held';--> statement-breakpoint
CREATE INDEX "idx_question_banks_reviewer" ON "question_banks" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_questions_bank" ON "questions" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "idx_questions_order" ON "questions" USING btree ("bank_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_template_date_overrides_template" ON "template_date_overrides" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_hash" ON "refresh_tokens" USING btree ("token_hash");
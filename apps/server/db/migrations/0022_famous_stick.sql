CREATE TYPE "public"."feedback_field_type" AS ENUM('text', 'textarea', 'number', 'select');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"reviewer_id" integer NOT NULL,
	"form_id" integer NOT NULL,
	"is_no_show" boolean DEFAULT false NOT NULL,
	"review_mark" numeric(3, 1),
	"task_mark" numeric(3, 1),
	"comments" text,
	"custom_field_values" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "feedback_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "feedback_form_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"label" varchar(150) NOT NULL,
	"field_type" "feedback_field_type" DEFAULT 'text' NOT NULL,
	"options" text[],
	"required" boolean DEFAULT false NOT NULL,
	"display_order" smallint,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_feedback_form_name" UNIQUE("reviewer_id","name")
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_form_id_feedback_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_form_fields" ADD CONSTRAINT "feedback_form_fields_form_id_feedback_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_forms" ADD CONSTRAINT "feedback_forms_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_booking" ON "feedback" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_form_fields_form" ON "feedback_form_fields" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_feedback_forms_reviewer" ON "feedback_forms" USING btree ("reviewer_id");
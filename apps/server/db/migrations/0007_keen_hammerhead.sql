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
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE restrict ON UPDATE no action;
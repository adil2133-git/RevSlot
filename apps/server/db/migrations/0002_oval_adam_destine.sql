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
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
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
ALTER TABLE "availability_templates" ADD CONSTRAINT "availability_templates_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_time_blocks" ADD CONSTRAINT "template_time_blocks_template_id_availability_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "public"."availability_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_blocks" ADD CONSTRAINT "vacation_blocks_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_event_type_id_event_types_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slots" ADD CONSTRAINT "slots_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_availability_templates_reviewer" ON "availability_templates" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_template_time_blocks_template" ON "template_time_blocks" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_event_types_reviewer" ON "event_types" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_event_types_template" ON "event_types" USING btree ("availability_template_id");--> statement-breakpoint
CREATE INDEX "idx_vacation_blocks_reviewer_dates" ON "vacation_blocks" USING btree ("reviewer_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_slots_event_type_date" ON "slots" USING btree ("event_type_id","slot_date");--> statement-breakpoint
CREATE INDEX "idx_slots_reviewer_date" ON "slots" USING btree ("reviewer_id","slot_date");--> statement-breakpoint
CREATE INDEX "idx_slots_status" ON "slots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_slots_hold_expiry" ON "slots" USING btree ("hold_expires_at") WHERE "slots"."status" = 'held';
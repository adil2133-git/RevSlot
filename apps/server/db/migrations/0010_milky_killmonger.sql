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
ALTER TABLE "template_override_blocks" ADD CONSTRAINT "template_override_blocks_override_id_template_date_overrides_id_fk" FOREIGN KEY ("override_id") REFERENCES "public"."template_date_overrides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_date_overrides" ADD CONSTRAINT "template_date_overrides_template_id_availability_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_template_date_overrides_template" ON "template_date_overrides" USING btree ("template_id");
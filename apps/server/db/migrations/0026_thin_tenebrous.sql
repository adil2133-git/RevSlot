CREATE TYPE "public"."understanding_level" AS ENUM('excellent', 'good', 'average', 'needs_improvement');--> statement-breakpoint
CREATE TABLE "feedback_form_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"display_order" smallint,
	CONSTRAINT "unique_form_question" UNIQUE("form_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "feedback_form_fields" DROP CONSTRAINT "feedback_form_fields_form_id_feedback_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "understanding_level" "understanding_level";--> statement-breakpoint
ALTER TABLE "feedback_forms" ADD COLUMN "task_mark_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_forms" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_form_questions" ADD CONSTRAINT "feedback_form_questions_form_id_feedback_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_form_questions" ADD CONSTRAINT "feedback_form_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_form_questions_form" ON "feedback_form_questions" USING btree ("form_id");--> statement-breakpoint
ALTER TABLE "feedback_form_fields" ADD CONSTRAINT "feedback_form_fields_form_id_feedback_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE cascade ON UPDATE no action;
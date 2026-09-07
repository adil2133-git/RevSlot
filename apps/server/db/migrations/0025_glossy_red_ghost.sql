ALTER TABLE "event_types" DROP CONSTRAINT "event_types_feedback_form_id_feedback_forms_id_fk";
--> statement-breakpoint
ALTER TABLE "feedback_form_fields" DROP CONSTRAINT "feedback_form_fields_form_id_feedback_forms_id_fk";
--> statement-breakpoint
DROP INDEX "idx_event_types_feedback_form";--> statement-breakpoint
ALTER TABLE "feedback_form_fields" ADD CONSTRAINT "feedback_form_fields_form_id_feedback_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_types" DROP COLUMN "feedback_form_id";
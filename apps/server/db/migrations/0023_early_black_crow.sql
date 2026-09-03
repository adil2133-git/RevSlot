ALTER TABLE "event_types" ADD COLUMN "feedback_form_id" integer;--> statement-breakpoint
ALTER TABLE "event_types" ADD CONSTRAINT "event_types_feedback_form_id_feedback_forms_id_fk" FOREIGN KEY ("feedback_form_id") REFERENCES "public"."feedback_forms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_types_feedback_form" ON "event_types" USING btree ("feedback_form_id");--> statement-breakpoint
-- Backfill: give every reviewer who has at least one event type a
-- default feedback form, mirroring ensureDefaultForm() in
-- feedback.service.ts (name + is_default must match exactly, since
-- that function checks by is_default = true, not by name).
INSERT INTO "feedback_forms" ("reviewer_id", "name", "is_default")
SELECT DISTINCT et."reviewer_id", 'Default Feedback Form', true
FROM "event_types" et
WHERE NOT EXISTS (
  SELECT 1 FROM "feedback_forms" ff
  WHERE ff."reviewer_id" = et."reviewer_id" AND ff."is_default" = true
);--> statement-breakpoint
-- Point every existing event type at its reviewer's default form.
UPDATE "event_types" et
SET "feedback_form_id" = ff."id"
FROM "feedback_forms" ff
WHERE ff."reviewer_id" = et."reviewer_id"
  AND ff."is_default" = true
  AND et."feedback_form_id" IS NULL;
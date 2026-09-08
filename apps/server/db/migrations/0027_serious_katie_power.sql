CREATE TYPE "public"."pending_question_status" AS ENUM('pending', 'reviewed');--> statement-breakpoint
CREATE TABLE "feedback_pending_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"feedback_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"status" "pending_question_status" DEFAULT 'pending' NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	CONSTRAINT "unique_feedback_question" UNIQUE("feedback_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "feedback_pending_questions" ADD CONSTRAINT "feedback_pending_questions_feedback_id_feedback_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_pending_questions" ADD CONSTRAINT "feedback_pending_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_feedback_pending_questions_feedback" ON "feedback_pending_questions" USING btree ("feedback_id");
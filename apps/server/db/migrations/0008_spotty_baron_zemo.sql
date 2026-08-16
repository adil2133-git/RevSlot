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
ALTER TABLE "question_banks" ADD CONSTRAINT "question_banks_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_bank_id_question_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."question_banks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_question_banks_reviewer" ON "question_banks" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_questions_bank" ON "questions" USING btree ("bank_id");--> statement-breakpoint
CREATE INDEX "idx_questions_order" ON "questions" USING btree ("bank_id","display_order");
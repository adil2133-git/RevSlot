CREATE TYPE "public"."payment_status" AS ENUM('created', 'captured', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('bank_account', 'upi');--> statement-breakpoint
CREATE TYPE "public"."payout_request_status" AS ENUM('requested', 'processing', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM('credit_escrow', 'escrow_cleared', 'escrow_cancelled', 'withdrawal', 'cancellation_compensation');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"hold_token" varchar(100) NOT NULL,
	"reviewer_id" integer NOT NULL,
	"advisor_email" varchar(255),
	"razorpay_order_id" varchar(100) NOT NULL,
	"razorpay_payment_id" varchar(100),
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"refund_id" varchar(100),
	"refund_amount" integer DEFAULT 0,
	"cancellation_fee" integer DEFAULT 0,
	"refund_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payments_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payments_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"status" "payout_request_status" DEFAULT 'requested' NOT NULL,
	"transaction_reference" varchar(100),
	"notes" text,
	"requested_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviewer_payout_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"payout_method" "payout_method" DEFAULT 'bank_account' NOT NULL,
	"account_holder_name" varchar(150),
	"account_number" varchar(50),
	"ifsc_code" varchar(20),
	"upi_id" varchar(100),
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviewer_payout_profiles_reviewer_id_unique" UNIQUE("reviewer_id")
);
--> statement-breakpoint
CREATE TABLE "reviewer_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"pending_balance" integer DEFAULT 0 NOT NULL,
	"available_balance" integer DEFAULT 0 NOT NULL,
	"withdrawn_balance" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviewer_wallets_reviewer_id_unique" UNIQUE("reviewer_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewer_id" integer NOT NULL,
	"booking_id" integer,
	"type" "wallet_tx_type" NOT NULL,
	"amount" integer NOT NULL,
	"status" "wallet_tx_status" DEFAULT 'completed' NOT NULL,
	"description" text,
	"available_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reviewers" ALTER COLUMN "whatsapp_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "reschedule_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_payout_profiles" ADD CONSTRAINT "reviewer_payout_profiles_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewer_wallets" ADD CONSTRAINT "reviewer_wallets_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reviewer_id_reviewers_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."reviewers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
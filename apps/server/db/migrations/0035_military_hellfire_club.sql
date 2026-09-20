ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "razorpay_order_id" varchar(100);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" varchar(100);
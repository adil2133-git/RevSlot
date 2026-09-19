ALTER TABLE "bookings" ADD COLUMN "razorpay_order_id" varchar(100);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "razorpay_payment_id" varchar(100);
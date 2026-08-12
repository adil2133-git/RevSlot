CREATE TYPE "public"."booking_status" AS ENUM('confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled');
CREATE TYPE "public"."otp_purpose" AS ENUM('check_bookings');
CREATE TYPE "public"."slot_status" AS ENUM('available', 'held', 'booked', 'unavailable', 'completed', 'no_show');
CREATE TYPE "public"."user_role" AS ENUM('reviewer', 'admin');
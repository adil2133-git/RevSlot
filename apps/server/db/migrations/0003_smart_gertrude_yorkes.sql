DROP INDEX "idx_slots_hold_expiry";--> statement-breakpoint
CREATE INDEX "idx_slots_hold_expiry" ON "slots" USING btree ("hold_expires_at") WHERE "slots"."status" = 'held';
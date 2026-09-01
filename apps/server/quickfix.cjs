require('dotenv').config();
const { Client } = require('pg');
const crypto = require('crypto');
const fs = require('fs');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query('BEGIN');

    const col = await c.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'rescheduled_from_booking_id'");
    if (col.rows.length === 0) {
      await c.query('ALTER TABLE "bookings" ADD COLUMN "rescheduled_from_booking_id" integer');
    }

    const fk = await c.query("SELECT 1 FROM pg_constraint WHERE conname = 'bookings_rescheduled_from_booking_id_bookings_id_fk'");
    if (fk.rows.length === 0) {
      await c.query('ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rescheduled_from_booking_id_bookings_id_fk" FOREIGN KEY ("rescheduled_from_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action');
    }

    const tbl = await c.query("SELECT to_regclass('public.audit_logs') AS exists");
    if (!tbl.rows[0].exists) {
      await c.query(`CREATE TABLE "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "actor_id" integer NOT NULL,
        "actor_role" "user_role" NOT NULL,
        "actor_name" varchar(150) NOT NULL,
        "action" varchar(100) NOT NULL,
        "target_type" varchar(100),
        "target_id" integer,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )`);
    }

    await c.query('CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at")');
    await c.query('CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id","actor_role")');
    await c.query('CREATE INDEX IF NOT EXISTS "idx_audit_logs_target" ON "audit_logs" USING btree ("target_type","target_id")');

    const journal = JSON.parse(fs.readFileSync('./db/migrations/meta/_journal.json', 'utf8'));
    for (const tag of ['0019_useful_the_fallen', '0020_premium_violations']) {
      const entry = journal.entries.find(e => e.tag === tag);
      const sqlText = fs.readFileSync('./db/migrations/' + tag + '.sql', 'utf8');
      const hash = crypto.createHash('sha256').update(sqlText).digest('hex');
      const existing = await c.query('SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1', [hash]);
      if (existing.rows.length === 0) {
        await c.query('INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at") VALUES ($1, $2)', [hash, entry.when]);
      }
    }

    await c.query('COMMIT');
    console.log('DONE: audit_logs created + migrations recorded.');
  } catch (err) {
    await c.query('ROLLBACK');
    console.error('FAILED:', err.message);
  } finally {
    await c.end();
  }
})();

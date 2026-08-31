const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/revslot' });
c.connect().then(async () => {
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
  await c.query(`CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at")`);
  await c.query(`CREATE INDEX "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id","actor_role")`);
  await c.query(`CREATE INDEX "idx_audit_logs_target" ON "audit_logs" USING btree ("target_type","target_id")`);
  console.log('audit_logs table created successfully');
  c.end();
}).catch(e => console.error('ERROR:', e.message));

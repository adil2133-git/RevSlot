const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/revslot' });
c.connect().then(async () => {
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'audit_logs'");
  console.log(r.rows.length ? 'audit_logs table EXISTS' : 'audit_logs table NOT FOUND');
  c.end();
}).catch(e => console.error('ERROR:', e.message));

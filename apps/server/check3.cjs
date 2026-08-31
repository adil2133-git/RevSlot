const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/revslot' });
c.connect().then(async () => {
  const r = await c.query("SELECT count(*) FROM drizzle.__drizzle_migrations");
  console.log('Applied count:', r.rows[0].count);
  c.end();
}).catch(e => console.error('ERROR:', e.message));

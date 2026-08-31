const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/revslot' });
c.connect().then(async () => {
  const r = await c.query("SELECT * FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 5");
  console.log(r.rows);
  c.end();
}).catch(e => console.error('ERROR:', e.message));

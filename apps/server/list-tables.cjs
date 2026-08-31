const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/revslot' });
c.connect().then(async () => {
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log(r.rows.map(row => row.table_name).join('\n'));
  c.end();
}).catch(e => console.error('ERROR:', e.message));

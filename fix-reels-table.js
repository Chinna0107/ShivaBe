const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_UcaO1TAHtqp9@ep-old-mud-axuvtnjt.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function fix() {
  try {
    await pool.query('ALTER TABLE reels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false');
    await pool.query('ALTER TABLE reels ADD COLUMN IF NOT EXISTS url TEXT');
    await pool.query('ALTER TABLE reels ADD COLUMN IF NOT EXISTS label VARCHAR(255)');
    console.log('Fixed columns added');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

fix();

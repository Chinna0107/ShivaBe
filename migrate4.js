const db = require('./db');

async function migrate() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS claim_ratios (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        company VARCHAR(100) NOT NULL,
        story TEXT NOT NULL,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ claim_ratios table ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
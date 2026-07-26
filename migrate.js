const db = require('./db');

async function migrate() {
  try {
    console.log('Starting migration to add new columns to leads table...');
    
    // Add columns one by one. Using IF NOT EXISTS requires Postgres 9.6+, which Neon supports.
    // However, ADD COLUMN IF NOT EXISTS is just ADD COLUMN ...
    const query = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS specific_plan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS employment_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS annual_income VARCHAR(100),
      ADD COLUMN IF NOT EXISTS education VARCHAR(100),
      ADD COLUMN IF NOT EXISTS smoker VARCHAR(20)
    `;
    
    await db.query(query);
    console.log('Migration completed successfully. New columns added to leads table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

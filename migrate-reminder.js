const db = require('./db');

async function migrateReminders() {
  try {
    console.log('Adding reminder column to calls, quotes, and premiums...');
    
    await db.query(`ALTER TABLE call_requests ADD COLUMN IF NOT EXISTS reminder TEXT`);
    await db.query(`ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS reminder TEXT`);
    await db.query(`ALTER TABLE premium_requests ADD COLUMN IF NOT EXISTS reminder TEXT`);
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrateReminders();

const db = require('./db');
const bcrypt = require('bcrypt');

async function migrate() {
  try {
    console.log('Starting migration to add password_hash to employees table...');
    
    // Add password_hash column
    await db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    
    // Update existing employees with a default password 'password123'
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    await db.query(`UPDATE employees SET password_hash = $1 WHERE password_hash IS NULL`, [hash]);
    
    console.log('Migration completed successfully. New column added to employees table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

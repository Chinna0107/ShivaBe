const db = require('./db');

async function migrate() {
  try {
    console.log('Adding vehicle_condition column to leads table...');
    await db.query(`
      ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS vehicle_condition VARCHAR(20)
    `);
    console.log('✅ vehicle_condition column added successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

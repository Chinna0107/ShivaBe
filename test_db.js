const db = require('./db');
async function run() {
  try {
    await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS policy_document_url VARCHAR`);
    console.log("Migration successful");
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();

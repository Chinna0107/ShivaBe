const db = require('./db');

async function migrateClaims() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS claim_requests (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(100),
        registered_name VARCHAR(150),
        mobile_number VARCHAR(20),
        email_id VARCHAR(150),
        claim_issue TEXT,
        plan_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(createTableQuery);
    console.log('claim_requests table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating claim_requests table:', error);
    process.exit(1);
  }
}

migrateClaims();

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_UcaO1TAHtqp9@ep-old-mud-axuvtnjt.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  const db = { query: (text, params) => pool.query(text, params) };

  try {
    console.log('🚀 Starting full migration on new DB...\n');

    // 1. admin_users
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    console.log('✅ admin_users table ready');

    // 2. employees
    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ employees table ready');

    // 3. leads (full schema including vehicle_condition)
    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        type VARCHAR(50) NOT NULL,
        gender VARCHAR(20),
        specific_plan VARCHAR(100),
        location VARCHAR(255),
        employment_type VARCHAR(100),
        annual_income VARCHAR(100),
        education VARCHAR(100),
        smoker VARCHAR(20),
        members TEXT,
        vehicle_number VARCHAR(50),
        vehicle_type VARCHAR(20),
        vehicle_manufacturer VARCHAR(100),
        vehicle_model VARCHAR(100),
        vehicle_fuel_type VARCHAR(50),
        vehicle_condition VARCHAR(20),
        vehicle_reg_date DATE,
        vehicle_pincode VARCHAR(10),
        policy_document_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ leads table ready (with vehicle_condition)');

    // 4. otps
    await db.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ otps table ready');

    // 5. call_requests
    await db.query(`
      CREATE TABLE IF NOT EXISTS call_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        preferred_time VARCHAR(100) NOT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ call_requests table ready');

    // 6. policies
    await db.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        provider VARCHAR(100) NOT NULL,
        description TEXT,
        cover_amount VARCHAR(100),
        pros TEXT,
        cons TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        pdf_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ policies table ready');

    // 7. best_plans
    await db.query(`
      CREATE TABLE IF NOT EXISTS best_plans (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        rank INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        badge VARCHAR(100),
        premium VARCHAR(100),
        cover VARCHAR(100),
        claim_ratio VARCHAR(100),
        highlight TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ best_plans table ready');

    // 8. users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ users table ready');

    // 9. quote_requests
    await db.query(`
      CREATE TABLE IF NOT EXISTS quote_requests (
        id SERIAL PRIMARY KEY,
        age VARCHAR(20) NOT NULL,
        cover_amount VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        policy_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ quote_requests table ready');

    // 10. premium_requests
    await db.query(`
      CREATE TABLE IF NOT EXISTS premium_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age VARCHAR(20) NOT NULL,
        cover_amount VARCHAR(50) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        policy_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ premium_requests table ready');

    // 11. gallery
    await db.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ gallery table ready');

    // 12. claim_ratios
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

    // 13. careers (check route for schema)
    await db.query(`
      CREATE TABLE IF NOT EXISTS careers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        requirements TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ careers table ready');

    // 14. reels
    await db.query(`
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ reels table ready');

    // ──────────────────────────────────────────────
    // Seed admin: admin@insuranceshiva.com / Siva@123
    // ──────────────────────────────────────────────
    const existing = await db.query("SELECT id FROM admin_users WHERE username = 'admin@insuranceshiva.com'");
    if (existing.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Siva@123', salt);
      await db.query(
        'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
        ['admin@insuranceshiva.com', hash]
      );
      console.log('\n👤 Admin seeded: admin@insuranceshiva.com / Siva@123');
    } else {
      // Update password in case it was different
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Siva@123', salt);
      await db.query(
        'UPDATE admin_users SET password_hash = $1 WHERE username = $2',
        [hash, 'admin@insuranceshiva.com']
      );
      console.log('\n👤 Admin already exists — password updated to Siva@123');
    }

    console.log('\n🎉 Full migration complete on new DB!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

run();

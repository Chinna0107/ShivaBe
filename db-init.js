const db = require('./db');
const bcrypt = require('bcrypt');

async function initializeDB() {
  try {
    // 1. Create admin_users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL
      );
    `);
    console.log('admin_users table ensured.');

    // 2. Create employees table
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
    console.log('employees table ensured.');

    // 3. Create leads table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('leads table ensured.');

    // 4. Seed admin user if none exists
    const res = await db.query('SELECT COUNT(*) FROM admin_users');
    if (parseInt(res.rows[0].count) === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      await db.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
      console.log('Seeded initial admin user: admin / admin123');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Database initialization complete!');
    await db.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("otps table created or already exists.");

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
      )
    `);
    // Migration: add notes column if it doesn't exist on older DBs
    await db.query(`
      ALTER TABLE call_requests ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    console.log("call_requests table created or already exists.");

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
      )
    `);
    await db.query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS pdf_url TEXT`);
    console.log("policies table created or already exists.");

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
      )
    `);
    console.log("best_plans table created or already exists.");

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("users table created or already exists.");

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
      )
    `);
    console.log("quote_requests table created or already exists.");

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
      )
    `);
    console.log("premium_requests table created or already exists.");

    await db.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        caption TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('gallery table created or already exists.');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    process.exit(0);
  }
}

initializeDB();

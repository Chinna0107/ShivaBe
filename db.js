const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool using the Neon Database URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};

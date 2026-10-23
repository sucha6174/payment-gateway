const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
    console.log('Database schema initialized and test merchant verified.');
  } catch (error) {
    console.error('Failed to initialize database schema:', error.message);
  }
}

// Graceful shutdown handling for connection pool
const gracefulShutdown = async () => {
  console.log('Closing database connection pool...');
  try {
    await pool.end();
    console.log('Database connection pool closed successfully.');
  } catch (err) {
    console.error('Error closing database connection pool:', err);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb,
  gracefulShutdown
};

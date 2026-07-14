import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.NODE_ENV === 'test'
  ? process.env.DATABASE_URL_TEST || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

export const pool = new Pool({ connectionString });

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      street VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      state VARCHAR(255) NOT NULL,
      zip VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logs (
      id SERIAL PRIMARY KEY,
      address_id INTEGER REFERENCES addresses(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(20) NOT NULL,
      old_data JSONB,
      new_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function resetDatabase() {
  await pool.query('TRUNCATE TABLE logs, addresses, users RESTART IDENTITY CASCADE');
}
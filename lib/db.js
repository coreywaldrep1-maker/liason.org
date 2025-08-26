import { Pool } from 'pg';

/**
 * Uses pooled connection string (recommended for Vercel Postgres).
 * Make sure DATABASE_URL is set in Vercel → Settings → Environment Variables.
 * If your Vercel Storage created POSTGRES_URL, you can copy that value into DATABASE_URL.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[db] DATABASE_URL is not set. API routes using the DB will fail.');
}

let globalPool = globalThis.__LIASON_PG_POOL;

if (!globalPool) {
  globalPool = new Pool({
    connectionString,
    // Most Vercel Postgres URLs already include sslmode=require.
    // This ssl config is safe if it doesn't.
    ssl: { rejectUnauthorized: false }
  });
  globalThis.__LIASON_PG_POOL = globalPool;
}

export const pool = globalPool;

export async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

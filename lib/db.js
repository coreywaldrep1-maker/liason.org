// lib/db.js
import { neon } from '@neondatabase/serverless';

// Ensure your DATABASE_URL is set in Vercel env vars
if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}

// Tagged template interface for SQL queries
export const sql = neon(process.env.DATABASE_URL);

// Compatibility shims for code that expects node-postgres style:
export function getPool() {
  return {
    query: (text, params) => sql.unsafe(text, params),
  };
}

export function query(text, params = []) {
  return sql.unsafe(text, params);
}

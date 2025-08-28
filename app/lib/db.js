// lib/db.js
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}

// Tagged template interface:
export const sql = neon(process.env.DATABASE_URL);

// Compatibility shims for code that expects node-postgres style:
export function getPool() {
  // Return a minimal "pool-like" object with .query(text, params)
  return {
    query: (text, params) => sql.unsafe(text, params),
  };
}

export function query(text, params = []) {
  return sql.unsafe(text, params);
}

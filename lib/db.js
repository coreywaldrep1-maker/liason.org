// lib/db.js
import { neon } from '@neondatabase/serverless';

// Ensure your DATABASE_URL is set in Vercel env vars
if (!process.env.DATABASE_URL) {
  throw new Error('Missing env: DATABASE_URL');
}

// Neon HTTP SQL helper (tagged template)
const sql = neon(process.env.DATABASE_URL);

// Default export for: import sql from '@/lib/db';
export default sql;

// (Optional) named export if you prefer: import { sql } from '@/lib/db';
export { sql };

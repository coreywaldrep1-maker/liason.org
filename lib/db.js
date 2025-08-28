// lib/db.js
import { neon } from '@neondatabase/serverless';

let _sql = null;
export function getSql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing');
  _sql = neon(url);
  return _sql;
}
export const sql = (...args) => getSql()(...args);

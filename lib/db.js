// lib/db.js
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,                // serverless-friendly
  idle_timeout: 5,
});

export default sql;

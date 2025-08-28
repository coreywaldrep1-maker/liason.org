// app/api/dbtest/route.js
export const runtime = 'nodejs'; // ensure Node runtime (not Edge)

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires SSL. Usually in the URL (?sslmode=require) but this helps locally too:
  ssl: { rejectUnauthorized: false }
});

export async function GET() {
  try {
    const { rows } = await pool.query(
      'select now() as now, current_user as db_user, version() as pg_version'
    );
    return Response.json({ ok: true, ...rows[0] });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500 }
    );
  }
}

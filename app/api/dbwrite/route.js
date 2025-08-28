export const runtime = 'nodejs';

import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST() {
  try {
    await pool.query(`
      create table if not exists heartbeat (
        id bigserial primary key,
        ts timestamptz not null default now()
      )
    `);
    const { rows } = await pool.query(
      'insert into heartbeat default values returning id, ts'
    );
    return Response.json({ ok: true, inserted: rows[0] });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}

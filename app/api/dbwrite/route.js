import { neon, neonConfig } from '@neondatabase/serverless';

// Cache connections across invocations (faster cold starts on Vercel)
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    // Ensure a test table exists
    await sql`
      CREATE TABLE IF NOT EXISTS test_writes (
        id bigserial PRIMARY KEY,
        note text,
        created_at timestamptz DEFAULT now()
      )
    `;

    // neon() returns an array of rows (NOT { rows })
    const rows = await sql`
      INSERT INTO test_writes (note)
      VALUES ('hello from vercel')
      RETURNING id, note, created_at
    `;

    return Response.json({ ok: true, row: rows[0] });
  } catch (err) {
    console.error('dbwrite error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

// Optional: GET /api/dbwrite to read back last few rows for sanity
export async function GET() {
  try {
    const rows = await sql`
      SELECT id, note, created_at
      FROM test_writes
      ORDER BY id DESC
      LIMIT 5
    `;
    return Response.json({ ok: true, rows });
  } catch (err) {
    console.error('dbwrite GET error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

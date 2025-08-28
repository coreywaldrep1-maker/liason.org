import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export async function POST() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS test_writes (
      id bigserial PRIMARY KEY,
      note text,
      created_at timestamptz DEFAULT now()
    );`;
    const { rows } = await sql`
      INSERT INTO test_writes (note) 
      VALUES ('hello from vercel') 
      RETURNING id, note, created_at
    `;
    return Response.json({ ok: true, row: rows[0] });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

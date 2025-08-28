// app/api/db-test/route.js
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`select now() as now`;
    return Response.json({ ok: true, now: rows[0].now });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
}

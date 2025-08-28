// app/api/dbtest/route.js
import { neon } from '@neondatabase/serverless';

export async function GET() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      return new Response(
        JSON.stringify({ ok: false, error: 'DATABASE_URL missing' }),
        { status: 500 }
      );
    }
    const sql = neon(url);
    const rows = await sql`select now() as now`;
    return Response.json({ ok: true, now: rows[0].now });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500 }
    );
  }
}

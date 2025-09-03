// app/api/i129f/save/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';
import { verifyJWT } from '@/lib/auth';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const token = cookies().get('liason_token')?.value;
    if (!token) return NextResponse.json({ ok:false, error:'no-jwt' }, { status:401 });
    const user = await verifyJWT(token).catch(() => null);
    if (!user) return NextResponse.json({ ok:false, error:'bad-jwt' }, { status:401 });

    const { data } = await req.json();
    if (!data) return NextResponse.json({ ok:false, error:'no-data' }, { status:400 });

    await sql`
      INSERT INTO i129f_entries (user_id, data)
      VALUES (${user.id}::uuid, ${JSON.stringify(data)}::jsonb)
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;

    return NextResponse.json({ ok:true });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}

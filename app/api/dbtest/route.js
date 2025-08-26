import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const r = await query('select now()');
    return NextResponse.json({ ok:true, now: r.rows[0].now });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok:false, error: String(e) }, { status: 500 });
  }
}

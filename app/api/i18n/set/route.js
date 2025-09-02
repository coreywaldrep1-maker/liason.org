import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { lang } = await request.json();
    if (!lang) return NextResponse.json({ ok:false, error:'lang required' }, { status:400 });
    const res = NextResponse.json({ ok:true });
    // 365 days
    res.cookies.set('liason_lang', lang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: true,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}

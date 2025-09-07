import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
    return NextResponse.json({ 
      ok: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

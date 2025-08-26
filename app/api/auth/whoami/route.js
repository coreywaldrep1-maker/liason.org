import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const enc = new TextEncoder();

export async function GET() {
  const res = NextResponse.next();
  // Next.js App Router exposes cookies via headers.get('cookie') in edge runtime,
  // but here we can read from Request cookies in route handlers:
  return NextResponse.json(await getUser());
}

async function getUser() {
  try {
    const cookie = require('next/headers').cookies().get('liason_token')?.value;
    if (!cookie) return { user: null };
    const { payload } = await jwtVerify(cookie, enc.encode(process.env.JWT_SECRET));
    return { user: { id: payload.sub, email: payload.email } };
  } catch {
    return { user: null };
  }
}

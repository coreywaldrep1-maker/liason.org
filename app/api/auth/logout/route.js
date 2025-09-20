// app/api/auth/logout/route.js
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

/**
 * Clear auth/session cookies and redirect home.
 * Works for both GET (link click) and POST (form or fetch).
 * Tweak cookie names if yours are different.
 */
function logoutResponse() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));

  // Common cookie names your app might be using — clear them all, harmless if not present
  const cookieNames = [
    'token', 'jwt', 'auth', 'session',
    'Authorization',             // just in case you stuffed the bearer in a cookie
    'liason_lang'                // keep or remove; uncomment to keep language
  ];

  for (const name of cookieNames) {
    // Delete by setting an already-expired cookie
    res.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
  }

  return res;
}

export async function GET()  { return logoutResponse(); }
export async function POST() { return logoutResponse(); }

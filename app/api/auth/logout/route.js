import { NextResponse } from 'next/server';

export async function POST() {
  // Create the response
  const response = NextResponse.json({ ok: true });
  
  // Clear the auth cookie - make sure the path matches your login cookie path
  response.cookies.set('liason_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0) // Immediately expire the cookie
  });
  
  return response;
}

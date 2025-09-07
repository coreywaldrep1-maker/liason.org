// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  
  // Clear the auth cookie
  response.cookies.delete('liason_token');
  
  return response;
}

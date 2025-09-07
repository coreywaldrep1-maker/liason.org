import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true });
    
    // Clear the auth cookie
    response.cookies.delete('liason_token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { ok: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

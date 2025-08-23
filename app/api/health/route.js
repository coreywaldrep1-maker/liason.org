// app/api/health/route.js
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export function GET() {
  return NextResponse.json({
    openaiKeyPresent: !!process.env.OPENAI_API_KEY,
    model: process.env.LIASON_AI_MODEL || 'gpt-4o-mini (default)',
    env: process.env.VERCEL_ENV || 'unknown'
  });
}

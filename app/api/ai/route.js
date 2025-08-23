// app/api/ai/route.js
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

const MODEL = process.env.LIASON_AI_MODEL || 'gpt-4o-mini';
const SYSTEM = `
You are Liason, a multilingual visa-prep assistant. You are NOT a lawyer.
Answer clearly and concisely (<=200 words unless asked). Use the user's language.
Do not add disclaimers; the page already shows one.
`;

export async function POST(req) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

    const { message, language = 'en', section = 'general', context = '' } = await req.json();
    if (!message || !message.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 });

    const userPrompt = [
      `Language: ${language}`,
      `Form/section: ${section}`,
      context ? `Context:\n${context}` : '',
      `User question:\n${message}`,
      `If the user asks for legal advice or a guarantee, tell them to consult a licensed attorney.`
    ].filter(Boolean).join('\n\n');

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!r.ok) return NextResponse.json({ error: 'Upstream error' }, { status: 502 });

    const j = await r.json();
    const raw = (j?.choices?.[0]?.message?.content || '').trim();
    const text = raw.replace(/\s*not legal advice\.?$/i, '').trim();
    if (!text) return NextResponse.json({ error: 'Empty model response' }, { status: 502 });

    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: 'Server error', details: String(e) }, { status: 500 });
  }
}

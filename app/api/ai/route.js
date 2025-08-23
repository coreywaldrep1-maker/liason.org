import { NextResponse } from 'next/server';

const MODEL = process.env.LIASON_AI_MODEL || 'gpt-4o-mini';
const SYSTEM = `
You are Liason, a multilingual visa-prep assistant. You are NOT a lawyer.
Explain clearly, ≤200 words unless asked. Use user's language. Always end with:
"Not legal advice."
`;

export async function POST(req) {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });

    const { message, language = 'en', section = 'general', context = '' } = await req.json();

    const prompt = [
      `Language: ${language}`,
      `Form/section: ${section}`,
      context ? `Context:\n${context}` : '',
      `User:\n${message}`,
    ].filter(Boolean).join('\n\n');

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!r.ok) return NextResponse.json({ error: 'Upstream error', details: await r.text() }, { status: 502 });

    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content?.trim() || 'No answer.';
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: 'Server error', details: String(e) }, { status: 500 });
  }
}

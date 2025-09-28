// app/api/i129f/pdf/route.js
export const runtime = 'nodejs';

import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

async function loadSavedDraft(req) {
  const url = new URL('/api/i129f/load', req.url);
  const res = await fetch(url, { headers:{ cookie:req.headers.get('cookie')||'' }, cache:'no-store', credentials:'include' });
  if (!res.ok) throw new Error(`load failed: ${res.status}`);
  const j = await res.json();
  if (!j?.ok) throw new Error('load not ok');
  return j.data || {};
}
async function applyMappingCompat(saved, form) {
  const mod = await import('@/lib/i129f-mapping.js').catch(async()=>await import('@/lib/i129f-mapping'));
  const fns = [mod.applyI129fMapping, mod.mapI129F, mod.mapI129f, mod.default].filter(Boolean);
  if (!fns.length) throw new Error('no mapping export');
  for (const fn of fns) { try { await fn(saved, form); return; } catch {} try { await fn(form, saved); return; } catch {} }
  throw new Error('mapper invocation failed');
}
export async function GET(req) {
  try {
    const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const pdfBytes = await fs.readFile(pdfPath);
    const saved = await loadSavedDraft(req);

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    await applyMappingCompat(saved, form);
    try { form.flatten(); } catch {}
    const out = await pdfDoc.save();

    return new Response(Buffer.from(out), { status:200, headers:{ 'Content-Type':'application/pdf', 'Content-Disposition':'attachment; filename="I-129F.pdf"', 'Cache-Control':'no-store' } });
  } catch (err) {
    console.error('I-129F PDF error:', err);
    return Response.json({ ok:false, error:String(err?.message||err) }, { status:500 });
  }
}

// app/api/i129f/probe/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const result = { ok: false, checks: {} };

  // Check #1: does the file exist on disk?
  const fsPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
  try {
    await fs.access(fsPath);
    result.checks.fsExists = true;
  } catch {
    result.checks.fsExists = false;
  }

  // Check #2: can we fetch it over HTTP from this deployment?
  try {
    const host = headers().get('host') || 'www.liason.org';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const url = `${proto}://${host}/forms/i-129f.pdf`;
    const res = await fetch(url);
    result.checks.httpOk = res.ok;
    result.checks.httpStatus = res.status;
  } catch (e) {
    result.checks.httpOk = false;
    result.checks.httpError = e?.message || String(e);
  }

  // Check #3: can pdf-lib load it?
  try {
    const bytes = await fs.readFile(fsPath).catch(async () => {
      const host = headers().get('host') || 'www.liason.org';
      const proto = host.includes('localhost') ? 'http' : 'https';
      const url = `${proto}://${host}/forms/i-129f.pdf`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    });

    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    result.ok = true;
    result.pages = pdfDoc.getPages().map(p => p.getSize());
  } catch (e) {
    result.error = e?.message || String(e);
  }

  return NextResponse.json(result);
}

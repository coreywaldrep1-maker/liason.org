// app/api/i129f/debug-grid/route.js
export const runtime = 'nodejs';            // ensure Node runtime (we use fs)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PDFDocument, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import path from 'path';

async function loadPdfBytes() {
  // 1) Try reading from the filesystem (public/forms/i-129f.pdf)
  const fsPath = path.join(process.cwd(), 'public', 'forms', 'i-129f.pdf');
  try {
    return await fs.readFile(fsPath);
  } catch (_) {
    // 2) Fallback: fetch from the same deployed domain
    const host = headers().get('host') || 'www.liason.org';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const url = `${proto}://${host}/forms/i-129f.pdf`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch ${url} failed with ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export async function GET() {
  try {
    const bytes = await loadPdfBytes();
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    // draw a light grid using thin rectangles (avoids drawLine quirks)
    for (const page of pages) {
      const { width, height } = page.getSize();

      for (let x = 0; x <= width; x += 50) {
        page.drawRectangle({ x, y: 0, width: 0.5, height, color: rgb(0.88,0.88,0.88) });
      }
      for (let y = 0; y <= height; y += 50) {
        page.drawRectangle({ x: 0, y, width, height: 0.5, color: rgb(0.88,0.88,0.88) });
      }
    }

    const out = await pdfDoc.save();
    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i129f-grid.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, where: 'debug-grid', error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

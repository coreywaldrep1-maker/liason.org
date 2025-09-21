// app/api/i129f/pdf/route.js
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs/promises';
import path from 'node:path';

import { applyI129fMapping } from '@/lib/i129f-mapping';

// CHANGE THIS if your template lives elsewhere
const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'pdf', 'I-129F-template.pdf');

export async function GET() {
  try {
    // 1) Load saved data the same way your wizard saves it
    const loadResp = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/i129f/load`, {
      cache: 'no-store',
      headers: { 'accept': 'application/json' },
      // credentials not needed server-to-server, but harmless if your load checks auth cookie
    });

    if (!loadResp.ok) {
      const txt = await loadResp.text().catch(() => '');
      throw new Error(`Failed to load saved data (${loadResp.status}): ${txt}`);
    }

    const loadJson = await loadResp.json();
    if (!loadJson?.ok || !loadJson?.data) {
      throw new Error('No saved data for I-129F.');
    }

    const saved = loadJson.data;

    // 2) Read the PDF template bytes
    const templateBytes = await fs.readFile(TEMPLATE_PATH);

    // 3) Fill the form
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pdfForm = pdfDoc.getForm(); // NOTE: use pdfForm (NOT "form") to avoid shadowing bugs

    // Push JSON → PDF fields
    applyI129fMapping(saved, pdfForm);

    // 4) Flatten (optional) and output
    // pdfForm.flatten(); // uncomment if you want non-editable filled fields

    const outBytes = await pdfDoc.save();

    return new NextResponse(outBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-129F.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    // Helpful JSON error instead of a hard 500
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.stack || err?.message || err),
      },
      { status: 400 }
    );
  }
}

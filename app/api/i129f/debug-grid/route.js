export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { PDFDocument, StandardFonts } from 'pdf-lib';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

export async function GET() {
  try {
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);

    let n = 1;
    for (const f of form.getFields()) {
      const name = f.getName();
      try {
        const tf = form.getTextField(name);
        tf.setText(`[${n}] ${name}`);
        n++;
      } catch { /* non-text field (checkbox/radio) */ }
    }

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="i-129f-field-numbers.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}

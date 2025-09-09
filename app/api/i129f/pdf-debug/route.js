// app/api/i129f/pdf-debug/route.js
export const runtime = 'nodejs';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, PDFName } from 'pdf-lib';

async function loadTemplate() {
  const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  return await readFile(filePath);
}

// Try to resolve which page a widget belongs to
function resolveWidgetPage(widget, pages) {
  // 1) Preferred: widget.getPage()
  try {
    if (typeof widget.getPage === 'function') {
      const p = widget.getPage();
      if (p) return p;
    }
  } catch {}

  // 2) Check the widget's 'P' (parent page) reference
  try {
    const pName = PDFName.of('P');
    const pRef = widget.dict?.get?.(pName);
    if (pRef) {
      for (const p of pages) {
        if (p.ref?.equals?.(pRef) || p.ref === pRef) return p;
      }
    }
  } catch {}

  // 3) Scan each page's Annots for this widget
  try {
    const wRef = widget.ref || widget.dict?.ref;
    if (wRef) {
      for (const p of pages) {
        const annots = p.node?.Annots?.();
        if (!annots) continue;
        const arr = annots.asArray?.() || [];
        if (arr.some(a => a === wRef)) return p;
      }
    }
  } catch {}

  // Fallback to first page
  return pages[0];
}

export async function GET() {
  try {
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    const fields = form.getFields();

    fields.forEach((field, fieldIdx) => {
      const name = field.getName();

      // pdf-lib v1.17+: widgets via acroField.getWidgets()
      const widgets =
        (field.acroField && typeof field.acroField.getWidgets === 'function'
          ? field.acroField.getWidgets()
          : typeof field.getWidgets === 'function'
          ? field.getWidgets()
          : []) || [];

      widgets.forEach((w, wi) => {
        try {
          const rect = typeof w.getRectangle === 'function' ? w.getRectangle() : null;
          if (!rect) return;

          const page = resolveWidgetPage(w, pages);
          const { x, y, width, height } = rect;

          // Draw red box
          page.drawRectangle({
            x,
            y,
            width,
            height,
            borderColor: rgb(1, 0, 0),
            borderWidth: 0.8,
            opacity: 0,
          });

          // Label: "<page> • <fieldIndex>:<widgetIndex>  <name>"
          const pageNum = pages.indexOf(page) + 1;
          page.drawText(`${pageNum} • ${fieldIdx + 1}:${wi + 1}  ${name}`, {
            x,
            y: y + height + 2,
            size: 6,
            color: rgb(1, 0, 0),
          });
        } catch {
          // ignore any odd widget
        }
      });
    });

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="i-129f-debug.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}

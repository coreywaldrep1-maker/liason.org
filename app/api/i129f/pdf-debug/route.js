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

/**
 * Try hard to find the page that a widget belongs to.
 * 1) High-level: widget.getPage()
 * 2) Low-level: widget.dict/node['P'] -> compare with page.ref
 */
function resolveWidgetPage(pdfDoc, widget) {
  // 1) High-level
  try {
    const direct = widget.getPage?.();
    if (direct) return direct;
  } catch {}

  // 2) Low-level: look up the 'P' (page) reference on the widget
  try {
    const dict = widget.dict ?? widget.node; // pdf-lib versions differ
    const pRef = dict?.get?.(PDFName.of('P'));
    if (pRef) {
      const pages = pdfDoc.getPages();
      for (const pg of pages) {
        if (pg.ref === pRef) return pg;
      }
    }
  } catch {}

  return null; // don't blindly draw on page 0; better to skip than mislead
}

export async function GET() {
  try {
    const bytes = await loadTemplate();
    const pdfDoc = await PDFDocument.load(bytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    // For each field, draw a red rectangle and tiny label on the correct page
    fields.forEach((field, idx) => {
      const name = field.getName();
      // pdf-lib low-level widgets for this field:
      const widgets = field.acroField?.getWidgets?.() || [];

      widgets.forEach((w, wi) => {
        // rectangle
        let rect;
        try {
          rect = w.getRectangle?.(); // { x, y, width, height }
        } catch {}
        if (!rect || typeof rect.x !== 'number') return;

        const page = resolveWidgetPage(pdfDoc, w);
        if (!page) return; // skip if we cannot resolve a page for this widget

        // draw the overlay on the resolved page
        page.drawRectangle({
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          borderColor: rgb(1, 0, 0),
          borderWidth: 0.8,
          opacity: 0.0, // stroke only
        });
        page.drawText(`${idx + 1}:${wi + 1}  ${name}`, {
          x: rect.x,
          y: rect.y + rect.height + 2,
          size: 6,
          color: rgb(1, 0, 0),
        });
      });
    });

    const out = await pdfDoc.save();
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':

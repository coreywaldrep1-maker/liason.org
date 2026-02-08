// app/api/i129f/fields/route.js
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import path from "path";
import fs from "fs";
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
} from "pdf-lib";

function inferPageFromName(name) {
  // Match _page9_ or Page9_
  const m = String(name).match(/(?:_page|Page)(\d{1,2})/);
  if (m) return Number(m[1]);
  return 0;
}

function resolveTemplateBytes() {
  const publicPath = path.join(process.cwd(), "public", "i-129f.pdf");
  if (!fs.existsSync(publicPath)) throw new Error("public/i-129f.pdf not found");
  return fs.readFileSync(publicPath);
}

export async function GET(req) {
  try {
    await requireAuth(req);

    const bytes = resolveTemplateBytes();
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();
    const fields = form.getFields();

    // Build raw list
    const raw = fields.map((f) => {
      const name = f.getName();
      let kind = "unknown";
      let options = [];

      if (f instanceof PDFTextField) kind = "text";
      else if (f instanceof PDFCheckBox) kind = "checkbox";
      else if (f instanceof PDFRadioGroup) {
        kind = "radio";
        options = f.getOptions?.() || [];
      } else if (f instanceof PDFDropdown) {
        kind = "dropdown";
        options = f.getOptions?.() || [];
      }

      return {
        name,
        kind,
        options,
        page: inferPageFromName(name),
      };
    });

    // Remove container parent fields:
    // if "X" exists and there are fields "X.something", then X is a parent/container.
    const nameSet = new Set(raw.map((r) => r.name));
    const isParent = (n) => {
      for (const other of nameSet) {
        if (other.startsWith(n + ".")) return true;
      }
      return false;
    };

    const cleaned = raw.filter((r) => !isParent(r.name));

    // Keep original PDF order (already in Acrobat order),
    // but make sure pages appear 1..12 in UI grouping.
    return NextResponse.json({ ok: true, fields: cleaned });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

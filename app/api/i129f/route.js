import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getPool } from '@/lib/db';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const enc = new TextEncoder();

async function getUserId() {
  try {
    const cookie = require('next/headers').cookies().get('liason_token')?.value;
    if (!cookie) return null;
    const { payload } = await jwtVerify(cookie, enc.encode(process.env.JWT_SECRET));
    return payload.sub;
  } catch { return null; }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const passed = body?.values || {};
    const userId = await getUserId();
    let merged = { ...passed };

    // Merge saved answers if logged in (server truth)
    if (userId) {
      const pool = getPool();
      const { rows } = await pool.query(`select answers from i129f_answers where user_id=$1`, [userId]);
      if (rows[0]?.answers) merged = { ...rows[0].answers, ...passed };
    }

    // Load the blank form from public
    const filePath = path.join(process.cwd(), 'public', 'i-129f.pdf');
    const bytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(bytes);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const color = rgb(0, 0, 0);
    const size = 10;

    // QUICK MAPPING EXAMPLE (x,y coordinates measured from bottom-left)
    // Tweak numbers after testing to align with your template boxes.
    const fields = [
      { key:'petitioner_full_name',    x: 120, y: 680 },
      { key:'petitioner_dob',          x: 120, y: 662 },
      { key:'petitioner_us_citizen',   x: 120, y: 644 },
      { key:'petitioner_address',      x: 120, y: 626 },
      { key:'petitioner_phone',        x: 120, y: 608 },
      { key:'petitioner_email',        x: 120, y: 590 },

      { key:'beneficiary_full_name',   x: 120, y: 550 },
      { key:'beneficiary_dob',         x: 120, y: 532 },
      { key:'beneficiary_birth_country',x:120, y: 514 },
      { key:'beneficiary_passport_number',x:120, y: 496 },
      { key:'beneficiary_address',     x: 120, y: 478 },

      { key:'met_in_person',           x: 120, y: 438 },
      { key:'met_date',                x: 120, y: 420 },
      { key:'how_met',                 x: 120, y: 402 },

      { key:'intent_to_marry_90_days', x: 120, y: 362 },

      { key:'prior_filings',           x: 120, y: 330 },
      { key:'petitioner_prior_marriages', x:120, y: 312 },
      { key:'beneficiary_prior_marriages',x:120, y: 294 },

      { key:'prev_spouse_name',           x: 120, y: 256 },
      { key:'prev_marriage_date',         x: 120, y: 238 },
      { key:'prev_divorce_or_death_date', x: 120, y: 220 },
      { key:'prev_marriage_location',     x: 120, y: 202 },

      { key:'notes',                   x: 120, y: 170 },
    ];

    fields.forEach(f => {
      const v = (merged[f.key] || '').toString();
      if (v) {
        page.drawText(v, { x:f.x, y:f.y, size, font, color, maxWidth: 400, lineHeight: 12 });
      }
    });

    const pdf = await pdfDoc.save();
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="I-129F_Draft_Liason.pdf"`
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'PDF error' }, { status: 500 });
  }
}

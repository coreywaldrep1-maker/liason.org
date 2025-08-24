// app/api/i129f/route.js
import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const values = body?.values || {};
    const profileName = (body?.profileName || values?.petitioner_full_name || 'I-129F_Draft')
      .toString()
      .replace(/[^\w\-]+/g, '_');

    // Create a simple, clean summary PDF (Letter size)
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([612, 792]);
    const { width } = page.getSize();
    const margin = 40;
    let y = 750;

    const drawLine = () => {
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 0.5,
        color: rgb(0.88, 0.92, 0.96),
      });
      y -= 14;
    };

    const addHeading = (t) => {
      page.drawText(t, { x: margin, y, size: 18, font: bold, color: rgb(0.11, 0.15, 0.24) });
      y -= 24;
    };

    const addLabel = (t) => {
      page.drawText(t, { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.2) });
      y -= 14;
    };

    const addValue = (t) => {
      const text = String(t ?? '');
      const max = 92; // simple wrap by characters
      for (let i = 0; i < text.length; i += max) {
        const slice = text.slice(i, i + max);
        page.drawText(slice, { x: margin, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
        y -= 14;
        if (y < 80) { page = doc.addPage([612, 792]); y = 750; }
      }
      y -= 6;
    };

    addHeading('USCIS I-129F — Draft Answers (Liason)');
    drawLine();

    const sections = [
      ['Petitioner', [
        ['Full name', values.petitioner_full_name],
        ['Date of birth', values.petitioner_dob],
        ['U.S. citizen?', values.petitioner_us_citizen],
        ['Address', values.petitioner_address],
        ['Phone', values.petitioner_phone],
        ['Email', values.petitioner_email],
      ]],
      ['Beneficiary', [
        ['Full name', values.beneficiary_full_name],
        ['Date of birth', values.beneficiary_dob],
        ['Birth country', values.beneficiary_birth_country],
        ['Passport number', values.beneficiary_passport_number],
        ['Address', values.beneficiary_address],
      ]],
      ['Relationship', [
        ['Met in person?', values.met_in_person],
        ['Most recent in-person date', values.met_date],
        ['How you met (summary)', values.how_met],
        ['Intent to marry within 90 days?', values.intent_to_marry_90_days],
      ]],
      ['Prior Filings / Marriages', [
        ['Prior I-129F filings', values.prior_filings],
        ['Petitioner prior marriages', values.petitioner_prior_marriages],
        ['Beneficiary prior marriages', values.beneficiary_prior_marriages],
      ]],
      ['Notes', [
        ['User notes', values.notes],
      ]],
    ];

    for (const [sectionLabel, pairs] of sections) {
      addLabel(sectionLabel);
      for (const [label, val] of pairs) {
        if (val == null || val === '') continue;
        addValue(`${label}: ${val}`);
      }
      drawLine();
      if (y < 120) { page = doc.addPage([612, 792]); y = 750; }
    }

    const bytes = await doc.save();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${profileName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

// scripts/audit-i129f.js
// Usage: node scripts/audit-i129f.js
import fs from 'fs';
import path from 'path';

async function main() {
  const pdfPath = path.join(process.cwd(), 'public', 'i-129f.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('Missing public/i-129f.pdf');
    process.exit(1);
  }
  const { PDFDocument } = await import('pdf-lib');
  const bytes = fs.readFileSync(pdfPath);
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();

  const fields = form.getFields().map((f) => {
    const type = f.constructor?.name || 'Unknown';
    const name = f.getName?.() || 'Unknown';
    return { name, type };
  });

  const mapPath = path.join(process.cwd(), 'lib', 'i129f-mapping.js');
  const mappingText = fs.existsSync(mapPath) ? fs.readFileSync(mapPath, 'utf8') : '';
  const referenced = new Set();
  for (const m of mappingText.matchAll(/['"`]([A-Za-z0-9_ .-]*Pt[1-8][A-Za-z0-9_ .-]*?)['"`]/g)) {
    referenced.add(m[1]);
  }

  let used = 0, unused = 0;
  const samples = [];
  for (const f of fields) {
    if (referenced.has(f.name)) used++; else { unused++; if (samples.length < 50) samples.push(f); }
  }
  console.log(`Total fields: ${fields.length}`);
  console.log(`Referenced by mapping: ${used}`);
  console.log(`Not referenced: ${unused}`);
  console.log('First 50 unmapped field names:');
  for (const f of samples) console.log(` - ${f.name} [${f.type}]`);
}

main().catch((e) => { console.error(e); process.exit(1); });

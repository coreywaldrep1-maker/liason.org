// lib/pdf/fillI129F.js
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { buildI129fPdfData } from './i129fPdfData';

/**
 * Fill the I-129F PDF with data from the wizard.
 * @param {object} saved - full wizard saved object
 * @returns {Promise<Uint8Array>} filled PDF bytes
 */
export async function fillI129F(saved = {}) {
  const templatePath = path.join(process.cwd(), 'public', 'i-129f.pdf'); // <- make sure this matches your filename
  const templateBytes = await fs.readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();

  const data = buildI129fPdfData(saved);

  for (const [fieldName, value] of Object.entries(data)) {
    setAnyField(form, fieldName, value);
  }

  // Better rendering in most PDF viewers
  try {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);
  } catch {
    // ignore
  }

  // Keep it editable (do not flatten)
  return await pdfDoc.save();
}

function setAnyField(form, fieldName, value) {
  if (!fieldName) return;

  try {
    const field = form.getField(fieldName);
    const type = field?.constructor?.name;

    if (type === 'PDFTextField') {
      field.setText(value === undefined || value === null ? '' : String(value));
      return;
    }

    if (type === 'PDFCheckBox') {
      if (value) field.check();
      else field.uncheck();
      return;
    }

    if (type === 'PDFRadioGroup') {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        field.select(String(value));
      }
      return;
    }

    if (type === 'PDFDropdown' || type === 'PDFOptionList') {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        field.select(String(value));
      }
      return;
    }

    // fallback
    if (typeof field.setText === 'function') {
      field.setText(value === undefined || value === null ? '' : String(value));
    }
  } catch {
    // Missing field names are ignored so generation still succeeds.
  }
}

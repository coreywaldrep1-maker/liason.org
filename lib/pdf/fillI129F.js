
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { applyI129fMapping } from "@/lib/i129f-mapping";

const TEMPLATE_PATH = "public/i-129f.pdf";

function isChecked(value) {
  if (value === true) return true;
  if (value === false || value == null) return false;

  const text = String(value).trim().toLowerCase();
  return !["", "false", "no", "off", "0"].includes(text);
}

function mappingError(message, issues = []) {
  const error = new Error(message);
  error.code = "PDF_MAPPING_INCOMPLETE";
  error.issues = issues;
  return error;
}

function applyDirectPdfOverrides(form, saved) {
  const overrides = saved?.pdf;

  if (
    !overrides ||
    typeof overrides !== "object" ||
    Array.isArray(overrides)
  ) {
    return;
  }

  const fields = new Map(
    form.getFields().map((field) => [
      field.getName(),
      field,
    ])
  );

  for (const [name, value] of Object.entries(overrides)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const field = fields.get(name);

    // Ignore overrides from an older PDF template.
    if (!field) continue;

    if (typeof field.setText === "function") {
      field.setText(String(value));
      continue;
    }

    if (
      typeof field.check === "function" &&
      typeof field.uncheck === "function"
    ) {
      if (isChecked(value)) {
        field.check();
      } else {
        field.uncheck();
      }
      continue;
    }

    if (typeof field.select === "function") {
      const requestedValue = String(value);
      const available = field.getOptions?.() || [];

      if (!available.includes(requestedValue)) {
        throw mappingError(
          "An existing PDF selection no longer matches the template.",
          [`${name}: invalid selection value`]
        );
      }

      field.select(requestedValue);
    }
  }
}

function validateMapping(report) {
  if (!report || typeof report !== "object") {
    throw mappingError(
      "The PDF mapping function did not return a validation result."
    );
  }

  const issues = [
    ...(Array.isArray(report.missing) ? report.missing : []),
    ...(Array.isArray(report.warnings) ? report.warnings : []),
  ];

  if (
    Number(report.continuationOverflow || 0) > 0 &&
    !issues.some((issue) =>
      String(issue).includes("continuation entries exceed")
    )
  ) {
    issues.push(
      `${report.continuationOverflow} additional-information entries exceed the five available Part 8 slots.`
    );
  }

  if (issues.length > 0) {
    throw mappingError(
      "Some answers could not be placed on the I-129F. Review the mapping details before downloading.",
      issues
    );
  }

  return report;
}

/**
 * Generate an I-129F PDF from saved wizard answers.
 *
 * saved: the same object stored by /api/i129f/data
 * flatten: true makes PDF fields non-editable
 *
 * Returns Uint8Array PDF bytes.
 */
export async function fillI129FPdf(
  saved = {},
  { flatten = false } = {}
) {
  if (
    !saved ||
    typeof saved !== "object" ||
    Array.isArray(saved)
  ) {
    throw new Error("Invalid I-129F saved data.");
  }

  const absolutePath = path.join(
    process.cwd(),
    TEMPLATE_PATH
  );

  let templateBytes;

  try {
    templateBytes = await readFile(absolutePath);
  } catch {
    throw new Error(
      "I-129F template not found at public/i-129f.pdf. Upload the completed named PDF to the public folder."
    );
  }

  const pdfDoc = await PDFDocument.load(templateBytes, {
    ignoreEncryption: true,
    updateMetadata: true,
  });

  const form = pdfDoc.getForm();

  // Populate the descriptive AcroForm field names.
  const mappingReport = applyI129fMapping(saved, form);

  // Verify that the mapper did not skip entered answers.
  validateMapping(mappingReport);

  // Preserve backward compatibility with saved direct overrides.
  applyDirectPdfOverrides(form, saved);

  // Refresh the visible PDF values.
  try {
    const font = await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

    form.updateFieldAppearances(font);
  } catch (error) {
    throw new Error(
      "The PDF field appearances could not be generated. Check for unsupported characters or malformed form fields. " +
      String(error?.message || error)
    );
  }

  if (flatten) {
    form.flatten();
  }

  return await pdfDoc.save();
}

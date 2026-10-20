
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { fillI129FPdf } from "@/lib/pdf/fillI129F";

async function fetchJsonOrNull(url, cookie) {
  try {
    const response = await fetch(url, {
      headers: cookie ? { cookie } : {},
      cache: "no-store",
    });

    if (!response.ok) return null;

    const json = await response.json().catch(() => null);

    if (!json || json.ok === false) {
      return null;
    }

    return json;
  } catch {
    return null;
  }
}

function extractSaved(json) {
  if (!json || typeof json !== "object") {
    return null;
  }

  if (json.ok === false) {
    return null;
  }

  if (json.data && typeof json.data === "object") {
    return json.data;
  }

  if (json.saved && typeof json.saved === "object") {
    return json.saved;
  }

  if (json.i129f && typeof json.i129f === "object") {
    return json.i129f;
  }

  if (json.form && typeof json.form === "object") {
    return json.form;
  }

  return json;
}

async function loadSavedForSession(request) {
  const cookie = request.headers.get("cookie") || "";
  const origin = new URL(request.url).origin;

  // Existing older load endpoint.
  const olderResponse = await fetchJsonOrNull(
    `${origin}/api/i129f/load`,
    cookie
  );

  const olderData = extractSaved(olderResponse);

  if (olderData) {
    return olderData;
  }

  // Current wizard save/load endpoint.
  const currentResponse = await fetchJsonOrNull(
    `${origin}/api/i129f/data`,
    cookie
  );

  return extractSaved(currentResponse);
}

function hasSavedAnswers(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  return Boolean(
    data.petitioner ||
    data.beneficiary ||
    Object.keys(data.pdf || {}).length > 0
  );
}

function pdfResponse(bytes) {
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="i-129f-filled.pdf"',
      "Cache-Control": "no-store, max-age=0",
      "X-I129F-Template": "public/i-129f.pdf",
    },
  });
}

function errorResponse(error) {
  console.error("I-129F PDF generation error:", error);

  const mappingProblem =
    error?.code === "PDF_MAPPING_INCOMPLETE";

  return NextResponse.json(
    {
      ok: false,
      error:
        error?.message ||
        "Unable to generate the I-129F PDF.",
      issues: Array.isArray(error?.issues)
        ? error.issues.slice(0, 50)
        : [],
    },
    {
      status: mappingProblem ? 422 : 500,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/**
 * GET /api/i129f/pdf
 *
 * Loads the signed-in user's saved answers.
 */
export async function GET(request) {
  try {
    const saved = await loadSavedForSession(request);

    if (!hasSavedAnswers(saved)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No saved I-129F answers were found. Save your progress before downloading.",
        },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const flatten =
      url.searchParams.get("flatten") === "1";

    const bytes = await fillI129FPdf(saved, {
      flatten,
    });

    return pdfResponse(bytes);
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * POST /api/i129f/pdf
 *
 * Generates a PDF from the provided form data.
 * Does not alter saved database records.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);

    const saved =
      body &&
      typeof body === "object" &&
      body.data &&
      typeof body.data === "object"
        ? body.data
        : body;

    if (!hasSavedAnswers(saved)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No valid I-129F form data was provided.",
        },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const flatten =
      url.searchParams.get("flatten") === "1";

    const bytes = await fillI129FPdf(saved, {
      flatten,
    });

    return pdfResponse(bytes);
  } catch (error) {
    return errorResponse(error);
  }
}

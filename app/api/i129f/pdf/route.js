// app/api/i129f/pdf/route.js
// Keep AcroForm fields (no flatten) by default; fill from the user's saved data.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts } from "pdf-lib";

import { sql } from "@/lib/db";
import { applyI129fMapping } from "@/lib/i129f-mapping";

const TEMPLATE_RELATIVE = "public/i-129f.pdf";

// ---------- helpers ----------
async function loadTemplate() {
  const filePath = path.join(process.cwd(), TEMPLATE_RELATIVE);
  return readFile(filePath);
}

// best-effort JWT payload read (no verify) for user id if we need it
function decodeJwtNoVerify(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "===".slice((payload.length + 3) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserIdFromCookie(cookieStr) {
  try {
    if (!cookieStr) return null;
    // common cookie names; tweak if yours is different
    const m =
      cookieStr.match(/(?:^|;\s*)(?:token|jwt|auth|session)=([^;]+)/i) ||
      cookieStr.match(/(?:^|;\s*)Authorization=Bearer\s+([^;]+)/i);
    if (!m) return null;
    const payload = decodeJwtNoVerify(decodeURIComponent(m[1]));
    if (!payload) return null;
    return (
      (typeof payload.id === "num

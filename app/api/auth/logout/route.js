// app/api/auth/logout/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * Adjust the cookie names below to match your app.
 * Common ones: token, jwt, session
 */
const AUTH_COOKIES = ["token", "jwt", "session"];

function kill(name) {
  // expire now; make sure Path=/ so it actually clears
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const res = NextResponse.redirect(new URL("/login", url.origin), { status: 302 });

  // clear all known auth cookies
  AUTH_COOKIES.forEach((n) => res.headers.append("Set-Cookie", kill(n)));

  return res;
}

export async function POST(request) {
  // Support POST as well, same behavior
  return GET(request);
}

// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';

const ENC = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_Secret || process.env.NEXTAUTH_SECRET; // tolerate your env names

if (!JWT_SECRET) {
  console.warn('[auth] Missing JWT_SECRET env var');
}

const KEY = JWT_SECRET ? ENC.encode(JWT_SECRET) : ENC.encode('dev-secret-change-me');

export async function signJWT(payload, { expiresIn = '30d' } = {}) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpiration(expiresIn)
    .sign(KEY);
  return jwt;
}

export async function verifyJWT(token) {
  const { payload } = await jwtVerify(token, KEY);
  return payload; // { id, email, ... }
}

// Pull user from cookie set as `liason_token=...`
export function getTokenFromRequest(req) {
  // Next.js App Router (Request) has headers.get('cookie')
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)liason_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function requireUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const user = await verifyJWT(token);
    return user || null;
  } catch {
    return null;
  }
}

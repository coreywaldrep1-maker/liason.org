// lib/auth.js
import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'liason_token';

const enc = new TextEncoder();
const SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_Secret ||
  process.env.NEXTAUTH_SECRET ||
  'dev-secret-change-me';
const KEY = enc.encode(SECRET);

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach(kv => {
    const i = kv.indexOf('=');
    if (i > -1) out[kv.slice(0, i).trim()] = decodeURIComponent(kv.slice(i + 1).trim());
  });
  return out;
}

// Figure out a Domain attribute so cookie works on both liason.org and www.liason.org
function computeCookieDomain(host) {
  if (!host) return '';
  const lower = host.toLowerCase();
  // If your production domain is liason.org, set a parent domain cookie
  if (lower.endsWith('liason.org')) return '.liason.org';
  return ''; // fallback (host-only) on other hosts like localhost or Codespaces
}

export async function signJWT(payload, { expiresIn = '30d' } = {}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(KEY);
}

// Set HttpOnly cookie. Pass the request so we can compute Domain correctly.
export function setAuthCookie(res, token, req, { maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  const host =
    (typeof req?.headers?.get === 'function' ? req.headers.get('host') : req?.headers?.host) || '';
  const domain = computeCookieDomain(host);
  const domainAttr = domain ? ` Domain=${domain};` : '';

  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds};${domainAttr}${secure}`
  );
}

// Clear the cookie on the same domain we set it on
export function clearAuthCookie(res, req) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  const host =
    (typeof req?.headers?.get === 'function' ? req.headers.get('host') : req?.headers?.host) || '';
  const domain = computeCookieDomain(host);
  const domainAttr = domain ? ` Domain=${domain};` : '';

  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${domainAttr}${secure}`
  );
}

export function getJWTFromRequest(req) {
  const cookieHeader =
    typeof req.headers?.get === 'function' ? req.headers.get('cookie') : req?.headers?.cookie || '';
  if (!cookieHeader) return null;
  const map = parseCookies(cookieHeader);
  return map[AUTH_COOKIE_NAME] || null;
}

export async function verifyJWT(reqOrToken) {
  const token = typeof reqOrToken === 'string' ? reqOrToken : getJWTFromRequest(reqOrToken);
  if (!token) throw new Error('no-jwt');
  const { payload } = await jwtVerify(token, KEY);
  return payload; // e.g. { id, email }
}

export async function requireAuth(req) {
  const user = await verifyJWT(req);
  if (!user?.id) throw new Error('no-user');
  return user;
}

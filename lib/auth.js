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

export async function signJWT(payload, { expiresIn = '30d' } = {}) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(KEY);
}

export function setAuthCookie(res, token, { maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds};${secure}`
  );
}

export function clearAuthCookie(res) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${secure}`
  );
}

export function getJWTFromRequest(req) {
  const cookieHeader =
    typeof req.headers?.get === 'function' ? req.headers.get('cookie') : req.headers?.cookie || '';
  if (!cookieHeader) return null;
  const map = parseCookies(cookieHeader);
  return map[AUTH_COOKIE_NAME] || null;
}

export async function verifyJWT(reqOrToken) {
  const token = typeof reqOrToken === 'string' ? reqOrToken : getJWTFromRequest(reqOrToken);
  if (!token) throw new Error('no-jwt');
  const { payload } = await jwtVerify(token, KEY);
  return payload; // { id, email }
}

export async function requireAuth(req) {
  const user = await verifyJWT(req);
  if (!user?.id) throw new Error('no-user');
  return user;
}

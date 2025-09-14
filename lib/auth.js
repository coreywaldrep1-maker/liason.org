// lib/auth.js
// ...keep your existing imports and code above...

export const AUTH_COOKIE_NAME = 'liason_token';

// OPTIONAL: set this in prod so the cookie works on both liason.org and www.liason.org
// AUTH_COOKIE_DOMAIN=.liason.org
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || ''; // e.g. ".liason.org"

export function setAuthCookie(res, token, { maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  const domain = COOKIE_DOMAIN ? ` Domain=${COOKIE_DOMAIN};` : '';
  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds};${domain}${secure}`
  );
}

export function clearAuthCookie(res) {
  const secure = process.env.VERCEL ? ' Secure;' : '';
  const domain = COOKIE_DOMAIN ? ` Domain=${COOKIE_DOMAIN};` : '';
  res.headers.set(
    'Set-Cookie',
    `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${domain}${secure}`
  );
}

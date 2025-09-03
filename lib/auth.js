import { jwtVerify } from 'jose';

const COOKIE = 'liason_token';

export async function getUserFromCookie(cookieHeader = '') {
  const token = parseCookie(cookieHeader)[COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

function parseCookie(str) {
  const out = {};
  (str || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) {
      const k = p.slice(0, i).trim();
      const v = p.slice(i + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

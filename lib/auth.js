import * as jose from 'jose';

export async function signJWT(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret);
}

export function setAuthCookie(res, token) {
  res.headers.set('Set-Cookie', `liason_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
}

export function removeAuthCookie(res) {
  res.headers.set('Set-Cookie', 'liason_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
}

export async function verifyJWT(req) {
  try {
    const token = getCookie(req, 'liason_token');
    if (!token || !process.env.JWT_SECRET) return null;

    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return payload;
  } catch {
    return null; 
  }
}

function getCookie(req, name) {
  const cookie = req.headers.get('cookie') || '';
  const found = cookie.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(name + '='));
  return found ? decodeURIComponent(found.split('=')[1]) : null;
}

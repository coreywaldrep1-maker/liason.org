import { jwtVerify } from 'jose';

export async function getUserFromCookie(cookieHeader) {
  // cookieHeader: e.g. request.headers.get('cookie')
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)liason_token=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    // we store { id, email } in token during login
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

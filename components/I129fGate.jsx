// components/I129fGate.jsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev');

async function getUserIdFromCookie() {
  const token = cookies().get('liason_jwt')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Server Component: decide which view to show
 * Props:
 *  - prepay: ReactNode (what to show before payment)
 *  - paid: ReactNode (what to show after payment)
 */
export default async function I129fGate({ prepay, paid }) {
  const userId = await getUserIdFromCookie();

  if (!userId) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Please sign in</h3>
        <p className="small">Create an account or sign in to start your I-129F profile.</p>
        <a className="btn btn-primary" href="/account">Sign in / Create account</a>
      </div>
    );
  }

  const rows = await sql`
    SELECT paid
    FROM user_profiles
    WHERE user_id = ${userId} AND product_code = ${'i129f'}
    LIMIT 1
  `;
  const isPaid = rows[0]?.paid === true;

  return isPaid ? paid : prepay;
}

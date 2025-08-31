import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return Response.json({ ok:false, error:'Missing fields' }, { status:400 });

    const { rows } = await query(
      'SELECT pr.id, pr.user_id, pr.expires_at, pr.used FROM password_resets pr WHERE pr.token = $1',
      [token]
    );

    if (rows.length === 0) return Response.json({ ok:false, error:'Invalid token' }, { status:400 });

    const pr = rows[0];
    if (pr.used) return Response.json({ ok:false, error:'Token already used' }, { status:400 });
    if (new Date(pr.expires_at).getTime() < Date.now()) {
      return Response.json({ ok:false, error:'Token expired' }, { status:400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, pr.user_id]);
    await query('UPDATE password_resets SET used = true WHERE id = $1', [pr.id]);

    return Response.json({ ok:true });
  } catch (err) {
    console.error(err);
    return Response.json({ ok:false, error:'Server error' }, { status:500 });
  }
}

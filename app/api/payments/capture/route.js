// app/api/payments/capture/route.js
import { NextResponse } from 'next/server';
import { captureOrderServer } from '@/lib/paypal';

export async function POST(request) {
  try {
    const { orderID } = await request.json();
    if (!orderID) {
      return NextResponse.json({ ok: false, error: 'Missing orderID' }, { status: 400 });
    }

    const capture = await captureOrderServer(orderID);

    // Basic success check (there can be multiple captures; check any Completed)
    const completed = JSON.stringify(capture).includes('"status":"COMPLETED"');
    if (!completed) {
      return NextResponse.json({ ok: false, error: 'Order not completed' }, { status: 400 });
    }

    // Mark paid via cookie (simple gate). You can also write to Neon here.
    const res = NextResponse.json({ ok: true });
    // 30 days
    res.cookies.set('i129f_paid', '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: true,
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

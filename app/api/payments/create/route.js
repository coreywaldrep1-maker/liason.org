// app/api/payments/create/route.js
import { NextResponse } from 'next/server';
import { createOrderServer } from '@/lib/paypal';

export async function POST(request) {
  try {
    const { amount = '500.00', description = 'I-129F Guided Tool' } = await request.json().catch(() => ({}));
    const order = await createOrderServer(amount, description);
    return NextResponse.json({ ok: true, id: order.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

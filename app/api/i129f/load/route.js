export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';

// GET /api/i129f/load?formId=...
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');

    // TODO: load your saved form data from DB by formId/user
    // const data = await db.i129f.findOne({ formId, userId });

    return NextResponse.json({
      ok: true,
      formId,
      data: {} // replace with real data
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Load failed' },
      { status: 500 }
    );
  }
}

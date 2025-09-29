// app/api/i129f/pdf-inspect/route.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const mod = await import('@/lib/i129f-mapping.js').catch(() => ({}));
    const fields = Array.isArray(mod.I129F_DEBUG_FIELD_LIST) ? mod.I129F_DEBUG_FIELD_LIST : [];
    return Response.json({ ok: true, fields });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

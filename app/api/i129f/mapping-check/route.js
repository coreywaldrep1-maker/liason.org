import { NextResponse } from 'next/server';
import { buildPdfData } from '@/lib/i129f-map';

export const runtime = 'edge';

export async function GET() {
  // pretend we only have minimal form
  const fake = {
    petitioner: { lastName:'Doe', firstName:'John' },
    mailing: { street:'123 Main', city:'Austin', state:'TX', zip:'78701' },
    beneficiary: { lastName:'Roe', firstName:'Jane' },
    history: { howMet:'Online' }
  };
  return NextResponse.json({ ok: true, pdf: buildPdfData(fake) });
}

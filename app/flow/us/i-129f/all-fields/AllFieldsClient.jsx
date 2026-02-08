'use client';

// The main I-129F wizard is now PDF-driven and already renders all fields in PDF order,
// so we simply reuse it here.

import I129fWizard from '@/components/I129fWizard';

export default function AllFieldsClient() {
  return <I129fWizard />;
}

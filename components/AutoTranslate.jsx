// components/AutoTranslate.jsx
'use client';

import { useEffect, useState } from 'react';

// Usage:
// <AutoTranslate>This is a long paragraph to translate.</AutoTranslate>
// or <AutoTranslate as="h2">Heading</AutoTranslate>
// or <AutoTranslate target="es">Force Spanish</AutoTranslate>
export default function AutoTranslate({ children, as = 'div', target }) {
  const Tag = as;
  const original = typeof children === 'string' ? children : '';
  const [text, setText] = useState(original);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function go() {
      // Don’t translate empty text
      if (!original.trim()) return;

      try {
        setLoading(true);
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: original, target }),
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.ok && Array.isArray(data.translations)) {
          setText(data.translations[0] ?? original);
        } else if (!cancelled) {
          setText(original); // fallback
        }
      } catch {
        if (!cancelled) setText(original);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    go();
    return () => { cancelled = true; };
  }, [original, target]);

  return <Tag aria-busy={loading}>{text}</Tag>;
}

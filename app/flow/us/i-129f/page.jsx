// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export default function I129fPage() {
  return (
    <main className="section" data-i18n-scan>
      {/* Safe inline script (no crazy escaping) */}
      <Script
        id="i18n-page-autotranslate"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: String.raw`(function () {
  try {
    // Read cookie without regex (avoids build-time escaping problems)
    function getLangCookie() {
      const pair = document.cookie.split('; ').find(row => row.startsWith('liason_lang='));
      return pair ? decodeURIComponent(pair.split('=')[1] || '') : '';
    }
    const lang = getLangCookie() || 'en';
    if (!lang || lang === 'en') return;

    const root = document.querySelector('[data-i18n-scan]');
    if (!root) return;

    const SKIP_TAGS = new Set(['SCRIPT','STYLE','CODE','PRE','NOSCRIPT','IFRAME','SVG','CANVAS','TITLE','META','LINK']);
    const SKIP_INPUT = new Set(['INPUT','TEXTAREA','SELECT','OPTION','BUTTON']);

    const nodes = [];
    const originals = [];

    function keep(text){
      if (!text) return false;
      const t = text.replace(/\s+/g,' ').trim();
      if (!t) return false;
      // at least one letter (latin or extended)
      if (!/[A-Za-z\u00C0-\u024F]/.test(t)) return false;
      if (t.length <= 1) return false;
      return true;
    }

    function walk(n){
      if (n.nodeType === 1) {
        const el = n;
        if (el.hasAttribute('data-i18n-skip')) return;
        if (SKIP_TAGS.has(el.tagName)) return;
        if (SKIP_INPUT.has(el.tagName)) return;
        if (el.isContentEditable) return;
        for (let i=0; i<el.childNodes.length; i++) walk(el.childNodes[i]);
      } else if (n.nodeType === 3) {
        if (keep(n.nodeValue)) {
          nodes.push(n);
          originals.push(n.nodeValue.replace(/\s+/g,' ').trim());
        }
      }
    }

    walk(root);
    if (!originals.length) return;

    // Deduplicate originals while preserving order
    const unique = [];
    const seen = new Set();
    for (const s of originals) { if (!seen.has(s)) { seen.add(s); unique.push(s); } }

    // Batch to your existing DeepL-backed route
    function translateBatch(items){
      return fetch('/api/i18n/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'en', target: lang, items })
      })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)))
      .then(j => (j && (j.translations || j.items || j.data)) || []);
    }

    const CHUNK = 80;
    const chunks = [];
    for (let i=0; i<unique.length; i+=CHUNK) chunks.push(unique.slice(i, i+CHUNK));

    Promise.all(chunks.map(translateBatch)).then(parts => {
      const translatedAll = parts.flat();
      if (!translatedAll.length) return;

      const map = new Map();
      for (let i=0; i<unique.length; i++) map.set(unique[i], translatedAll[i] ?? unique[i]);

      for (let i=0; i<nodes.length; i++) {
        const orig = originals[i];
        const t = map.get(orig);
        if (t && t !== orig) nodes[i].nodeValue = t;
      }
    }).catch(()=>{ /* no-op on failure */ });

  } catch (e) {
    console.warn('i18n translate skipped:', e);
  }
})();`,
        }}
      />

      <div className="container">
        {/* Keep your narrow, professional width */}
        <div
          style={{
            maxWidth: 760,
            margin: '0 auto',
            display: 'grid',
            gap: 16,
          }}
        >
          <I129fGate>
            <I129fWizard />
            <p className="small" style={{ marginTop: 8 }}>
              Debug all fields: <a href="/flow/us/i-129f/all-fields">open</a>
            </p>
          </I129fGate>
        </div>
      </div>
    </main>
  );
}

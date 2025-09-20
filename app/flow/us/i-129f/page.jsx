// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export default function I129fPage() {
  return (
    <main className="section" data-i18n-scan>
      {/* Inline script that translates ONLY inside [data-i18n-scan] */}
      <Script id="i18n-page-autotranslate" strategy="afterInteractive">
        {`
(function () {
  try {
    // Read language cookie your app uses
    function getCookie(name){
      const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\\]\\\\])/g,'\\\\$1') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    }
    const lang = getCookie('liason_lang') || 'en';
    if (!lang || lang === 'en') return; // nothing to do

    const root = document.querySelector('[data-i18n-scan]');
    if (!root) return;

    // Collect text nodes we want to translate
    const SKIP_TAGS = new Set(['SCRIPT','STYLE','CODE','PRE','NOSCRIPT','IFRAME','SVG','CANVAS','TITLE','META','LINK']);
    const SKIP_INPUT = new Set(['INPUT','TEXTAREA','SELECT','OPTION','BUTTON']);

    const nodes = [];
    const originals = [];

    function shouldKeep(text){
      if (!text) return false;
      const t = text.replace(/\\s+/g,' ').trim();
      if (!t) return false;
      // at least one letter (latin or extended)
      if (!/[A-Za-z\\u00C0-\\u024F]/.test(t)) return false;
      // avoid super tiny UI bits like single punctuation
      if (t.length <= 1) return false;
      return true;
    }

    function walk(node){
      if (node.nodeType === 1) { // element
        const el = node;
        if (el.hasAttribute('data-i18n-skip')) return;
        if (SKIP_TAGS.has(el.tagName)) return;
        if (SKIP_INPUT.has(el.tagName)) return;
        if (el.isContentEditable) return;
        for (let i=0;i<el.childNodes.length;i++){
          walk(el.childNodes[i]);
        }
      } else if (node.nodeType === 3) { // text
        const text = node.nodeValue;
        if (shouldKeep(text)) {
          nodes.push(node);
          originals.push(text.replace(/\\s+/g,' ').trim());
        }
      }
    }

    walk(root);

    if (!originals.length) return;

    // Deduplicate while preserving order
    const unique = [];
    const firstIndex = new Map();
    for (let i=0;i<originals.length;i++){
      const s = originals[i];
      if (!firstIndex.has(s)) {
        firstIndex.set(s, unique.length);
        unique.push(s);
      }
    }

    // Batch translate (expect your /api/i18n/translate-batch to return array in same order)
    function translateBatch(items){
      return fetch('/api/i18n/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'en', target: lang, items })
      })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)))
      .then(j => {
        // Support a few shapes: {translations:[...]}, {items:[...]}, or {data:[...]}
        return (j && (j.translations || j.items || j.data)) || [];
      });
    }

    // If the list is big, chunk it
    const CHUNK = 80;
    const chunks = [];
    for (let i=0;i<unique.length;i+=CHUNK) chunks.push(unique.slice(i, i+CHUNK));

    Promise.all(chunks.map(translateBatch)).then(parts => {
      const translatedAll = parts.flat();
      if (!translatedAll.length) return;

      // Map original string -> translated
      const map = new Map();
      for (let i=0;i<unique.length;i++){
        map.set(unique[i], translatedAll[i] ?? unique[i]);
      }

      // Apply to every text node
      for (let i=0;i<nodes.length;i++){
        const orig = originals[i];
        const t = map.get(orig);
        if (t && t !== orig) {
          nodes[i].nodeValue = t;
        }
      }
    }).catch(() => { /* fail silently on translation errors */ });

  } catch (e) {
    // keep page usable if anything fails
    console.warn('i18n translate skipped:', e);
  }
})();
        `}
      </Script>

      <div className="container">
        {/* Keep the nice, narrow content width */}
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

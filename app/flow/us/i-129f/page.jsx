// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

export default function I129fPage() {
  return (
    <main className="section">
      {/* Narrow, centered layout for a cleaner desktop look */}
      <div
        id="i129f-scope"
        className="container"
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 760,         // <- tighter width
          margin: '0 auto',
          paddingBottom: 16,
        }}
      >
        <I129fGate>
          <I129fWizard />

          {/* Debug link (mark text nodes for translation without changing your structure) */}
          <p className="small" style={{ marginTop: 8 }}>
            <span data-i18n>Debug all fields:</span>{' '}
            <a href="/flow/us/i-129f/all-fields" data-i18n>open</a>
          </p>
        </I129fGate>
      </div>

      {/* Minimal inline translator: uses liason_lang cookie + your /api/i18n/translate-batch */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  try {
    var m = document.cookie.match(/(?:^|;\\s*)liason_lang=([^;]+)/);
    var lang = m ? decodeURIComponent(m[1]) : 'en';
    if (!lang || lang === 'en') return;

    var root = document.getElementById('i129f-scope');
    if (!root) return;

    // translate only elements explicitly tagged with data-i18n
    var nodes = Array.prototype.slice.call(root.querySelectorAll('[data-i18n]'));
    if (!nodes.length) return;

    var texts = nodes
      .map(function(n){ return (n.textContent || '').trim(); })
      .filter(function(t){ return t.length > 0; });

    if (!texts.length) return;

    var unique = Array.from(new Set(texts));

    fetch('/api/i18n/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: lang, items: unique }),
      cache: 'no-store'
    })
    .then(function(r){ return r.json(); })
    .then(function(j){
      if (!j || !j.ok || !Array.isArray(j.translations)) return;
      var map = new Map();
      for (var i = 0; i < unique.length; i++) {
        map.set(unique[i], j.translations[i] || unique[i]);
      }
      nodes.forEach(function(n){
        var src = (n.textContent || '').trim();
        var out = map.get(src);
        if (out && out !== src) n.textContent = out;
      });
    })
    .catch(function(){ /* ignore */ });
  } catch (e) { /* ignore */ }
})();
          `.trim(),
        }}
      />
    </main>
  );
}

// app/flow/us/i-129f/page.jsx
import I129fGate from '@/components/I129fGate';
import I129fWizard from '@/components/I129fWizard';

export const dynamic = 'force-dynamic';

export default function I129fPage() {
  return (
    <main className="section">
      {/* Narrow, centered layout only (no other visual changes) */}
      <div
        id="i129f-scope"
        className="container"
        style={{
          display: 'grid',
          gap: 16,
          maxWidth: 760,         // tighter width for a cleaner, pro look
          margin: '0 auto',
          paddingBottom: 16,
        }}
      >
        <I129fGate>
          <I129fWizard />

          {/* Leave your existing debug link */}
          <p className="small" style={{ marginTop: 8 }}>
            <span data-i18n>Debug all fields:</span>{' '}
            <a href="/flow/us/i-129f/all-fields" data-i18n>open</a>
          </p>
        </I129fGate>
      </div>

      {/* Inline translator:
         - reads liason_lang cookie
         - translates all [data-i18n] text nodes
         - also supports attribute translations via data-i18n-attr="placeholder,title,aria-label"
         - runs twice (DOMContentLoaded + idle) to catch late-rendered bits
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  function getLang() {
    var m = document.cookie.match(/(?:^|;\\s*)liason_lang=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : 'en';
  }

  function gather(root) {
    var tags = [].slice.call(root.querySelectorAll('[data-i18n]'));
    var texts = [];
    tags.forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (t) texts.push({ el: el, text: t });
    });

    // attribute translations if you add data-i18n-attr="placeholder,title,aria-label"
    var attrEls = [].slice.call(root.querySelectorAll('[data-i18n-attr]'));
    var attrJobs = [];
    attrEls.forEach(function (el) {
      var list = (el.getAttribute('data-i18n-attr') || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
      list.forEach(function (attr) {
        var v = (el.getAttribute(attr) || '').trim();
        if (v) attrJobs.push({ el: el, attr: attr, text: v });
      });
    });

    // unique text payload we will translate
    var payload = [];
    var seen = new Set();
    texts.forEach(function (x) { if (!seen.has(x.text)) { seen.add(x.text); payload.push(x.text); } });
    attrJobs.forEach(function (x) { if (!seen.has(x.text)) { seen.add(x.text); payload.push(x.text); } });

    return { texts, attrJobs, payload };
  }

  function applyTranslations(job, translations) {
    // build map text -> translated
    var map = new Map();
    for (var i = 0; i < job.payload.length; i++) {
      map.set(job.payload[i], translations[i] || job.payload[i]);
    }
    // update text nodes
    job.texts.forEach(function (x) {
      var out = map.get(x.text);
      if (out && out !== x.text) x.el.textContent = out;
    });
    // update attributes
    job.attrJobs.forEach(function (x) {
      var out = map.get(x.text);
      if (out && out !== x.text) x.el.setAttribute(x.attr, out);
    });
  }

  function doTranslate() {
    var lang = getLang();
    if (!lang || lang === 'en') return; // English: skip

    var root = document.getElementById('i129f-scope');
    if (!root) return;

    var job = gather(root);
    if (!job.payload.length) return;

    fetch('/api/i18n/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // IMPORTANT: use your existing DeepL batch API
      body: JSON.stringify({ lang: lang, items: job.payload }),
      cache: 'no-store',
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !Array.isArray(j.translations)) return;
        applyTranslations(job, j.translations);
      })
      .catch(function(){});
  }

  // run after DOM is ready and once again at idle to catch late client bits
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ doTranslate(); requestIdleCallback(doTranslate); });
  } else {
    doTranslate(); requestIdleCallback(doTranslate);
  }
})();
          `.trim(),
        }}
      />
    </main>
  );
}

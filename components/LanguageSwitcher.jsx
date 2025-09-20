'use client';

import { useEffect, useRef, useState } from 'react';

/** Cookie helpers (no imports needed) */
function getLangCookie() {
  if (typeof document === 'undefined') return 'en';
  const m = document.cookie.match(/(?:^|;\s*)liason_lang=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : 'en';
}
function setLangCookie(code) {
  // mirror server cookie (1 year, public so client JS can read)
  document.cookie = `liason_lang=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}

/** Collect text nodes in the given root, skipping script/style/noscript and hidden nodes */
function collectTextNodes(root) {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        // skip empty/whitespace-only
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // ignore tiny fragments like ":" or "•"
        if (node.nodeValue.trim().length < 2) return NodeFilter.FILTER_REJECT;
        // skip aria-hidden / hidden
        if (p.hasAttribute('aria-hidden') || p.hidden) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  return nodes;
}

/** Split work into chunks (DeepL handles many, but we’ll be gentle) */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  // Keep originals so we can restore when switching back to English
  const originalText = useRef(new WeakMap());       // TextNode -> original string
  const translatedCache = useRef(new Map());        // `${lang}::${text}` -> translated string
  const lastAppliedLang = useRef(null);

  // Find what to translate. Prefer an explicit marker to avoid translating header/nav.
  function findTranslationRoots() {
    // If you add data-i18n-scan on your main content container, we’ll prioritize it.
    const marked = Array.from(document.querySelectorAll('[data-i18n-scan]'));
    if (marked.length) return marked;
    // Fallback: main content area
    const main = document.querySelector('main');
    return main ? [main] : [document.body];
  }

  async function translatePage(toLang) {
    if (typeof document === 'undefined') return;
    if (!toLang || toLang.toLowerCase() === 'en') {
      // restore originals
      for (const root of findTranslationRoots()) {
        const nodes = collectTextNodes(root);
        nodes.forEach((n) => {
          const orig = originalText.current.get(n);
          if (typeof orig === 'string') n.nodeValue = orig;
        });
      }
      lastAppliedLang.current = 'en';
      return;
    }

    // gather nodes & unique strings
    const roots = findTranslationRoots();
    const nodes = roots.flatMap(collectTextNodes);

    // record originals once
    nodes.forEach((n) => {
      if (!originalText.current.has(n)) originalText.current.set(n, n.nodeValue);
    });

    const uniqueTexts = [];
    const seen = new Set();
    for (const n of nodes) {
      const t = originalText.current.get(n) ?? n.nodeValue;
      const key = `${toLang}::${t}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTexts.push({ key, lang: toLang, text: t });
      }
    }

    // check cache and build request batches
    const toTranslate = [];
    const resultMap = new Map(); // key -> translated
    for (const u of uniqueTexts) {
      const cached = translatedCache.current.get(u.key);
      if (cached) {
        resultMap.set(u.key, cached);
      } else {
        toTranslate.push(u);
      }
    }

    // call batch API in chunks (e.g., 100 strings per request)
    const groups = chunk(toTranslate, 100);
    for (const g of groups) {
      const items = g.map((x) => x.text);
      try {
        const res = await fetch('/api/i18n/translate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, lang: toLang })
        });
        const j = await res.json();
        if (j?.ok && Array.isArray(j.translations)) {
          j.translations.forEach((tx, idx) => {
            const k = g[idx].key;
            translatedCache.current.set(k, tx);
            resultMap.set(k, tx);
          });
        }
      } catch (e) {
        // ignore errors; leave English text in place for any failed batch
      }
    }

    // apply translations to nodes
    for (const n of nodes) {
      const orig = originalText.current.get(n) ?? n.nodeValue;
      const k = `${toLang}::${orig}`;
      const tx = resultMap.get(k);
      if (tx) n.nodeValue = tx;
    }
    lastAppliedLang.current = toLang;
  }

  // On mount, set current lang from cookie, then translate if needed
  useEffect(() => {
    const current = getLangCookie();
    setLang(current);
    if (current !== 'en') {
      // delay slightly so content is in DOM
      setTimeout(() => translatePage(current), 0);
    }
    // Re-translate if DOM changes significantly (simple observer)
    const obs = new MutationObserver(() => {
      if (lastAppliedLang.current && lastAppliedLang.current !== 'en') {
        translatePage(lastAppliedLang.current);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function change(e) {
    const value = e.target.value;
    setLang(value);
    // set cookie both client-side and via your route (so SSR pages can read it if they ever do)
    setLangCookie(value);
    try {
      await fetch('/api/i18n/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: value })
      });
    } catch {}
    // Apply on the spot (no full reload)
    translatePage(value);
  }

  return (
    <select
      className="select"
      aria-label="Language"
      value={lang}
      onChange={change}
      style={{ minWidth: 120 }}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="de">Deutsch</option>
      <option value="pt">Português</option>
      <option value="it">Italiano</option>
      <option value="zh">中文</option>
      <option value="ja">日本語</option>
      <option value="ar">العربية</option>
      <option value="hi">हिन्दी</option>
      <option value="ru">Русский</option>
    </select>
  );
}

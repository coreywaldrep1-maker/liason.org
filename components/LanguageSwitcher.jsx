'use client';

import { useEffect, useState } from 'react';

function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

async function setLangCookie(code) {
  await fetch('/api/i18n/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: code })
  });
}

/** Collect all text nodes under [data-i18n-scan], skipping script/style/noscript and [data-i18n-skip] subtrees. */
function collectTextNodes() {
  const roots = Array.from(document.querySelectorAll('[data-i18n-scan]'));
  const nodes = [];
  for (const root of roots) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (p.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT;

        const raw = node.nodeValue ?? '';
        // collapse whitespace; ignore tiny or pure-whitespace nodes
        const txt = raw.replace(/\s+/g, ' ').trim();
        if (!txt) return NodeFilter.FILTER_REJECT;
        // avoid translating form values/inputs; we only do plain text content
        if (p.closest('input,textarea,select')) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
  }
  return nodes;
}

/** Build translation request arrays and a mapping back to nodes. */
function prepareBatches(nodes) {
  // Remember originals once so we can safely toggle languages
  for (const n of nodes) {
    if (!n.parentElement?.dataset) continue;
    if (!n.parentElement.dataset.i18nOrig) {
      const orig = (n.nodeValue ?? '').replace(/\s+/g, ' ');
      n.parentElement.dataset.i18nOrig = orig;
    }
  }

  const originals = nodes.map(n => n.parentElement?.dataset?.i18nOrig || (n.nodeValue ?? '').replace(/\s+/g, ' '));
  // Deduplicate to save tokens
  const order = [];
  const seen = new Set();
  for (const s of originals) {
    const key = s.trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      order.push(key);
    }
  }
  const indexMap = new Map(order.map((s, i) => [s, i]));
  const positions = originals.map(s => indexMap.get(s.trim() || '') ?? -1);

  return { order, positions };
}

async function translateBatch(items, source, target) {
  const res = await fetch('/api/i18n/translate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target, items })
  });
  const json = await res.json().catch(() => ({ ok: false, error: 'bad json' }));
  if (!json.ok) throw new Error(json.error || 'translate failed');
  return json.translations || [];
}

/** Apply translations back to DOM nodes based on positions */
function applyTranslations(nodes, positions, dedupedTranslations) {
  nodes.forEach((node, i) => {
    const pos = positions[i];
    if (pos >= 0) {
      const t = dedupedTranslations[pos];
      if (typeof t === 'string' && t.length) {
        node.nodeValue = t;
      }
    }
  });
}

/** Restore originals (English) from data attributes */
function restoreOriginals(nodes) {
  nodes.forEach(node => {
    const orig = node.parentElement?.dataset?.i18nOrig;
    if (typeof orig === 'string') node.nodeValue = orig;
  });
}

/** Main translate-or-restore flow */
async function translatePageTo(targetLang) {
  // Only operate inside the marked content
  const nodes = collectTextNodes();
  if (!nodes.length) return;

  if (!targetLang || targetLang.toLowerCase() === 'en') {
    restoreOriginals(nodes);
    return;
  }

  const { order, positions } = prepareBatches(nodes);
  if (!order.length) return;

  // We consider English our source; DeepL can handle auto, but explicit is fine.
  const translations = await translateBatch(order, 'EN', targetLang.toUpperCase());
  applyTranslations(nodes, positions, translations);
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  // Initialize from cookie & auto-translate on load (without reloading the whole page)
  useEffect(() => {
    const current = getCookie('liason_lang') || 'en';
    setLang(current);
    translatePageTo(current).catch(() => {});
  }, []);

  async function onChange(e) {
    const next = e.target.value;
    setLang(next);
    await setLangCookie(next);
    // translate in-place (no full reload)
    await translatePageTo(next);
  }

  return (
    <select
      value={lang}
      onChange={onChange}
      aria-label="Language"
      className="select"
      // keep your existing styling; no width/layout changes
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
      <option value="ru">Русский</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}

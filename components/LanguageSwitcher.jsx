'use client';

import { useEffect, useState } from 'react';

// Store originals per *text node* (not per parent element).
// This avoids bugs where multiple text nodes share the same parent (e.g. "1", ".", " Part 1")
// and all get overwritten with the same translation.
const ORIGINAL_TEXT = new WeakMap();

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
        const txt = raw.replace(/\s+/g, ' ').trim();
        if (!txt) return NodeFilter.FILTER_REJECT;

        // Avoid translating UI numbers like "1", "2.", etc.
        if (/^\d+[.)]?$/.test(txt)) return NodeFilter.FILTER_REJECT;

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
  // Remember originals once so we can safely toggle languages.
  // NOTE: We store originals on the Text node itself (via WeakMap), not on the parent element.
  for (const n of nodes) {
    if (!ORIGINAL_TEXT.has(n)) {
      ORIGINAL_TEXT.set(n, (n.nodeValue ?? '').replace(/\s+/g, ' '));
    }
  }

  const originals = nodes.map((n) => (ORIGINAL_TEXT.get(n) ?? (n.nodeValue ?? '')).replace(/\s+/g, ' '));

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
  const positions = originals.map((s) => indexMap.get(s.trim() || '') ?? -1);

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

/** Restore originals (English) */
function restoreOriginals(nodes) {
  nodes.forEach((node) => {
    const orig = ORIGINAL_TEXT.get(node);
    if (typeof orig === 'string') node.nodeValue = orig;
  });
}

/** Main translate-or-restore flow */
async function translatePageTo(targetLang) {
  const nodes = collectTextNodes();
  if (!nodes.length) return;

  if (!targetLang || targetLang.toLowerCase() === 'en') {
    restoreOriginals(nodes);
    return;
  }

  const { order, positions } = prepareBatches(nodes);
  if (!order.length) return;

  const translations = await translateBatch(order, 'EN', targetLang.toUpperCase());
  applyTranslations(nodes, positions, translations);
}

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const current = getCookie('liason_lang') || 'en';
    setLang(current);
    translatePageTo(current).catch(() => {});
  }, []);

  async function onChange(e) {
    const next = e.target.value;
    setLang(next);
    await setLangCookie(next);
    await translatePageTo(next);
  }

  return (
    <select value={lang} onChange={onChange} aria-label="Language" className="select">
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

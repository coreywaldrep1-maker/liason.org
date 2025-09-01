'use client';

import { useEffect } from 'react';
import { getLangCookie } from '@/lib/i18n-client';
import { DEFAULT_LANG } from '@/lib/i18n-common';

const SKIP_TAGS = new Set(['SCRIPT','STYLE','NOSCRIPT','CODE','PRE','TEXTAREA','INPUT','SELECT','OPTION','SVG','MATH']);

function getTextNodes(root) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest('[data-no-translate]')) return NodeFilter.FILTER_REJECT;

      const text = node.nodeValue || '';
      const trimmed = text.trim();
      if (trimmed.length < 2) return NodeFilter.FILTER_REJECT; // skip short/whitespace
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  let node;
  while ((node = walker.nextNode())) out.push(node);
  return out;
}

export default function AutoTranslate() {
  useEffect(() => {
    const lang = getLangCookie();
    if (!lang || lang === DEFAULT_LANG) return;

    let destroyed = false;
    const translated = new WeakSet();       // mark nodes already translated
    const cache = new Map();                // cache per source text (same string reused across page)

    async function translateBatch(nodes) {
      if (destroyed || nodes.length === 0) return;

      // Gather unique, untranslated strings
      const pending = [];
      for (const n of nodes) {
        if (!translated.has(n)) {
          const src = (n.nodeValue || '').trim();
          if (src && !cache.has(src)) pending.push(src);
        }
      }
      if (!pending.length) return;

      // Soft limit to keep request sizes reasonable
      const chunkSize = 40;
      for (let i = 0; i < pending.length; i += chunkSize) {
        const chunk = pending.slice(i, i + chunkSize);
        try {
          const res = await fetch('/api/i18n/translate-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texts: chunk, targetLang: lang }),
          });
          const data = await res.json();
          if (data?.ok && data.map) {
            for (const src of chunk) {
              cache.set(src, data.map[src] ?? src);
            }
          }
        } catch {
          // If DeepL fails, fall back to original. We just cache originals.
          for (const src of chunk) cache.set(src, src);
        }
      }

      // Apply translations
      for (const n of nodes) {
        if (translated.has(n)) continue;
        const src = (n.nodeValue || '').trim();
        if (!src) continue;
        const tr = cache.get(src);
        if (tr && tr !== src) {
          // keep original spacing around trimmed text
          const leading = (n.nodeValue || '').match(/^\s*/)[0];
          const trailing = (n.nodeValue || '').match(/\s*$/)[0];
          n.nodeValue = `${leading}${tr}${trailing}`;
        }
        translated.add(n);
      }
    }

    // Initial pass
    translateBatch(getTextNodes(document.body));

    // Observe future changes (wizard, modals, client nav)
    const mo = new MutationObserver(muts => {
      const candidates = [];
      for (const m of muts) {
        if (m.type === 'characterData' && m.target?.nodeType === Node.TEXT_NODE) {
          candidates.push(m.target);
        }
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            candidates.push(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            candidates.push(...getTextNodes(node));
          }
        }
      }
      if (candidates.length) translateBatch(candidates);
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => { destroyed = true; mo.disconnect(); };
  }, []);

  return null; // no UI
}

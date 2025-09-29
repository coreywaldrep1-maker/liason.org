// components/AutoTranslate.jsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from './I18nProvider';

// Gather visible text nodes, skipping elements that shouldn't be translated
function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;

      // Skip special elements
      if (el.closest('script,style,code,pre,[data-no-translate]')) return NodeFilter.FILTER_REJECT;

      // Avoid translating pure numbers or "1." etc (prevents 111/222/333 tab bug)
      const trimmed = node.nodeValue.trim();
      if (/^\d+[.\s]*$/.test(trimmed)) return NodeFilter.FILTER_REJECT;

      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

async function translatePage(lang) {
  if (!lang || lang === 'en') return;

  const nodes = collectTextNodes(document.body);
  if (nodes.length === 0) return;

  // Deduplicate original strings
  const originals = Array.from(new Set(nodes.map(n => n.nodeValue)));

  // Use your existing translation API. If it fails, silently no-op.
  let map = null;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lang, texts: originals })
    });
    if (!res.ok) return;
    map = await res.json(); // expect { original: translated, ... }
  } catch {
    return;
  }
  if (!map) return;

  // Replace in DOM
  for (const n of nodes) {
    const orig = n.nodeValue;
    const translated = map[orig];
    if (translated && translated !== orig) n.nodeValue = translated;
  }
}

export default function AutoTranslate() {
  const { lang } = useI18n();
  const pathname = usePathname();

  useEffect(() => {
    translatePage(lang);
  }, [lang, pathname]);

  return null;
}

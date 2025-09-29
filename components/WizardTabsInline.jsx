// components/WizardTabsInline.jsx
'use client';

import React from 'react';
import { I129F_SECTIONS } from '@/lib/i129f-mapping';

/**
 * Tabs row to place directly under the header on the I-129F page.
 * - Numbers are wrapped in data-no-translate to prevent 111/222/333 issues.
 * - Labels are free to translate.
 */
export default function WizardTabsInline({
  sections = I129F_SECTIONS,
  active = 0,
  onChange
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 pb-2 border-b" data-i18n-scope="tabs">
        {sections.map((label, i) => {
          const isActive = i === active;
          return (
            <button
              key={i}
              type="button"
              aria-selected={isActive}
              className={
                'whitespace-nowrap px-3 py-1 rounded border transition ' +
                (isActive
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black hover:bg-neutral-100')
              }
              onClick={() => onChange?.(i)}
            >
              <span className="font-semibold" data-no-translate>
                {i + 1}.
              </span>{' '}
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

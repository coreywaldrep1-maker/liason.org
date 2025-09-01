// components/MenuDropdown.jsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useI18n } from './I18nProvider';

export default function MenuDropdown() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      alert('Logout failed');
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="small"
        style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
      >
        ☰
      </button>

      {open && (
        <nav
          role="menu"
          aria-label="Main"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 6,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            minWidth: 200,
            zIndex: 1000,
          }}
        >
          <ul style={{ listStyle: 'none', margin: 0, padding: 8, display: 'grid', gap: 6 }}>
            <li><Link className="small" href="/" onClick={() => setOpen(false)} style={item}> {t('menu.home')} </Link></li>
            <li><Link className="small" href="/visas" onClick={() => setOpen(false)} style={item}> {t('menu.visas')} </Link></li>
            <li><Link className="small" href="/about" onClick={() => setOpen(false)} style={item}> {t('menu.about')} </Link></li>
            <li><Link className="small" href="/policies" onClick={() => setOpen(false)} style={item}> {t('menu.policies')} </Link></li>
            <li><hr style={{ border: 0, height: 1, background: '#e2e8f0', margin: '6px 0' }} /></li>
            <li>
              <button className="small" onClick={onLogout} style={{ ...item, width: '100%', textAlign: 'left', background: 'transparent' }}>
                {t('menu.logout')}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

const item = {
  display: 'block',
  padding: '8px 10px',
  borderRadius: 6,
  textDecoration: 'none',
  color: '#0f172a',
};

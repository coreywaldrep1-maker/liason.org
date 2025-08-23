'use client';
import { useState, useEffect, useRef } from 'react';

export default function HomeMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close when clicking outside the panel
  useEffect(() => {
    function onDocClick(e) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: 16,
        left: 16,           // <-- moved to LEFT
        right: 'auto',
        zIndex: 50
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="btn btn-primary"
      >
        Menu
      </button>

      {open && (
        <nav
          role="menu"
          aria-label="Home quick links"
          className="card"
          style={{ marginTop: 8, width: 220, display: 'grid', gap: 8 }}
        >
          <a href="/" className="btn" role="menuitem">Home</a>                {/* <-- added */}
          <a href="/visas/us" className="btn" role="menuitem">US Visas</a>
          <a href="/visas/canada" className="btn" role="menuitem">Canada Visas</a>
          <a href="/visas/europe" className="btn" role="menuitem">Europe Visas</a>
          <a href="/policies" className="btn" role="menuitem">Policies</a>    {/* own page */}
        </nav>
      )}
    </div>
  );
}

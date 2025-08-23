'use client';
import { useState } from 'react';

// Top languages for quick switching
const LANGS = [
  ['en','English'], ['es','Español'], ['fr','Français'], ['pt','Português'],
  ['ar','العربية'], ['hi','हिन्दी'], ['zh','中文'], ['ru','Русский'],
  ['de','Deutsch'], ['it','Italiano'], ['ja','日本語'], ['ko','한국어'],
  ['vi','Tiếng Việt'], ['tr','Türkçe'], ['pl','Polski'], ['fa','فارسی'],
  ['ur','اردو'], ['bn','বাংলা'], ['th','ไทย'], ['id','Bahasa Indonesia']
];

export default function AiHelp({ section = 'general', context = '' }) {
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState('');
  const [err, setErr] = useState('');

  async function ask(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true); setAnswer(''); setErr('');
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ message, language, section, context })
      });
      const j = await r.json();
      if (!r.ok || j.error) {
        const d = (j && j.details) ? String(j.details).slice(0, 400) : '';
        setErr((j.error || 'There was an error.') + (d ? ` — ${d}` : ''));
      } else {
        setAnswer(j.text || 'No answer.');
      }
    } catch (e) {
      setErr('There was a problem contacting the AI.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
        <strong>Liason AI Help</strong>
        <select
          value={language}
          onChange={(e)=>setLanguage(e.target.value)}
          aria-label="Language"
          style={{
            backgroundColor:'#fff',
            border:'1px solid #e2e8f0',
            borderRadius:8,
            padding:'6px 8px'
          }}
        >
          {LANGS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>

      <form onSubmit={ask} style={{display:'grid', gap:8}}>
        <textarea
          rows={4}
          placeholder="Ask a question about this section…"
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          style={{
            width:'100%',
            padding:8,
            border:'1px solid #e2e8f0',
            borderRadius:8,
            backgroundColor:'#fff'   // <-- makes the box white
          }}
        />
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Thinking…' : 'Ask Liason'}
          </button>
        </div>
      </form>

      {err && (
        <div className="card" style={{background:'#fff5f5', border:'1px solid #fecaca'}}>
          <div className="small" style={{color:'#b91c1c'}}>{err}</div>
        </div>
      )}

      {answer && (
        <div className="card" style={{background:'#fafafa'}}>
          <div className="small" style={{whiteSpace:'pre-wrap'}}>{answer}</div>
        </div>
      )}
    </div>
  );
}

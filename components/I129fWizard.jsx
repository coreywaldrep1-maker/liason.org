// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { I129F_SECTIONS as MAP_SECTIONS } from '@/lib/i129f-mapping';

/* ----------------------------------------
   Sections (prefer labels from mapping)
---------------------------------------- */
const SECTIONS = (MAP_SECTIONS && MAP_SECTIONS.length)
  ? MAP_SECTIONS
  : [
      { key: 'p1_ident', label: 'Part 1 — Petitioner (Identity)' },
      { key: 'p1_addr',  label: 'Part 1 — Addresses' },
      { key: 'p1_emp',   label: 'Part 1 — Employment' },
      { key: 'p1_par',   label: 'Part 1 — Parents & Naturalization' },

      { key: 'p2_ident', label: 'Part 2 — Beneficiary (Identity)' },
      { key: 'p2_addr',  label: 'Part 2 — Addresses' },
      { key: 'p2_emp',   label: 'Part 2 — Employment' },
      { key: 'p2_par',   label: 'Part 2 — Parents' },

      { key: 'p5_7',     label: 'Parts 5–7 — Contact / Interpreter / Preparer' },
      { key: 'p8',       label: 'Part 8 — Additional Info' },

      { key: 'review',   label: 'Review & Download' },
    ];

/* ----------------------------------------
   Empty Shape (safe defaults)
---------------------------------------- */
const EMPTY = {
  petitioner: {
    aNumber: '', uscisOnlineAccount: '', ssn: '',
    lastName: '', firstName: '', middleName: '',
    otherNames: [ { lastName:'', firstName:'', middleName:'' }, { lastName:'', firstName:'', middleName:'' } ],
    phone: '', mobile: '', email: '',
    parents: [
      { lastName:'', firstName:'', middleName:'', dob:'', cityBirth:'', countryBirth:'', nationality:'' },
      { lastName:'', firstName:'', middleName:'', dob:'', cityBirth:'', countryBirth:'', nationality:'' },
    ],
    natzNumber:'', natzPlace:'', natzDate:'',
  },

  mailing: {
    inCareOf:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', isUS:true,
    sameAsPhysical:false,
  },

  physicalAddresses: [
    { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', from:'', to:'' },
    { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', from:'', to:'' },
  ],

  employment: [
    { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
    { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
  ],

  beneficiary: {
    lastName:'', firstName:'', middleName:'',
    aNumber:'', ssn:'', dob:'', cityBirth:'', countryBirth:'', nationality:'',
    otherNames: [ { lastName:'', firstName:'', middleName:'' }, { lastName:'', firstName:'', middleName:'' } ],
    mailing: { inCareOf:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
    physicalAddress: { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
    employment: [
      { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
      { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
    ],
    parents: [
      { lastName:'', firstName:'', middleName:'', dob:'', cityBirth:'', countryBirth:'', nationality:'' },
      { lastName:'', firstName:'', middleName:'', dob:'', cityBirth:'', countryBirth:'', nationality:'' },
    ],
  },

  interpreter: {
    language:'', email:'', signDate:'', lastName:'', firstName:'', business:'', phone1:'', phone2:''
  },

  preparer: {
    lastName:'', firstName:'', business:'', phone:'', mobile:'', email:'', signDate:''
  },

  part8: {
    line3d:'', line4d:'', line5d:'', line6d:'', line7d:''
  },

  // Power override for any exact AcroForm field names → value
  other: {},
};

/* ----------------------------------------
   Path helpers
---------------------------------------- */
function splitPath(path) {
  return Array.isArray(path) ? path : String(path).split('.');
}
function getPath(obj, path) {
  const parts = splitPath(path);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function setPath(obj, path, value) {
  const parts = splitPath(path);
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (cur[p] == null || typeof cur[p] !== 'object') {
      cur[p] = {};
    }
    cur = cur[p];
  }
  cur[last] = value;
}

/* ----------------------------------------
   Date helpers: keep MM/DD/YYYY in state,
   show <input type="date"> (YYYY-MM-DD) in UI
---------------------------------------- */
function isoToUs(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return '';
  return `${m[2]}/${m[3]}/${m[1]}`;
}
function usToIso(us) {
  if (!us) return '';
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(us.trim());
  if (!m) return '';
  const mm = String(m[1]).padStart(2,'0');
  const dd = String(m[2]).padStart(2,'0');
  let yyyy = m[3];
  if (yyyy.length === 2) yyyy = Number(yyyy) >= 70 ? '19'+yyyy : '20'+yyyy;
  return `${yyyy}-${mm}-${dd}`;
}
function normalizeUs(s) {
  if (!s) return '';
  // try ISO first
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoToUs(s);
  // if it's already US-ish, return as is
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return s;
  // attempt Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  }
  return s;
}
function DateInput({ value, onChange }) {
  const isoValue = useMemo(() => {
    const us = normalizeUs(value||'');
    return us ? usToIso(us) : '';
  }, [value]);
  return (
    <input
      type="date"
      value={isoValue}
      onChange={e => onChange(isoToUs(e.target.value))}
    />
  );
}

/* ----------------------------------------
   Select helpers
---------------------------------------- */
function UnitTypeSelect({ value, onChange }) {
  return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value=""></option>
      <option value="Apt">Apt</option>
      <option value="Ste">Ste</option>
      <option value="Flr">Flr</option>
    </select>
  );
}

/* ----------------------------------------
   Wizard
---------------------------------------- */
export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY);

  // load
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.ok && j.data) {
          // shallow merge over EMPTY so required arrays exist
          const merged = structuredClone(EMPTY);
          // copy incoming keys over defaults
          Object.assign(merged, j.data);
          // deep-ish merge specific subtrees that often are missing
          merged.petitioner = { ...EMPTY.petitioner, ...(j.data.petitioner||{}) };
          merged.mailing = { ...EMPTY.mailing, ...(j.data.mailing||{}) };
          merged.beneficiary = { ...EMPTY.beneficiary, ...(j.data.beneficiary||{}) };
          merged.part8 = { ...EMPTY.part8, ...(j.data.part8||{}) };
          merged.other = { ...(j.data.other||{}) };
          merged.physicalAddresses = Array.isArray(j.data.physicalAddresses) && j.data.physicalAddresses.length
            ? j.data.physicalAddresses
            : EMPTY.physicalAddresses;
          merged.employment = Array.isArray(j.data.employment) && j.data.employment.length
            ? j.data.employment
            : EMPTY.employment;
          setForm(merged);
        }
      } catch {}
    })();
  }, []);

  function update(path, value) {
    setForm(prev => {
      const next = structuredClone(prev);
      setPath(next, path, value);
      return next;
    });
  }

  function add(path, factory) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = getPath(next, path);
      if (!Array.isArray(arr)) setPath(next, path, []);
      getPath(next, path).push(factory());
      return next;
    });
  }
  function remove(path, idx) {
    setForm(prev => {
      const next = structuredClone(prev);
      const arr = getPath(next, path);
      if (Array.isArray(arr)) arr.splice(idx, 1);
      return next;
    });
  }

  // spill extras (>2 entries) into Part 8 automatically on save
  function spillExtrasIntoPart8(n) {
    const extras = [];

    const petOther = (n.petitioner?.otherNames||[]).slice(2);
    if (petOther.length) {
      const lines = petOther.map((x,i)=>`Petitioner Other Name #${i+3}: ${x.lastName||''}, ${x.firstName||''} ${x.middleName||''}`.trim());
      extras.push(lines.join(' | '));
    }
    const addrExtra = (n.physicalAddresses||[]).slice(2);
    if (addrExtra.length) {
      const lines = addrExtra.map((a,i)=>`Address #${i+3}: ${a.street||''} ${a.unitType||''} ${a.unitNum||''}, ${a.city||''} ${a.state||''} ${a.zip||a.postal||''}, ${a.country||''} (${a.from||''}–${a.to||''})`);
      extras.push(lines.join(' | '));
    }
    const benOther = (n.beneficiary?.otherNames||[]).slice(2);
    if (benOther.length) {
      const lines = benOther.map((x,i)=>`Beneficiary Other Name #${i+3}: ${x.lastName||''}, ${x.firstName||''} ${x.middleName||''}`.trim());
      extras.push(lines.join(' | '));
    }

    const joined = extras.join(' || ');
    if (joined) {
      const cur = (n.part8?.line3d || '').trim();
      const sep = cur ? '\n' : '';
      n.part8 = n.part8 || {};
      n.part8.line3d = `${cur}${sep}${joined}`;
    }
  }

  async function save() {
    setBusy(true);
    try {
      const normalized = structuredClone(form);

      // normalize date strings to MM/DD/YYYY consistently
      const datePaths = [
        'petitioner.natzDate',
        'beneficiary.dob',
        'preparer.signDate',
        'interpreter.signDate',
      ];
      datePaths.forEach(p => {
        const v = getPath(normalized, p);
        if (v) setPath(normalized, p, normalizeUs(v));
      });

      (normalized.petitioner?.parents||[]).forEach((p,i)=>{
        if (p?.dob) setPath(normalized, `petitioner.parents.${i}.dob`, normalizeUs(p.dob));
      });
      (normalized.beneficiary?.parents||[]).forEach((p,i)=>{
        if (p?.dob) setPath(normalized, `beneficiary.parents.${i}.dob`, normalizeUs(p.dob));
      });
      (normalized.physicalAddresses||[]).forEach((a,i)=>{
        if (a?.from) setPath(normalized, `physicalAddresses.${i}.from`, normalizeUs(a.from));
        if (a?.to)   setPath(normalized, `physicalAddresses.${i}.to`, normalizeUs(a.to));
      });
      (normalized.employment||[]).forEach((e,i)=>{
        if (e?.from) setPath(normalized, `employment.${i}.from`, normalizeUs(e.from));
        if (e?.to)   setPath(normalized, `employment.${i}.to`, normalizeUs(e.to));
      });
      (normalized.beneficiary?.employment||[]).forEach((e,i)=>{
        if (e?.from) setPath(normalized, `beneficiary.employment.${i}.from`, normalizeUs(e.from));
        if (e?.to)   setPath(normalized, `beneficiary.employment.${i}.to`, normalizeUs(e.to));
      });

      // spill extras (>2) into Part 8 automatically
      spillExtrasIntoPart8(normalized);

      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: normalized }),
      });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      alert('Progress saved');
    } catch (e) {
      alert('Save failed. Make sure you are logged in.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function next() { setStep(s => Math.min(s+1, SECTIONS.length-1)); }
  function back() { setStep(s => Math.max(s-1, 0)); }

  const Tabs = (
    <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:12}}>
      {SECTIONS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          onClick={() => setStep(i)}
          className="small"
          style={{
            padding:'6px 10px',
            border:'1px solid #e2e8f0',
            borderRadius:8,
            background: i===step ? '#eef2ff' : '#fff',
            cursor:'pointer'
          }}
          title={s.label}
        >
          {i+1}. {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card i129f-compact" style={{display:'grid', gap:12}}>
      {Tabs}

      {step===0 && <Part1Identity form={form} update={update} add={add} remove={remove} />}
      {step===1 && <Part1Addresses form={form} update={update} add={add} remove={remove} onCopyMailing={()=>{
        const m = form.mailing||{};
        const copy = {
          street:m.street, unitType:m.unitType, unitNum:m.unitNum, city:m.city, state:m.state,
          zip:m.zip, province:m.province, postal:m.postal, country:m.country, from:'', to:'',
        };
        setForm(prev=>{
          const next = structuredClone(prev);
          if (!Array.isArray(next.physicalAddresses)) next.physicalAddresses = [];
          next.physicalAddresses[0] = next.physicalAddresses[0] || {};
          Object.assign(next.physicalAddresses[0], copy);
          return next;
        });
      }} />}
      {step===2 && <Part1Employment form={form} update={update} add={add} remove={remove} />}
      {step===3 && <Part1ParentsNatz form={form} update={update} />}

      {step===4 && <Part2Identity form={form} update={update} add={add} remove={remove} />}
      {step===5 && <Part2Addresses form={form} update={update} />}
      {step===6 && <Part2Employment form={form} update={update} />}
      {step===7 && <Part2Parents form={form} update={update} />}

      {step===8 && <Parts5to7 form={form} update={update} />}
      {step===9 && <Part8Additional form={form} update={update} add={add} remove={remove} />}

      {step===10 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <p className="small">
            Use <a href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">PDF debug overlay</a>.
          </p>
          <div>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
          </div>
        </section>
      )}

      <div style={{display:'flex', gap:8, justifyContent:'space-between', marginTop:8}}>
        <div style={{display:'flex', gap:8}}>
          <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step===SECTIONS.length-1}>Next</button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>

      {/* Scoped, wizard-only compact widths */}
      <style jsx>{`
        .i129f-compact :global(input[type="text"]),
        .i129f-compact :global(input[type="email"]),
        .i129f-compact :global(input[type="tel"]),
        .i129f-compact :global(input[type="date"]),
        .i129f-compact :global(select) {
          width: 100%;
          max-width: 520px;
        }
        .i129f-compact :global(textarea) {
          width: 100%;
          max-width: 680px;
        }
        .i129f-compact :global(.row-2) {
          display: grid;
          gap: .75rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-width: 680px;
        }
        @media (max-width: 640px) {
          .i129f-compact :global(input),
          .i129f-compact :global(select),
          .i129f-compact :global(textarea),
          .i129f-compact :global(.row-2) {
            max-width: 100%;
          }
          .i129f-compact :global(.row-2) {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/* ----------------------------------------
   Sections (safe: no direct .parents[idx].xxx)
---------------------------------------- */

function Part1Identity({ form, update, add, remove }) {
  const onAddOther = () => add('petitioner.otherNames', () => ({ lastName:'', firstName:'', middleName:'' }));
  const other = Array.isArray(form.petitioner?.otherNames) ? form.petitioner.otherNames : [];
  return (
    <section style={{display:'grid', gap:10}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Identity)</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
        <Field label="A-Number">
          <input value={form.petitioner?.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} />
        </Field>
        <Field label="USCIS Online Account #">
          <input value={form.petitioner?.uscisOnlineAccount||''} onChange={e=>update('petitioner.uscisOnlineAccount', e.target.value)} />
        </Field>
        <Field label="SSN">
          <input value={form.petitioner?.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
        <Field label="Family name (last)">
          <input value={form.petitioner?.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} />
        </Field>
        <Field label="Given name (first)">
          <input value={form.petitioner?.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} />
        </Field>
        <Field label="Middle name">
          <input value={form.petitioner?.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} />
        </Field>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>
      {other.map((n, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}>
            <input value={n?.lastName||''} onChange={e=>update(`petitioner.otherNames.${i}.lastName`, e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={n?.firstName||''} onChange={e=>update(`petitioner.otherNames.${i}.firstName`, e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={n?.middleName||''} onChange={e=>update(`petitioner.otherNames.${i}.middleName`, e.target.value)} />
          </Field>
          <button type="button" className="btn" onClick={()=>remove('petitioner.otherNames', i)}>Remove</button>
        </div>
      ))}
    </section>
  );
}

function Part1Addresses({ form, update, add, remove, onCopyMailing }) {
  const m = form.mailing||{};
  const list = Array.isArray(form.physicalAddresses) ? form.physicalAddresses : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Addresses</h3>

      <div className="small"><strong>Mailing Address (Line 8)</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
        <Field label="In care of (c/o)">
          <input value={m.inCareOf||''} onChange={e=>update('mailing.inCareOf', e.target.value)} />
        </Field>
        <Field label="Street number & name">
          <input value={m.street||''} onChange={e=>update('mailing.street', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
        <Field label="Unit type">
          <UnitTypeSelect value={m.unitType||''} onChange={v=>update('mailing.unitType', v)} />
        </Field>
        <Field label="Unit #">
          <input value={m.unitNum||''} onChange={e=>update('mailing.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={m.city||''} onChange={e=>update('mailing.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={m.state||''} onChange={e=>update('mailing.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={m.zip||''} onChange={e=>update('mailing.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={m.province||''} onChange={e=>update('mailing.province', e.target.value)} />
        </Field>
        <Field label="Postal Code">
          <input value={m.postal||''} onChange={e=>update('mailing.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={m.country||''} onChange={e=>update('mailing.country', e.target.value)} />
        </Field>
      </div>

      <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
        <input type="checkbox" checked={!!m.sameAsPhysical} onChange={e=>{
          update('mailing.sameAsPhysical', e.target.checked);
          if (e.target.checked) onCopyMailing();
        }} />
        Mailing address is the same as current physical address
      </label>

      <div className="small" style={{marginTop:8}}><strong>Physical Address History (Lines 9–10 & 14)</strong></div>
      {list.map((a, i) => {
        const ai = a || {};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Address #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
              <Field label="Street number & name">
                <input value={ai.street||''} onChange={e=>update(`physicalAddresses.${i}.street`, e.target.value)} />
              </Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
                <Field label="Unit type">
                  <UnitTypeSelect value={ai.unitType||''} onChange={v=>update(`physicalAddresses.${i}.unitType`, v)} />
                </Field>
                <Field label="Unit #">
                  <input value={ai.unitNum||''} onChange={e=>update(`physicalAddresses.${i}.unitNum`, e.target.value)} />
                </Field>
                <Field label="City">
                  <input value={ai.city||''} onChange={e=>update(`physicalAddresses.${i}.city`, e.target.value)} />
                </Field>
                <Field label="State">
                  <input value={ai.state||''} onChange={e=>update(`physicalAddresses.${i}.state`, e.target.value)} />
                </Field>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="ZIP">
                <input value={ai.zip||''} onChange={e=>update(`physicalAddresses.${i}.zip`, e.target.value)} />
              </Field>
              <Field label="Province">
                <input value={ai.province||''} onChange={e=>update(`physicalAddresses.${i}.province`, e.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input value={ai.postal||''} onChange={e=>update(`physicalAddresses.${i}.postal`, e.target.value)} />
              </Field>
              <Field label="Country">
                <input value={ai.country||''} onChange={e=>update(`physicalAddresses.${i}.country`, e.target.value)} />
              </Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From">
                <DateInput value={ai.from||''} onChange={v=>update(`physicalAddresses.${i}.from`, v)} />
              </Field>
              <Field label="To">
                <DateInput value={ai.to||''} onChange={v=>update(`physicalAddresses.${i}.to`, v)} />
              </Field>
            </div>
            {i>1 ? <button type="button" className="btn" onClick={()=>remove('physicalAddresses', i)}>Remove</button> : null}
          </div>
        );
      })}
      <div>
        <button type="button" className="btn" onClick={()=>add('physicalAddresses', () => ({street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',from:'',to:''}))}>+ Add address</button>
      </div>
    </section>
  );
}

function Part1Employment({ form, update, add, remove }) {
  const list = Array.isArray(form.employment) ? form.employment : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Employment (last 5 years)</h3>
      {list.map((e, i) => {
        const ei = e||{};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <Field label="Employer name">
              <input value={ei.employer||''} onChange={ev=>update(`employment.${i}.employer`, ev.target.value)} />
            </Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Street">
                <input value={ei.street||''} onChange={ev=>update(`employment.${i}.street`, ev.target.value)} />
              </Field>
              <Field label="Unit type">
                <UnitTypeSelect value={ei.unitType||''} onChange={v=>update(`employment.${i}.unitType`, v)} />
              </Field>
              <Field label="Unit #">
                <input value={ei.unitNum||''} onChange={ev=>update(`employment.${i}.unitNum`, ev.target.value)} />
              </Field>
              <Field label="City">
                <input value={ei.city||''} onChange={ev=>update(`employment.${i}.city`, ev.target.value)} />
              </Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="State">
                <input value={ei.state||''} onChange={ev=>update(`employment.${i}.state`, ev.target.value)} />
              </Field>
              <Field label="ZIP">
                <input value={ei.zip||''} onChange={ev=>update(`employment.${i}.zip`, ev.target.value)} />
              </Field>
              <Field label="Province">
                <input value={ei.province||''} onChange={ev=>update(`employment.${i}.province`, ev.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input value={ei.postal||''} onChange={ev=>update(`employment.${i}.postal`, ev.target.value)} />
              </Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country">
                <input value={ei.country||''} onChange={ev=>update(`employment.${i}.country`, ev.target.value)} />
              </Field>
              <Field label="Occupation">
                <input value={ei.occupation||''} onChange={ev=>update(`employment.${i}.occupation`, ev.target.value)} />
              </Field>
              <Field label="From">
                <DateInput value={ei.from||''} onChange={v=>update(`employment.${i}.from`, v)} />
              </Field>
            </div>
            <Field label="To">
              <DateInput value={ei.to||''} onChange={v=>update(`employment.${i}.to`, v)} />
            </Field>
            {i>1 ? <button type="button" className="btn" onClick={()=>remove('employment', i)}>Remove</button> : null}
          </div>
        );
      })}
      <div>
        <button type="button" className="btn" onClick={()=>add('employment', () => ({ employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' }))}>+ Add employer</button>
      </div>
    </section>
  );
}

function Part1ParentsNatz({ form, update }) {
  const p0 = (form.petitioner?.parents && form.petitioner.parents[0]) ? form.petitioner.parents[0] : {};
  const p1 = (form.petitioner?.parents && form.petitioner.parents[1]) ? form.petitioner.parents[1] : {};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Parents & Naturalization</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent #1</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family">
            <input value={p0.lastName||''} onChange={e=>update('petitioner.parents.0.lastName', e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={p0.firstName||''} onChange={e=>update('petitioner.parents.0.firstName', e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={p0.middleName||''} onChange={e=>update('petitioner.parents.0.middleName', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of birth">
            <DateInput value={p0.dob||''} onChange={v=>update('petitioner.parents.0.dob', v)} />
          </Field>
          <Field label="City of birth">
            <input value={p0.cityBirth||''} onChange={e=>update('petitioner.parents.0.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of birth / nationality">
            <input value={p0.countryBirth||''} onChange={e=>update('petitioner.parents.0.countryBirth', e.target.value)} />
          </Field>
        </div>
        <Field label="Nationality">
          <input value={p0.nationality||''} onChange={e=>update('petitioner.parents.0.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent #2</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family">
            <input value={p1.lastName||''} onChange={e=>update('petitioner.parents.1.lastName', e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={p1.firstName||''} onChange={e=>update('petitioner.parents.1.firstName', e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={p1.middleName||''} onChange={e=>update('petitioner.parents.1.middleName', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of birth">
            <DateInput value={p1.dob||''} onChange={v=>update('petitioner.parents.1.dob', v)} />
          </Field>
          <Field label="City of birth">
            <input value={p1.cityBirth||''} onChange={e=>update('petitioner.parents.1.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of birth / nationality">
            <input value={p1.countryBirth||''} onChange={e=>update('petitioner.parents.1.countryBirth', e.target.value)} />
          </Field>
        </div>
        <Field label="Nationality">
          <input value={p1.nationality||''} onChange={e=>update('petitioner.parents.1.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Naturalization / Citizenship (if applicable)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Certificate / Naturalization number">
            <input value={form.petitioner?.natzNumber||''} onChange={e=>update('petitioner.natzNumber', e.target.value)} />
          </Field>
          <Field label="Place of issuance">
            <input value={form.petitioner?.natzPlace||''} onChange={e=>update('petitioner.natzPlace', e.target.value)} />
          </Field>
          <Field label="Date of issuance">
            <DateInput value={form.petitioner?.natzDate||''} onChange={v=>update('petitioner.natzDate', v)} />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Part2Identity({ form, update, add, remove }) {
  const b = form.beneficiary||{};
  const other = Array.isArray(b.otherNames) ? b.otherNames : [];
  const onAddOther = () => add('beneficiary.otherNames', () => ({ lastName:'', firstName:'', middleName:'' }));
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Identity)</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family name (last)">
          <input value={b.lastName||''} onChange={e=>update('beneficiary.lastName', e.target.value)} />
        </Field>
        <Field label="Given name (first)">
          <input value={b.firstName||''} onChange={e=>update('beneficiary.firstName', e.target.value)} />
        </Field>
        <Field label="Middle name">
          <input value={b.middleName||''} onChange={e=>update('beneficiary.middleName', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="A-Number">
          <input value={b.aNumber||''} onChange={e=>update('beneficiary.aNumber', e.target.value)} />
        </Field>
        <Field label="SSN">
          <input value={b.ssn||''} onChange={e=>update('beneficiary.ssn', e.target.value)} />
        </Field>
        <Field label="Date of birth">
          <DateInput value={b.dob||''} onChange={v=>update('beneficiary.dob', v)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="City of birth">
          <input value={b.cityBirth||''} onChange={e=>update('beneficiary.cityBirth', e.target.value)} />
        </Field>
        <Field label="Country of birth">
          <input value={b.countryBirth||''} onChange={e=>update('beneficiary.countryBirth', e.target.value)} />
        </Field>
        <Field label="Nationality">
          <input value={b.nationality||''} onChange={e=>update('beneficiary.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>
      {other.map((n, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}>
            <input value={n?.lastName||''} onChange={e=>update(`beneficiary.otherNames.${i}.lastName`, e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={n?.firstName||''} onChange={e=>update(`beneficiary.otherNames.${i}.firstName`, e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={n?.middleName||''} onChange={e=>update(`beneficiary.otherNames.${i}.middleName`, e.target.value)} />
          </Field>
          <button type="button" className="btn" onClick={()=>remove('beneficiary.otherNames', i)}>Remove</button>
        </div>
      ))}
    </section>
  );
}

function Part2Addresses({ form, update }) {
  const b = form.beneficiary||{};
  const mail = b.mailing||{};
  const phys = b.physicalAddress||{};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Addresses</h3>

      <div className="small"><strong>Mailing</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
        <Field label="In care of (c/o)">
          <input value={mail.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} />
        </Field>
        <Field label="Street number & name">
          <input value={mail.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="Unit type">
          <UnitTypeSelect value={mail.unitType||''} onChange={v=>update('beneficiary.mailing.unitType', v)} />
        </Field>
        <Field label="Unit #">
          <input value={mail.unitNum||''} onChange={e=>update('beneficiary.mailing.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={mail.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={mail.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={mail.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={mail.province||''} onChange={e=>update('beneficiary.mailing.province', e.target.value)} />
        </Field>
        <Field label="Postal">
          <input value={mail.postal||''} onChange={e=>update('beneficiary.mailing.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={mail.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} />
        </Field>
      </div>

      <div className="small"><strong>Physical</strong></div>
      <Field label="Street number & name">
        <input value={phys.street||''} onChange={e=>update('beneficiary.physicalAddress.street', e.target.value)} />
      </Field>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="Unit type">
          <UnitTypeSelect value={phys.unitType||''} onChange={v=>update('beneficiary.physicalAddress.unitType', v)} />
        </Field>
        <Field label="Unit #">
          <input value={phys.unitNum||''} onChange={e=>update('beneficiary.physicalAddress.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={phys.city||''} onChange={e=>update('beneficiary.physicalAddress.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={phys.state||''} onChange={e=>update('beneficiary.physicalAddress.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={phys.zip||''} onChange={e=>update('beneficiary.physicalAddress.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={phys.province||''} onChange={e=>update('beneficiary.physicalAddress.province', e.target.value)} />
        </Field>
        <Field label="Postal">
          <input value={phys.postal||''} onChange={e=>update('beneficiary.physicalAddress.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={phys.country||''} onChange={e=>update('beneficiary.physicalAddress.country', e.target.value)} />
        </Field>
      </div>
    </section>
  );
}

function Part2Employment({ form, update }) {
  const list = Array.isArray(form.beneficiary?.employment) ? form.beneficiary.employment : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Employment (last 5 years)</h3>
      {list.map((e, i) => {
        const ei = e || {};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <Field label="Employer name">
              <input value={ei.employer||''} onChange={ev=>update(`beneficiary.employment.${i}.employer`, ev.target.value)} />
            </Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Street">
                <input value={ei.street||''} onChange={ev=>update(`beneficiary.employment.${i}.street`, ev.target.value)} />
              </Field>
              <Field label="Unit type">
                <UnitTypeSelect value={ei.unitType||''} onChange={v=>update(`beneficiary.employment.${i}.unitType`, v)} />
              </Field>
              <Field label="Unit #">
                <input value={ei.unitNum||''} onChange={ev=>update(`beneficiary.employment.${i}.unitNum`, ev.target.value)} />
              </Field>
              <Field label="City">
                <input value={ei.city||''} onChange={ev=>update(`beneficiary.employment.${i}.city`, ev.target.value)} />
              </Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="State">
                <input value={ei.state||''} onChange={ev=>update(`beneficiary.employment.${i}.state`, ev.target.value)} />
              </Field>
              <Field label="ZIP">
                <input value={ei.zip||''} onChange={ev=>update(`beneficiary.employment.${i}.zip`, ev.target.value)} />
              </Field>
              <Field label="Province">
                <input value={ei.province||''} onChange={ev=>update(`beneficiary.employment.${i}.province`, ev.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input value={ei.postal||''} onChange={ev=>update(`beneficiary.employment.${i}.postal`, ev.target.value)} />
              </Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country">
                <input value={ei.country||''} onChange={ev=>update(`beneficiary.employment.${i}.country`, ev.target.value)} />
              </Field>
              <Field label="Occupation">
                <input value={ei.occupation||''} onChange={ev=>update(`beneficiary.employment.${i}.occupation`, ev.target.value)} />
              </Field>
              <Field label="From">
                <DateInput value={ei.from||''} onChange={v=>update(`beneficiary.employment.${i}.from`, v)} />
              </Field>
            </div>
            <Field label="To">
              <DateInput value={ei.to||''} onChange={v=>update(`beneficiary.employment.${i}.to`, v)} />
            </Field>
          </div>
        );
      })}
    </section>
  );
}

function Part2Parents({ form, update }) {
  const b0 = (form.beneficiary?.parents && form.beneficiary.parents[0]) ? form.beneficiary.parents[0] : {};
  const b1 = (form.beneficiary?.parents && form.beneficiary.parents[1]) ? form.beneficiary.parents[1] : {};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Parents</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent #1</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family">
            <input value={b0.lastName||''} onChange={e=>update('beneficiary.parents.0.lastName', e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={b0.firstName||''} onChange={e=>update('beneficiary.parents.0.firstName', e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={b0.middleName||''} onChange={e=>update('beneficiary.parents.0.middleName', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of birth">
            <DateInput value={b0.dob||''} onChange={v=>update('beneficiary.parents.0.dob', v)} />
          </Field>
          <Field label="City of birth">
            <input value={b0.cityBirth||''} onChange={e=>update('beneficiary.parents.0.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of birth / nationality">
            <input value={b0.countryBirth||''} onChange={e=>update('beneficiary.parents.0.countryBirth', e.target.value)} />
          </Field>
        </div>
        <Field label="Nationality">
          <input value={b0.nationality||''} onChange={e=>update('beneficiary.parents.0.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent #2</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family">
            <input value={b1.lastName||''} onChange={e=>update('beneficiary.parents.1.lastName', e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={b1.firstName||''} onChange={e=>update('beneficiary.parents.1.firstName', e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={b1.middleName||''} onChange={e=>update('beneficiary.parents.1.middleName', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of birth">
            <DateInput value={b1.dob||''} onChange={v=>update('beneficiary.parents.1.dob', v)} />
          </Field>
          <Field label="City of birth">
            <input value={b1.cityBirth||''} onChange={e=>update('beneficiary.parents.1.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of birth / nationality">
            <input value={b1.countryBirth||''} onChange={e=>update('beneficiary.parents.1.countryBirth', e.target.value)} />
          </Field>
        </div>
        <Field label="Nationality">
          <input value={b1.nationality||''} onChange={e=>update('beneficiary.parents.1.nationality', e.target.value)} />
        </Field>
      </div>
    </section>
  );
}

function Parts5to7({ form, update }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Parts 5–7 — Contact / Interpreter / Preparer</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Petitioner contact</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Daytime phone">
            <input value={form.petitioner?.phone||''} onChange={e=>update('petitioner.phone', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <input value={form.petitioner?.mobile||''} onChange={e=>update('petitioner.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.petitioner?.email||''} onChange={e=>update('petitioner.email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Interpreter (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Language">
            <input value={form.interpreter?.language||''} onChange={e=>update('interpreter.language', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.interpreter?.email||''} onChange={e=>update('interpreter.email', e.target.value)} />
          </Field>
          <Field label="Date of signature">
            <DateInput value={form.interpreter?.signDate||''} onChange={v=>update('interpreter.signDate', v)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name">
            <input value={form.interpreter?.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} />
          </Field>
          <Field label="Given name">
            <input value={form.interpreter?.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} />
          </Field>
          <Field label="Business/Org">
            <input value={form.interpreter?.business||''} onChange={e=>update('interpreter.business', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Phone #1">
            <input value={form.interpreter?.phone1||''} onChange={e=>update('interpreter.phone1', e.target.value)} />
          </Field>
          <Field label="Phone #2">
            <input value={form.interpreter?.phone2||''} onChange={e=>update('interpreter.phone2', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Preparer (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name">
            <input value={form.preparer?.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} />
          </Field>
          <Field label="Given name">
            <input value={form.preparer?.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} />
          </Field>
          <Field label="Business/Org">
            <input value={form.preparer?.business||''} onChange={e=>update('preparer.business', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Phone">
            <input value={form.preparer?.phone||''} onChange={e=>update('preparer.phone', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <input value={form.preparer?.mobile||''} onChange={e=>update('preparer.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.preparer?.email||''} onChange={e=>update('preparer.email', e.target.value)} />
          </Field>
        </div>
        <Field label="Date of signature">
          <DateInput value={form.preparer?.signDate||''} onChange={v=>update('preparer.signDate', v)} />
        </Field>
      </div>
    </section>
  );
}

function Part8Additional({ form, update, add, remove }) {
  const otherPairs = useMemo(() => {
    const o = form.other || {};
    return Object.keys(o).map(k => ({ name:k, value:o[k] }));
  }, [form.other]);

  const addOverride = () => {
    const k = `CustomField_${Date.now()}`;
    update(`other.${k}`, '');
  };

  const removeOverride = (name) => {
    update(`other.${name}`, undefined);
  };

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 8 — Additional Information</h3>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <Field label="Line 3d — Additional info">
          <textarea rows={3} value={form.part8?.line3d||''} onChange={e=>update('part8.line3d', e.target.value)} />
        </Field>
        <Field label="Line 4d — Additional info">
          <textarea rows={3} value={form.part8?.line4d||''} onChange={e=>update('part8.line4d', e.target.value)} />
        </Field>
        <Field label="Line 5d — Additional info">
          <textarea rows={3} value={form.part8?.line5d||''} onChange={e=>update('part8.line5d', e.target.value)} />
        </Field>
        <Field label="Line 6d — Additional info">
          <textarea rows={3} value={form.part8?.line6d||''} onChange={e=>update('part8.line6d', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <strong>Other PDF Field Overrides (advanced)</strong>
          <button type="button" className="btn" onClick={addOverride}>+ Add override</button>
        </div>
        {otherPairs.length === 0 && <div className="small">No overrides yet.</div>}
        {otherPairs.map(({name,value}) => (
          <div key={name} style={{display:'grid', gridTemplateColumns:'2fr 3fr auto', gap:10, alignItems:'end'}}>
            <Field label="PDF Field name (exact)">
              <input value={name} readOnly />
            </Field>
            <Field label="Value">
              <input value={value||''} onChange={e=>update(`other.${name}`, e.target.value)} />
            </Field>
            <button type="button" className="btn" onClick={()=>removeOverride(name)}>Remove</button>
          </div>
        ))}
        <div className="small">Tip: extras beyond two names/addresses auto-summarize into Part 8, Line 3d when you Save.</div>
      </div>
    </section>
  );
}

/* ----------------------------------------
   Field wrapper
---------------------------------------- */
function Field({ label, children }) {
  return (
    <label className="small" style={{display:'grid', gap:6, minWidth:0}}>
      <span>{label}</span>
      <div style={{display:'grid', minWidth:0}}>
        {children}
      </div>
    </label>
  );
}

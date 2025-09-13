// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

const SECTIONS = [
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

const EMPTY = {
  petitioner: {
    aNumber: '', uscisOnlineAccount: '', ssn: '',
    lastName: '', firstName: '', middleName: '',
    otherNames: [ { lastName:'', firstName:'', middleName:'' } ],
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
    otherNames: [ { lastName:'', firstName:'', middleName:'' } ],
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

// ---------- helpers ----------
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
      // create object or array slot
      cur[p] = /^\d+$/.test(parts[parts.indexOf(p)+1]) ? [] : {};
    }
    cur = cur[p];
  }
  cur[last] = value;
}
function ensureArrayLen(obj, path, len, factory) {
  const arr = getPath(obj, path);
  if (!Array.isArray(arr)) {
    setPath(obj, path, []);
  }
  const a = getPath(obj, path);
  while (a.length < len) a.push(factory());
}

function fmtDate(s) {
  if (!s) return '';
  const v = String(s).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) return v;
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    const yy = String(d.getFullYear());
    return `${mm}/${dd}/${yy}`;
  }
  return v;
}

// ---------- UI ----------
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
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch (e) {}
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

  async function save() {
    setBusy(true);
    try {
      // normalize a few dates before save
      const normalized = structuredClone(form);
      // examples
      setPath(normalized, 'petitioner.natzDate', fmtDate(form.petitioner.natzDate));
      getPath(normalized, 'physicalAddresses')?.forEach((a, i) => {
        if (!a) return;
        setPath(normalized, `physicalAddresses.${i}.from`, fmtDate(a.from));
        setPath(normalized, `physicalAddresses.${i}.to`, fmtDate(a.to));
      });
      ['employment.0','employment.1','beneficiary.employment.0','beneficiary.employment.1'].forEach(p => {
        const e = getPath(normalized, p);
        if (e) {
          setPath(normalized, `${p}.from`, fmtDate(e.from));
          setPath(normalized, `${p}.to`, fmtDate(e.to));
        }
      });

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

  // auto-copy mailing → physical[0] when toggled
  function copyMailingToPhysical0() {
    const m = form.mailing || {};
    const copy = {
      street:m.street, unitType:m.unitType, unitNum:m.unitNum, city:m.city, state:m.state,
      zip:m.zip, province:m.province, postal:m.postal, country:m.country, from:'', to:'',
    };
    setForm(prev => {
      const next = structuredClone(prev);
      ensureArrayLen(next, 'physicalAddresses', 1, () => ({street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',from:'',to:''}));
      next.physicalAddresses[0] = copy;
      return next;
    });
  }

  // ---- render helpers ----
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
    <div className="card" style={{display:'grid', gap:12}}>
      {Tabs}

      {step===0 && <Part1Identity form={form} update={update} add={add} remove={remove} />}
      {step===1 && <Part1Addresses form={form} update={update} add={add} remove={remove} onCopyMailing={copyMailingToPhysical0} />}
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
            Use <a href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">PDF debug overlay</a> to see filled fields & missing.
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
    </div>
  );
}

// ---------- Sections ----------

function Part1Identity({ form, update, add, remove }) {
  const onAddOther = () => add('petitioner.otherNames', () => ({ lastName:'', firstName:'', middleName:'' }));
  return (
    <section style={{display:'grid', gap:10}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Identity)</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
        <Field label="A-Number">
          <input value={form.petitioner.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} />
        </Field>
        <Field label="USCIS Online Account #">
          <input value={form.petitioner.uscisOnlineAccount||''} onChange={e=>update('petitioner.uscisOnlineAccount', e.target.value)} />
        </Field>
        <Field label="SSN">
          <input value={form.petitioner.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
        <Field label="Family name (last)">
          <input value={form.petitioner.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} />
        </Field>
        <Field label="Given name (first)">
          <input value={form.petitioner.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} />
        </Field>
        <Field label="Middle name">
          <input value={form.petitioner.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} />
        </Field>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>
      {(form.petitioner.otherNames||[]).map((n, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}>
            <input value={n.lastName||''} onChange={e=>update(`petitioner.otherNames.${i}.lastName`, e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={n.firstName||''} onChange={e=>update(`petitioner.otherNames.${i}.firstName`, e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={n.middleName||''} onChange={e=>update(`petitioner.otherNames.${i}.middleName`, e.target.value)} />
          </Field>
          <button type="button" className="btn" onClick={()=>remove('petitioner.otherNames', i)}>Remove</button>
        </div>
      ))}
    </section>
  );
}

function Part1Addresses({ form, update, add, remove, onCopyMailing }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Addresses</h3>

      <div className="small"><strong>Mailing Address (Line 8)</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
        <Field label="In care of (c/o)">
          <input value={form.mailing.inCareOf||''} onChange={e=>update('mailing.inCareOf', e.target.value)} />
        </Field>
        <Field label="Street number & name">
          <input value={form.mailing.street||''} onChange={e=>update('mailing.street', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
        <Field label="Unit type">
          <input value={form.mailing.unitType||''} onChange={e=>update('mailing.unitType', e.target.value)} />
        </Field>
        <Field label="Unit #">
          <input value={form.mailing.unitNum||''} onChange={e=>update('mailing.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={form.mailing.city||''} onChange={e=>update('mailing.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={form.mailing.state||''} onChange={e=>update('mailing.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={form.mailing.zip||''} onChange={e=>update('mailing.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={form.mailing.province||''} onChange={e=>update('mailing.province', e.target.value)} />
        </Field>
        <Field label="Postal Code">
          <input value={form.mailing.postal||''} onChange={e=>update('mailing.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={form.mailing.country||''} onChange={e=>update('mailing.country', e.target.value)} />
        </Field>
      </div>

      <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
        <input type="checkbox" checked={!!form.mailing.sameAsPhysical} onChange={e=>{
          update('mailing.sameAsPhysical', e.target.checked);
          if (e.target.checked) onCopyMailing();
        }} />
        Mailing address is the same as current physical address
      </label>

      <div className="small" style={{marginTop:8}}><strong>Physical Address History (Lines 9–10 & 14)</strong></div>
      {(form.physicalAddresses||[]).map((a, i) => (
        <div key={i} className="card" style={{display:'grid', gap:10}}>
          <div className="small"><strong>Address #{i+1}</strong></div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
            <Field label="Street number & name">
              <input value={a.street||''} onChange={e=>update(`physicalAddresses.${i}.street`, e.target.value)} />
            </Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Unit type">
                <input value={a.unitType||''} onChange={e=>update(`physicalAddresses.${i}.unitType`, e.target.value)} />
              </Field>
              <Field label="Unit #">
                <input value={a.unitNum||''} onChange={e=>update(`physicalAddresses.${i}.unitNum`, e.target.value)} />
              </Field>
              <Field label="City">
                <input value={a.city||''} onChange={e=>update(`physicalAddresses.${i}.city`, e.target.value)} />
              </Field>
              <Field label="State">
                <input value={a.state||''} onChange={e=>update(`physicalAddresses.${i}.state`, e.target.value)} />
              </Field>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            <Field label="ZIP">
              <input value={a.zip||''} onChange={e=>update(`physicalAddresses.${i}.zip`, e.target.value)} />
            </Field>
            <Field label="Province">
              <input value={a.province||''} onChange={e=>update(`physicalAddresses.${i}.province`, e.target.value)} />
            </Field>
            <Field label="Postal Code">
              <input value={a.postal||''} onChange={e=>update(`physicalAddresses.${i}.postal`, e.target.value)} />
            </Field>
            <Field label="Country">
              <input value={a.country||''} onChange={e=>update(`physicalAddresses.${i}.country`, e.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <Field label="From (MM/DD/YYYY)">
              <input value={a.from||''} onChange={e=>update(`physicalAddresses.${i}.from`, e.target.value)} />
            </Field>
            <Field label="To (MM/DD/YYYY)">
              <input value={a.to||''} onChange={e=>update(`physicalAddresses.${i}.to`, e.target.value)} />
            </Field>
          </div>
          {i>1 ? <button type="button" className="btn" onClick={()=>remove('physicalAddresses', i)}>Remove</button> : null}
        </div>
      ))}
      <div>
        <button type="button" className="btn" onClick={()=>add('physicalAddresses', () => ({street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',from:'',to:''}))}>+ Add address</button>
      </div>
    </section>
  );
}

function Part1Employment({ form, update, add, remove }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Employment (last 5 years)</h3>
      {(form.employment||[]).map((e, i) => (
        <div key={i} className="card" style={{display:'grid', gap:10}}>
          <div className="small"><strong>Employer #{i+1}</strong></div>
          <Field label="Employer name">
            <input value={e.employer||''} onChange={ev=>update(`employment.${i}.employer`, ev.target.value)} />
          </Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
            <Field label="Street">
              <input value={e.street||''} onChange={ev=>update(`employment.${i}.street`, ev.target.value)} />
            </Field>
            <Field label="Unit type">
              <input value={e.unitType||''} onChange={ev=>update(`employment.${i}.unitType`, ev.target.value)} />
            </Field>
            <Field label="Unit #">
              <input value={e.unitNum||''} onChange={ev=>update(`employment.${i}.unitNum`, ev.target.value)} />
            </Field>
            <Field label="City">
              <input value={e.city||''} onChange={ev=>update(`employment.${i}.city`, ev.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            <Field label="State">
              <input value={e.state||''} onChange={ev=>update(`employment.${i}.state`, ev.target.value)} />
            </Field>
            <Field label="ZIP">
              <input value={e.zip||''} onChange={ev=>update(`employment.${i}.zip`, ev.target.value)} />
            </Field>
            <Field label="Province">
              <input value={e.province||''} onChange={ev=>update(`employment.${i}.province`, ev.target.value)} />
            </Field>
            <Field label="Postal Code">
              <input value={e.postal||''} onChange={ev=>update(`employment.${i}.postal`, ev.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Country">
              <input value={e.country||''} onChange={ev=>update(`employment.${i}.country`, ev.target.value)} />
            </Field>
            <Field label="Occupation">
              <input value={e.occupation||''} onChange={ev=>update(`employment.${i}.occupation`, ev.target.value)} />
            </Field>
            <Field label="From (MM/DD/YYYY)">
              <input value={e.from||''} onChange={ev=>update(`employment.${i}.from`, ev.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:10}}>
            <Field label="To (MM/DD/YYYY)">
              <input value={e.to||''} onChange={ev=>update(`employment.${i}.to`, ev.target.value)} />
            </Field>
          </div>
          {i>1 ? <button type="button" className="btn" onClick={()=>remove('employment', i)}>Remove</button> : null}
        </div>
      ))}
      <div>
        <button type="button" className="btn" onClick={()=>add('employment', () => ({ employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' }))}>+ Add employer</button>
      </div>
    </section>
  );
}

function Part1ParentsNatz({ form, update }) {
  const P = ({ idx }) => (
    <div className="card" style={{display:'grid', gap:10}}>
      <div className="small"><strong>Parent #{idx+1}</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family">
          <input value={form.petitioner.parents[idx].lastName||''} onChange={e=>update(`petitioner.parents.${idx}.lastName`, e.target.value)} />
        </Field>
        <Field label="Given">
          <input value={form.petitioner.parents[idx].firstName||''} onChange={e=>update(`petitioner.parents.${idx}.firstName`, e.target.value)} />
        </Field>
        <Field label="Middle">
          <input value={form.petitioner.parents[idx].middleName||''} onChange={e=>update(`petitioner.parents.${idx}.middleName`, e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Date of birth (MM/DD/YYYY)">
          <input value={form.petitioner.parents[idx].dob||''} onChange={e=>update(`petitioner.parents.${idx}.dob`, e.target.value)} />
        </Field>
        <Field label="City of birth">
          <input value={form.petitioner.parents[idx].cityBirth||''} onChange={e=>update(`petitioner.parents.${idx}.cityBirth`, e.target.value)} />
        </Field>
        <Field label="Country of birth / nationality">
          <input value={form.petitioner.parents[idx].countryBirth||''} onChange={e=>update(`petitioner.parents.${idx}.countryBirth`, e.target.value)} />
        </Field>
      </div>
      <Field label="Nationality">
        <input value={form.petitioner.parents[idx].nationality||''} onChange={e=>update(`petitioner.parents.${idx}.nationality`, e.target.value)} />
      </Field>
    </div>
  );

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Parents & Naturalization</h3>
      <P idx={0} />
      <P idx={1} />

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Naturalization / Citizenship (if applicable)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Certificate / Naturalization number">
            <input value={form.petitioner.natzNumber||''} onChange={e=>update('petitioner.natzNumber', e.target.value)} />
          </Field>
          <Field label="Place of issuance">
            <input value={form.petitioner.natzPlace||''} onChange={e=>update('petitioner.natzPlace', e.target.value)} />
          </Field>
          <Field label="Date of issuance (MM/DD/YYYY)">
            <input value={form.petitioner.natzDate||''} onChange={e=>update('petitioner.natzDate', e.target.value)} />
          </Field>
        </div>
      </div>
    </section>
  );
}

function Part2Identity({ form, update, add, remove }) {
  const onAddOther = () => add('beneficiary.otherNames', () => ({ lastName:'', firstName:'', middleName:'' }));
  const b = form.beneficiary;
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
        <Field label="Date of birth (MM/DD/YYYY)">
          <input value={b.dob||''} onChange={e=>update('beneficiary.dob', e.target.value)} />
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
      {(b.otherNames||[]).map((n, i) => (
        <div key={i} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}>
            <input value={n.lastName||''} onChange={e=>update(`beneficiary.otherNames.${i}.lastName`, e.target.value)} />
          </Field>
          <Field label="Given">
            <input value={n.firstName||''} onChange={e=>update(`beneficiary.otherNames.${i}.firstName`, e.target.value)} />
          </Field>
          <Field label="Middle">
            <input value={n.middleName||''} onChange={e=>update(`beneficiary.otherNames.${i}.middleName`, e.target.value)} />
          </Field>
          <button type="button" className="btn" onClick={()=>remove('beneficiary.otherNames', i)}>Remove</button>
        </div>
      ))}
    </section>
  );
}

function Part2Addresses({ form, update }) {
  const b = form.beneficiary;
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Addresses</h3>

      <div className="small"><strong>Mailing</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
        <Field label="In care of (c/o)">
          <input value={b.mailing.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} />
        </Field>
        <Field label="Street number & name">
          <input value={b.mailing.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="Unit type">
          <input value={b.mailing.unitType||''} onChange={e=>update('beneficiary.mailing.unitType', e.target.value)} />
        </Field>
        <Field label="Unit #">
          <input value={b.mailing.unitNum||''} onChange={e=>update('beneficiary.mailing.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={b.mailing.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={b.mailing.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={b.mailing.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={b.mailing.province||''} onChange={e=>update('beneficiary.mailing.province', e.target.value)} />
        </Field>
        <Field label="Postal">
          <input value={b.mailing.postal||''} onChange={e=>update('beneficiary.mailing.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={b.mailing.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} />
        </Field>
      </div>

      <div className="small"><strong>Physical</strong></div>
      <Field label="Street number & name">
        <input value={b.physicalAddress.street||''} onChange={e=>update('beneficiary.physicalAddress.street', e.target.value)} />
      </Field>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="Unit type">
          <input value={b.physicalAddress.unitType||''} onChange={e=>update('beneficiary.physicalAddress.unitType', e.target.value)} />
        </Field>
        <Field label="Unit #">
          <input value={b.physicalAddress.unitNum||''} onChange={e=>update('beneficiary.physicalAddress.unitNum', e.target.value)} />
        </Field>
        <Field label="City">
          <input value={b.physicalAddress.city||''} onChange={e=>update('beneficiary.physicalAddress.city', e.target.value)} />
        </Field>
        <Field label="State">
          <input value={b.physicalAddress.state||''} onChange={e=>update('beneficiary.physicalAddress.state', e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP">
          <input value={b.physicalAddress.zip||''} onChange={e=>update('beneficiary.physicalAddress.zip', e.target.value)} />
        </Field>
        <Field label="Province">
          <input value={b.physicalAddress.province||''} onChange={e=>update('beneficiary.physicalAddress.province', e.target.value)} />
        </Field>
        <Field label="Postal">
          <input value={b.physicalAddress.postal||''} onChange={e=>update('beneficiary.physicalAddress.postal', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={b.physicalAddress.country||''} onChange={e=>update('beneficiary.physicalAddress.country', e.target.value)} />
        </Field>
      </div>
    </section>
  );
}

function Part2Employment({ form, update }) {
  const list = form.beneficiary.employment || [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Employment (last 5 years)</h3>
      {list.map((e, i) => (
        <div key={i} className="card" style={{display:'grid', gap:10}}>
          <div className="small"><strong>Employer #{i+1}</strong></div>
          <Field label="Employer name">
            <input value={e.employer||''} onChange={ev=>update(`beneficiary.employment.${i}.employer`, ev.target.value)} />
          </Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
            <Field label="Street">
              <input value={e.street||''} onChange={ev=>update(`beneficiary.employment.${i}.street`, ev.target.value)} />
            </Field>
            <Field label="Unit type">
              <input value={e.unitType||''} onChange={ev=>update(`beneficiary.employment.${i}.unitType`, ev.target.value)} />
            </Field>
            <Field label="Unit #">
              <input value={e.unitNum||''} onChange={ev=>update(`beneficiary.employment.${i}.unitNum`, ev.target.value)} />
            </Field>
            <Field label="City">
              <input value={e.city||''} onChange={ev=>update(`beneficiary.employment.${i}.city`, ev.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
            <Field label="State">
              <input value={e.state||''} onChange={ev=>update(`beneficiary.employment.${i}.state`, ev.target.value)} />
            </Field>
            <Field label="ZIP">
              <input value={e.zip||''} onChange={ev=>update(`beneficiary.employment.${i}.zip`, ev.target.value)} />
            </Field>
            <Field label="Province">
              <input value={e.province||''} onChange={ev=>update(`beneficiary.employment.${i}.province`, ev.target.value)} />
            </Field>
            <Field label="Postal Code">
              <input value={e.postal||''} onChange={ev=>update(`beneficiary.employment.${i}.postal`, ev.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Country">
              <input value={e.country||''} onChange={ev=>update(`beneficiary.employment.${i}.country`, ev.target.value)} />
            </Field>
            <Field label="Occupation">
              <input value={e.occupation||''} onChange={ev=>update(`beneficiary.employment.${i}.occupation`, ev.target.value)} />
            </Field>
            <Field label="From (MM/DD/YYYY)">
              <input value={e.from||''} onChange={ev=>update(`beneficiary.employment.${i}.from`, ev.target.value)} />
            </Field>
          </div>
          <Field label="To (MM/DD/YYYY)">
            <input value={e.to||''} onChange={ev=>update(`beneficiary.employment.${i}.to`, ev.target.value)} />
          </Field>
        </div>
      ))}
    </section>
  );
}

function Part2Parents({ form, update }) {
  const b = form.beneficiary;
  const P = ({ idx }) => (
    <div className="card" style={{display:'grid', gap:10}}>
      <div className="small"><strong>Parent #{idx+1}</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family">
          <input value={b.parents[idx].lastName||''} onChange={e=>update(`beneficiary.parents.${idx}.lastName`, e.target.value)} />
        </Field>
        <Field label="Given">
          <input value={b.parents[idx].firstName||''} onChange={e=>update(`beneficiary.parents.${idx}.firstName`, e.target.value)} />
        </Field>
        <Field label="Middle">
          <input value={b.parents[idx].middleName||''} onChange={e=>update(`beneficiary.parents.${idx}.middleName`, e.target.value)} />
        </Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Date of birth (MM/DD/YYYY)">
          <input value={b.parents[idx].dob||''} onChange={e=>update(`beneficiary.parents.${idx}.dob`, e.target.value)} />
        </Field>
        <Field label="City of birth">
          <input value={b.parents[idx].cityBirth||''} onChange={e=>update(`beneficiary.parents.${idx}.cityBirth`, e.target.value)} />
        </Field>
        <Field label="Country of birth / nationality">
          <input value={b.parents[idx].countryBirth||''} onChange={e=>update(`beneficiary.parents.${idx}.countryBirth`, e.target.value)} />
        </Field>
      </div>
      <Field label="Nationality">
        <input value={b.parents[idx].nationality||''} onChange={e=>update(`beneficiary.parents.${idx}.nationality`, e.target.value)} />
      </Field>
    </div>
  );
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Parents</h3>
      <P idx={0} />
      <P idx={1} />
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
            <input value={form.petitioner.phone||''} onChange={e=>update('petitioner.phone', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <input value={form.petitioner.mobile||''} onChange={e=>update('petitioner.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.petitioner.email||''} onChange={e=>update('petitioner.email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Interpreter (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Language">
            <input value={form.interpreter.language||''} onChange={e=>update('interpreter.language', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.interpreter.email||''} onChange={e=>update('interpreter.email', e.target.value)} />
          </Field>
          <Field label="Date of signature (MM/DD/YYYY)">
            <input value={form.interpreter.signDate||''} onChange={e=>update('interpreter.signDate', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name">
            <input value={form.interpreter.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} />
          </Field>
          <Field label="Given name">
            <input value={form.interpreter.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} />
          </Field>
          <Field label="Business/Org">
            <input value={form.interpreter.business||''} onChange={e=>update('interpreter.business', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Phone #1">
            <input value={form.interpreter.phone1||''} onChange={e=>update('interpreter.phone1', e.target.value)} />
          </Field>
          <Field label="Phone #2">
            <input value={form.interpreter.phone2||''} onChange={e=>update('interpreter.phone2', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Preparer (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name">
            <input value={form.preparer.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} />
          </Field>
          <Field label="Given name">
            <input value={form.preparer.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} />
          </Field>
          <Field label="Business/Org">
            <input value={form.preparer.business||''} onChange={e=>update('preparer.business', e.target.value)} />
          </Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Phone">
            <input value={form.preparer.phone||''} onChange={e=>update('preparer.phone', e.target.value)} />
          </Field>
          <Field label="Mobile">
            <input value={form.preparer.mobile||''} onChange={e=>update('preparer.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={form.preparer.email||''} onChange={e=>update('preparer.email', e.target.value)} />
          </Field>
        </div>
        <Field label="Date of signature (MM/DD/YYYY)">
          <input value={form.preparer.signDate||''} onChange={e=>update('preparer.signDate', e.target.value)} />
        </Field>
      </div>
    </section>
  );
}

function Part8Additional({ form, update, add, remove }) {
  // little helper UI to add arbitrary PDF field overrides
  const otherPairs = useMemo(() => {
    const o = form.other || {};
    return Object.keys(o).map(k => ({ name:k, value:o[k] }));
  }, [form.other]);

  const addOverride = () => {
    // create a new empty key to edit
    const k = `CustomField_${Date.now()}`;
    update(`other.${k}`, '');
  };

  const removeOverride = (name) => {
    // remove key by setting undefined (will be dropped on save/merge server-side)
    update(`other.${name}`, undefined);
  };

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 8 — Additional Information</h3>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        <Field label="Line 3d — Additional info">
          <textarea rows={3} value={form.part8.line3d||''} onChange={e=>update('part8.line3d', e.target.value)} />
        </Field>
        <Field label="Line 4d — Additional info">
          <textarea rows={3} value={form.part8.line4d||''} onChange={e=>update('part8.line4d', e.target.value)} />
        </Field>
        <Field label="Line 5d — Additional info">
          <textarea rows={3} value={form.part8.line5d||''} onChange={e=>update('part8.line5d', e.target.value)} />
        </Field>
        <Field label="Line 6d — Additional info">
          <textarea rows={3} value={form.part8.line6d||''} onChange={e=>update('part8.line6d', e.target.value)} />
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
        <div className="small">Tip: any name you enter here is passed directly to the AcroForm field of the same name in <code>lib/i129f-mapping</code>’s fallback.</div>
      </div>
    </section>
  );
}

// Reusable field wrapper w/ minWidth fix so inputs don’t collapse
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

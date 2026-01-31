// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';

/* ---------- Sections ---------- */
const SECTIONS = [
  { key: 'p1_ident', label: 'Part 1 — Identity' },
  { key: 'p1_addr', label: 'Part 1 — Addresses' },
  { key: 'p1_emp', label: 'Part 1 — Employment' },
  { key: 'p1_par', label: 'Part 1 — Parents / Natz' },
  { key: 'p2_ident', label: 'Part 2 — Beneficiary' },
  { key: 'p2_addr', label: 'Part 2 — Beneficiary Addr' },
  { key: 'p2_emp', label: 'Part 2 — Beneficiary Emp' },
  { key: 'p2_par', label: 'Part 2 — Beneficiary Parents' },
  { key: 'p5_7', label: 'Parts 5–7 — Contact/Interp/Prep' },
  { key: 'p8', label: 'Part 8 — Additional' },
  { key: 'review', label: 'Review / Download' },
];

/* ---------- Empty shape ---------- */
const EMPTY = {
  petitioner: {
    aNumber: '',
    uscisOnlineAccount: '',
    ssn: '',
    classification: 'k1',
    filedI130: '',
    lastName: '',
    firstName: '',
    middleName: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],
    dob: '',
    cityBirth: '',
    countryBirth: '',
    sex: '',
    mailing: {
      inCareOf: '',
      street: '',
      unitType: '',
      unitNumber: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      sameAsPhysical: false,
    },
    physicalAddresses: [
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
    ],
    employment: [
      { employer: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', occupation: '', from: '', to: '' },
      { employer: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', occupation: '', from: '', to: '' },
    ],
    parents: [
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '', sex: '', alive: 'yes', deathDate: '' },
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '', sex: '', alive: 'yes', deathDate: '' },
    ],
    citizenship: { how: 'birth', natzCertificate: '', natzPlace: '', natzDate: '' },
  },

  beneficiary: {
    aNumber: '',
    ssn: '',
    lastName: '',
    firstName: '',
    middleName: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],
    dob: '',
    cityBirth: '',
    countryBirth: '',
    nationality: '',
    ethnicityHispanic: '',
    race: '',
    inUS: '',
    i94: '',
    classOfAdmission: '',
    arrivalDate: '',
    statusExpires: '',
    passportNumber: '',
    travelDocNumber: '',
    passportCountry: '',
    passportExpiration: '',
    mailing: { inCareOf: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '' },
    physicalAddresses: [
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
    ],
    employment: [
      { employer: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', occupation: '', from: '', to: '' },
      { employer: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', occupation: '', from: '', to: '' },
    ],
    parents: [
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '' },
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '' },
    ],
  },

  contact: {
    daytimePhone: '',
    mobile: '',
    email: '',
  },

  interpreter: {
    lastName: '',
    firstName: '',
    business: '',
    phone: '',
    email: '',
    signDate: '',
  },

  preparer: {
    isAttorney: '',
    lastName: '',
    firstName: '',
    business: '',
    phone: '',
    email: '',
    signDate: '',
  },

  additionalInfo: '',
};

function deepClone(obj) {
  return structuredClone(obj);
}

/* ---------- Utils ---------- */
function setPath(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : undefined), obj);
}

function normalizeUs(d) {
  if (!d) return '';
  // Accept yyyy-mm-dd or mm/dd/yyyy and normalize to MM/DD/YYYY
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split('-');
    return `${m}/${day}/${y}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  return s;
}

/* ---------- Context for add/remove helpers ---------- */
const WizardCtx = createContext(null);
function useWizard() {
  return useContext(WizardCtx);
}

/* ---------- Main Wizard ---------- */
export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => deepClone(EMPTY));
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { type: 'ok'|'err', text: string }

  const mounted = useRef(false);

  // Load previously saved form (if your /api/i129f/data endpoint returns it)
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    (async () => {
      try {
        const res = await fetch('/api/i129f/data', { cache: 'no-store' });
        const j = await res.json();
        if (j?.ok && j?.data && typeof j.data === 'object') {
          const merged = deepClone(EMPTY);

          // merge shallowly per top-level object to keep shape stable
          Object.assign(merged, j.data);
          merged.petitioner  = { ...EMPTY.petitioner,  ...(j.data.petitioner || {}) };
          merged.beneficiary = { ...EMPTY.beneficiary, ...(j.data.beneficiary || {}) };
          merged.contact     = { ...EMPTY.contact,     ...(j.data.contact || {}) };
          merged.interpreter = { ...EMPTY.interpreter, ...(j.data.interpreter || {}) };
          merged.preparer    = { ...EMPTY.preparer,    ...(j.data.preparer || {}) };

          // merge arrays carefully
          merged.petitioner.otherNames = Array.isArray(j.data?.petitioner?.otherNames)
            ? j.data.petitioner.otherNames
            : deepClone(EMPTY.petitioner.otherNames);

          merged.petitioner.physicalAddresses = Array.isArray(j.data?.petitioner?.physicalAddresses)
            ? j.data.petitioner.physicalAddresses
            : deepClone(EMPTY.petitioner.physicalAddresses);

          merged.petitioner.employment = Array.isArray(j.data?.petitioner?.employment)
            ? j.data.petitioner.employment
            : deepClone(EMPTY.petitioner.employment);

          merged.petitioner.parents = Array.isArray(j.data?.petitioner?.parents)
            ? j.data.petitioner.parents
            : deepClone(EMPTY.petitioner.parents);

          merged.beneficiary.otherNames = Array.isArray(j.data?.beneficiary?.otherNames)
            ? j.data.beneficiary.otherNames
            : deepClone(EMPTY.beneficiary.otherNames);

          merged.beneficiary.physicalAddresses = Array.isArray(j.data?.beneficiary?.physicalAddresses)
            ? j.data.beneficiary.physicalAddresses
            : deepClone(EMPTY.beneficiary.physicalAddresses);

          merged.beneficiary.employment = Array.isArray(j.data?.beneficiary?.employment)
            ? j.data.beneficiary.employment
            : deepClone(EMPTY.beneficiary.employment);

          merged.beneficiary.parents = Array.isArray(j.data?.beneficiary?.parents)
            ? j.data.beneficiary.parents
            : deepClone(EMPTY.beneficiary.parents);

          setForm(merged);
        }
      } catch (e) {
        console.warn('No saved data yet', e);
      }
    })();
  }, []);

  function update(path, value) {
    setForm((prev) => {
      const next = deepClone(prev);
      setPath(next, path, value);
      return next;
    });
  }

  function add(path, makeItem) {
    setForm((prev) => {
      const next = deepClone(prev);
      const arr = getPath(next, path);
      if (!Array.isArray(arr)) setPath(next, path, []);
      const arr2 = getPath(next, path);
      arr2.push(makeItem());
      return next;
    });
  }

  function remove(path, idx) {
    setForm((prev) => {
      const next = deepClone(prev);
      const arr = getPath(next, path);
      if (Array.isArray(arr)) arr.splice(idx, 1);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setSaveMsg(null);
    try {
      const normalized = deepClone(form);

      // Normalize all date-like values to MM/DD/YYYY if they look like YYYY-MM-DD
      if (normalized.petitioner?.dob) setPath(normalized, 'petitioner.dob', normalizeUs(normalized.petitioner.dob));
      if (normalized.beneficiary?.dob) setPath(normalized, 'beneficiary.dob', normalizeUs(normalized.beneficiary.dob));
      if (normalized.beneficiary?.arrivalDate) setPath(normalized, 'beneficiary.arrivalDate', normalizeUs(normalized.beneficiary.arrivalDate));
      if (normalized.beneficiary?.statusExpires) setPath(normalized, 'beneficiary.statusExpires', normalizeUs(normalized.beneficiary.statusExpires));
      if (normalized.beneficiary?.passportExpiration) setPath(normalized, 'beneficiary.passportExpiration', normalizeUs(normalized.beneficiary.passportExpiration));
      if (normalized.interpreter?.signDate) setPath(normalized, 'interpreter.signDate', normalizeUs(normalized.interpreter.signDate));
      if (normalized.preparer?.signDate) setPath(normalized, 'preparer.signDate', normalizeUs(normalized.preparer.signDate));

      (normalized.petitioner?.parents || []).forEach((p,i) => {
        if (p?.dob) setPath(normalized, `petitioner.parents.${i}.dob`, normalizeUs(p.dob));
        if (p?.deathDate) setPath(normalized, `petitioner.parents.${i}.deathDate`, normalizeUs(p.deathDate));
      });
      (normalized.beneficiary?.parents || []).forEach((p,i) => {
        if (p?.dob) setPath(normalized, `beneficiary.parents.${i}.dob`, normalizeUs(p.dob));
      });
      (normalized.petitioner?.physicalAddresses || []).forEach((a,i)=>{ if(a?.from) setPath(normalized,`petitioner.physicalAddresses.${i}.from`,normalizeUs(a.from)); if(a?.to) setPath(normalized,`petitioner.physicalAddresses.${i}.to`,normalizeUs(a.to)); });
      (normalized.beneficiary?.physicalAddresses || []).forEach((a,i)=>{ if(a?.from) setPath(normalized,`beneficiary.physicalAddresses.${i}.from`,normalizeUs(a.from)); if(a?.to) setPath(normalized,`beneficiary.physicalAddresses.${i}.to`,normalizeUs(a.to)); });
      (normalized.petitioner?.employment || []).forEach((a,i)=>{ if(a?.from) setPath(normalized,`petitioner.employment.${i}.from`,normalizeUs(a.from)); if(a?.to) setPath(normalized,`petitioner.employment.${i}.to`,normalizeUs(a.to)); });
      (normalized.beneficiary?.employment || []).forEach((a,i)=>{ if(a?.from) setPath(normalized,`beneficiary.employment.${i}.from`,normalizeUs(a.from)); if(a?.to) setPath(normalized,`beneficiary.employment.${i}.to`,normalizeUs(a.to)); });

      const res = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ data: normalized }),
      });
      const j = await res.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');

      setSaveMsg({ type: 'ok', text: `Saved on ${new Date().toLocaleString()}` });
    } catch(e){
      setSaveMsg({ type: 'err', text: 'Save failed. Make sure you are logged in.' });
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  const ctxValue = useMemo(() => ({ form, update, add, remove }), [form]);

  const Tabs = (
    <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
      {SECTIONS.map((s, i) => (
        <button
          key={s.key}
          type="button"
          className={i === step ? 'btn primary' : 'btn'}
          onClick={() => setStep(i)}
        >
          {i+1}. {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <WizardCtx.Provider value={ctxValue}>
      <div className="card" style={{display:'grid', gap:14}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
          <div>
            <h2 style={{margin:'0 0 4px'}}>I-129F Wizard</h2>
            <div className="small">Complete each section, then Save. Download the filled PDF on the Review tab.</div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button type="button" className="btn" onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {Tabs}

        {saveMsg && (
          <div
            role="status"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid ' + (saveMsg.type === 'ok' ? '#bbf7d0' : '#fecaca'),
              background: saveMsg.type === 'ok' ? '#f0fdf4' : '#fef2f2',
              color: saveMsg.type === 'ok' ? '#166534' : '#991b1b'
            }}
          >
            <strong style={{ marginRight: 8 }}>{saveMsg.type === 'ok' ? 'Saved' : 'Error'}:</strong>
            {saveMsg.text}
          </div>
        )}

        {step===0 && <Part1Identity form={form} update={update} add={add} remove={remove} />}
        {step===1 && <Part1Addresses form={form} update={update} add={add} remove={remove} />}
        {step===2 && <Part1Employment form={form} update={update} />}
        {step===3 && <Part1ParentsNatz form={form} update={update} />}
        {step===4 && <Part2Identity form={form} update={update} add={add} remove={remove} />}
        {step===5 && <Part2Addresses form={form} update={update} />}
        {step===6 && <Part2Employment form={form} update={update} />}
        {step===7 && <Part2Parents form={form} update={update} />}
        {step===8 && <Parts5to7 form={form} update={update} />}
        {step===9 && <Part8Additional form={form} update={update} />}
        {step===10 && <Review form={form} onSave={save} busy={busy} />}
      </div>
    </WizardCtx.Provider>
  );
}

/* ---------- UI Bits ---------- */
function Field({ label, children }) {
  return (
    <label className="field" style={{display:'grid', gap:6}}>
      <div className="small"><strong>{label}</strong></div>
      {children}
    </label>
  );
}

function DateInput({ value, onChange }) {
  // Store as "MM/DD/YYYY" but allow typing "YYYY-MM-DD" too
  return (
    <input
      value={value || ''}
      placeholder="MM/DD/YYYY"
      onChange={(e) => onChange(e.target.value)}
      inputMode="numeric"
    />
  );
}

function UnitTypeSelect({ value, onChange }) {
  return (
    <select value={value || ''} onChange={(e)=>onChange(e.target.value)}>
      <option value="">(none)</option>
      <option value="Apt">Apt</option>
      <option value="Ste">Ste</option>
      <option value="Flr">Flr</option>
    </select>
  );
}

/* ---------- Parts ---------- */
function Part1Identity({ form, update, add, remove }) {
  const P = form.petitioner || {};
  const other = Array.isArray(P.otherNames) ? P.otherNames : [];
  const onAddOther = () => add('petitioner.otherNames', ()=>({lastName:'', firstName:'', middleName:''}));

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Identity)</h3>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="A-Number"><input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} /></Field>
        <Field label="USCIS Online Account #"><input value={P.uscisOnlineAccount||''} onChange={e=>update('petitioner.uscisOnlineAccount', e.target.value)} /></Field>
        <Field label="SSN"><input value={P.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} /></Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Classification Requested</strong></div>
        <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="classif" checked={(P.classification||'k1')==='k1'} onChange={()=>update('petitioner.classification','k1')} />
            <span>K-1 (Fiancé(e))</span>
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="classif" checked={P.classification==='k3'} onChange={()=>update('petitioner.classification','k3')} />
            <span>K-3 (Spouse)</span>
          </label>
        </div>

        {P.classification==='k3' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="Have you filed Form I-130 for your spouse? (Yes/No)">
              <input value={P.filedI130||''} onChange={e=>update('petitioner.filedI130', e.target.value)} placeholder="Yes or No" />
            </Field>
          </div>
        )}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family name (last)"><input value={P.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} /></Field>
        <Field label="Given name (first)"><input value={P.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} /></Field>
        <Field label="Middle name"><input value={P.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} /></Field>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>

      {other.map((n,i)=>(
        <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}><input value={n?.lastName||''} onChange={e=>update(`petitioner.otherNames.${i}.lastName`, e.target.value)} /></Field>
          <Field label="Given"><input value={n?.firstName||''} onChange={e=>update(`petitioner.otherNames.${i}.firstName`, e.target.value)} /></Field>
          <Field label="Middle"><input value={n?.middleName||''} onChange={e=>update(`petitioner.otherNames.${i}.middleName`, e.target.value)} /></Field>
          {i>0 && <button type="button" className="btn" onClick={()=>remove('petitioner.otherNames', i)}>Remove</button>}
        </div>
      ))}
    </section>
  );
}

function Part1Addresses({ form, update }) {
  const P = form.petitioner || {};
  const M = P.mailing || {};
  const physical = Array.isArray(P.physicalAddresses) ? P.physicalAddresses : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Addresses)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In care of (optional)"><input value={M.inCareOf||''} onChange={e=>update('petitioner.mailing.inCareOf', e.target.value)} /></Field>
          <Field label="Country"><input value={M.country||''} onChange={e=>update('petitioner.mailing.country', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
          <Field label="Street / Number"><input value={M.street||''} onChange={e=>update('petitioner.mailing.street', e.target.value)} /></Field>
          <Field label="Unit type"><UnitTypeSelect value={M.unitType||''} onChange={v=>update('petitioner.mailing.unitType', v)} /></Field>
          <Field label="Unit #"><input value={M.unitNumber||''} onChange={e=>update('petitioner.mailing.unitNumber', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="City"><input value={M.city||''} onChange={e=>update('petitioner.mailing.city', e.target.value)} /></Field>
          <Field label="State/Province"><input value={M.state||''} onChange={e=>update('petitioner.mailing.state', e.target.value)} /></Field>
          <Field label="ZIP/Postal"><input value={M.zip||''} onChange={e=>update('petitioner.mailing.zip', e.target.value)} /></Field>
        </div>
        <label style={{display:'flex', gap:8, alignItems:'center'}}>
          <input
            type="checkbox"
            checked={!!M.sameAsPhysical}
            onChange={e=>update('petitioner.mailing.sameAsPhysical', e.target.checked)}
          />
          <span className="small">Mailing address is same as physical address</span>
        </label>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (Most recent first)</strong></div>

        {physical.slice(0,2).map((a,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Address #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
              <Field label="Street / Number"><input value={a?.street||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.street`, e.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={a?.unitType||''} onChange={v=>update(`petitioner.physicalAddresses.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={a?.unitNumber||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.unitNumber`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="City"><input value={a?.city||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.city`, e.target.value)} /></Field>
              <Field label="State/Prov"><input value={a?.state||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.state`, e.target.value)} /></Field>
              <Field label="ZIP/Postal"><input value={a?.zip||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.zip`, e.target.value)} /></Field>
              <Field label="Country"><input value={a?.country||''} onChange={e=>update(`petitioner.physicalAddresses.${i}.country`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From"><DateInput value={a?.from||''} onChange={v=>update(`petitioner.physicalAddresses.${i}.from`, v)} /></Field>
              <Field label="To"><DateInput value={a?.to||''} onChange={v=>update(`petitioner.physicalAddresses.${i}.to`, v)} /></Field>
            </div>
          </div>
        ))}
        <div className="small">Need more than 2? Put additional addresses in Part 8.</div>
      </div>
    </section>
  );
}

function Part1Employment({ form, update }) {
  const P = form.petitioner || {};
  const jobs = Array.isArray(P.employment) ? P.employment : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Employment)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Employment History</strong></div>

        {jobs.slice(0,2).map((j,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Employer name"><input value={j?.employer||''} onChange={e=>update(`petitioner.employment.${i}.employer`, e.target.value)} /></Field>
              <Field label="Occupation"><input value={j?.occupation||''} onChange={e=>update(`petitioner.employment.${i}.occupation`, e.target.value)} /></Field>
              <Field label="Country"><input value={j?.country||''} onChange={e=>update(`petitioner.employment.${i}.country`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
              <Field label="Street / Number"><input value={j?.street||''} onChange={e=>update(`petitioner.employment.${i}.street`, e.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={j?.unitType||''} onChange={v=>update(`petitioner.employment.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={j?.unitNumber||''} onChange={e=>update(`petitioner.employment.${i}.unitNumber`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="City"><input value={j?.city||''} onChange={e=>update(`petitioner.employment.${i}.city`, e.target.value)} /></Field>
              <Field label="State/Prov"><input value={j?.state||''} onChange={e=>update(`petitioner.employment.${i}.state`, e.target.value)} /></Field>
              <Field label="ZIP/Postal"><input value={j?.zip||''} onChange={e=>update(`petitioner.employment.${i}.zip`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From"><DateInput value={j?.from||''} onChange={v=>update(`petitioner.employment.${i}.from`, v)} /></Field>
              <Field label="To"><DateInput value={j?.to||''} onChange={v=>update(`petitioner.employment.${i}.to`, v)} /></Field>
            </div>
          </div>
        ))}

        <div className="small">Need more than 2? Put additional employers in Part 8.</div>
      </div>
    </section>
  );
}

function Part1ParentsNatz({ form, update }) {
  const P = form.petitioner || {};
  const parents = Array.isArray(P.parents) ? P.parents : [];
  const C = P.citizenship || {};

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Parents / Citizenship)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parents</strong></div>

        {parents.slice(0,2).map((p,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Parent #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Family name (last)"><input value={p?.lastName||''} onChange={e=>update(`petitioner.parents.${i}.lastName`, e.target.value)} /></Field>
              <Field label="Given name (first)"><input value={p?.firstName||''} onChange={e=>update(`petitioner.parents.${i}.firstName`, e.target.value)} /></Field>
              <Field label="Middle name"><input value={p?.middleName||''} onChange={e=>update(`petitioner.parents.${i}.middleName`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="DOB"><DateInput value={p?.dob||''} onChange={v=>update(`petitioner.parents.${i}.dob`, v)} /></Field>
              <Field label="City of birth"><input value={p?.cityBirth||''} onChange={e=>update(`petitioner.parents.${i}.cityBirth`, e.target.value)} /></Field>
              <Field label="Country of birth"><input value={p?.countryBirth||''} onChange={e=>update(`petitioner.parents.${i}.countryBirth`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="Current city/country"><input value={p?.currentCityCountry||''} onChange={e=>update(`petitioner.parents.${i}.currentCityCountry`, e.target.value)} /></Field>
              <Field label="Sex"><input value={p?.sex||''} onChange={e=>update(`petitioner.parents.${i}.sex`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="Alive? (yes/no)"><input value={p?.alive||''} onChange={e=>update(`petitioner.parents.${i}.alive`, e.target.value)} placeholder="yes or no" /></Field>
              <Field label="If deceased, date of death"><DateInput value={p?.deathDate||''} onChange={v=>update(`petitioner.parents.${i}.deathDate`, v)} /></Field>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Petitioner Citizenship</strong></div>

        <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="citHow" checked={(C.how||'birth')==='birth'} onChange={()=>update('petitioner.citizenship.how','birth')} />
            <span>By Birth</span>
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="citHow" checked={C.how==='natz'} onChange={()=>update('petitioner.citizenship.how','natz')} />
            <span>By Naturalization</span>
          </label>
        </div>

        {C.how==='natz' && (
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Naturalization certificate #"><input value={C.natzCertificate||''} onChange={e=>update('petitioner.citizenship.natzCertificate', e.target.value)} /></Field>
            <Field label="Naturalization place"><input value={C.natzPlace||''} onChange={e=>update('petitioner.citizenship.natzPlace', e.target.value)} /></Field>
            <Field label="Naturalization date"><DateInput value={C.natzDate||''} onChange={v=>update('petitioner.citizenship.natzDate', v)} /></Field>
          </div>
        )}
      </div>
    </section>
  );
}

function Part2Identity({ form, update, add, remove }) {
  const B = form.beneficiary || {};
  const other = Array.isArray(B.otherNames) ? B.otherNames : [];
  const onAddOther = () => add('beneficiary.otherNames', ()=>({lastName:'', firstName:'', middleName:''}));

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Identity)</h3>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family name (last)"><input value={B.lastName||''} onChange={e=>update('beneficiary.lastName', e.target.value)} /></Field>
        <Field label="Given name (first)"><input value={B.firstName||''} onChange={e=>update('beneficiary.firstName', e.target.value)} /></Field>
        <Field label="Middle name"><input value={B.middleName||''} onChange={e=>update('beneficiary.middleName', e.target.value)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="A-Number"><input value={B.aNumber||''} onChange={e=>update('beneficiary.aNumber', e.target.value)} /></Field>
        <Field label="SSN"><input value={B.ssn||''} onChange={e=>update('beneficiary.ssn', e.target.value)} /></Field>
        <Field label="Date of birth"><DateInput value={B.dob||''} onChange={v=>update('beneficiary.dob', v)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="City of birth"><input value={B.cityBirth||''} onChange={e=>update('beneficiary.cityBirth', e.target.value)} /></Field>
        <Field label="Country of birth"><input value={B.countryBirth||''} onChange={e=>update('beneficiary.countryBirth', e.target.value)} /></Field>
        <Field label="Country of citizenship"><input value={B.nationality||''} onChange={e=>update('beneficiary.nationality', e.target.value)} /></Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Biographic Information (Page 9)</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Is the beneficiary Hispanic or Latino?">
            <select value={B.ethnicityHispanic||''} onChange={e=>update('beneficiary.ethnicityHispanic', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label="Race">
            <select value={B.race||''} onChange={e=>update('beneficiary.race', e.target.value)}>
              <option value="">Select...</option>
              <option value="white">White</option>
              <option value="asian">Asian</option>
              <option value="black">Black or African American</option>
              <option value="nhopi">Native Hawaiian or Other Pacific Islander</option>
            </select>
          </Field>
        </div>

        <div className="small">Race and Ethnicity are single selections — we check only one box on the PDF.</div>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>
      {other.map((n,i)=>(
        <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}><input value={n?.lastName||''} onChange={e=>update(`beneficiary.otherNames.${i}.lastName`, e.target.value)} /></Field>
          <Field label="Given"><input value={n?.firstName||''} onChange={e=>update(`beneficiary.otherNames.${i}.firstName`, e.target.value)} /></Field>
          <Field label="Middle"><input value={n?.middleName||''} onChange={e=>update(`beneficiary.otherNames.${i}.middleName`, e.target.value)} /></Field>
          {i>0 && <button type="button" className="btn" onClick={()=>remove('beneficiary.otherNames', i)}>Remove</button>}
        </div>
      ))}

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>US Entry / Status</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="In the U.S. now? (Yes/No)"><input value={B.inUS||''} onChange={e=>update('beneficiary.inUS', e.target.value)} /></Field>
          <Field label="I-94 #"><input value={B.i94||''} onChange={e=>update('beneficiary.i94', e.target.value)} /></Field>
          <Field label="Class of admission"><input value={B.classOfAdmission||''} onChange={e=>update('beneficiary.classOfAdmission', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Date of arrival"><DateInput value={B.arrivalDate||''} onChange={v=>update('beneficiary.arrivalDate', v)} /></Field>
          <Field label="Status expires"><DateInput value={B.statusExpires||''} onChange={v=>update('beneficiary.statusExpires', v)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Passport / Travel Document</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Passport #"><input value={B.passportNumber||''} onChange={e=>update('beneficiary.passportNumber', e.target.value)} /></Field>
          <Field label="Travel doc #"><input value={B.travelDocNumber||''} onChange={e=>update('beneficiary.travelDocNumber', e.target.value)} /></Field>
          <Field label="Issuing country"><input value={B.passportCountry||''} onChange={e=>update('beneficiary.passportCountry', e.target.value)} /></Field>
        </div>
        <Field label="Passport expiration"><DateInput value={B.passportExpiration||''} onChange={v=>update('beneficiary.passportExpiration', v)} /></Field>
      </div>
    </section>
  );
}

function Part2Addresses({ form, update }) {
  const B = form.beneficiary || {};
  const M = B.mailing || {};
  const physical = Array.isArray(B.physicalAddresses) ? B.physicalAddresses : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Addresses)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In care of (optional)"><input value={M.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} /></Field>
          <Field label="Country"><input value={M.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
          <Field label="Street / Number"><input value={M.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} /></Field>
          <Field label="Unit type"><UnitTypeSelect value={M.unitType||''} onChange={v=>update('beneficiary.mailing.unitType', v)} /></Field>
          <Field label="Unit #"><input value={M.unitNumber||''} onChange={e=>update('beneficiary.mailing.unitNumber', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="City"><input value={M.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} /></Field>
          <Field label="State/Province"><input value={M.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} /></Field>
          <Field label="ZIP/Postal"><input value={M.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History</strong></div>

        {physical.slice(0,2).map((a,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Address #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
              <Field label="Street / Number"><input value={a?.street||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.street`, e.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={a?.unitType||''} onChange={v=>update(`beneficiary.physicalAddresses.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={a?.unitNumber||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.unitNumber`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="City"><input value={a?.city||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.city`, e.target.value)} /></Field>
              <Field label="State/Prov"><input value={a?.state||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.state`, e.target.value)} /></Field>
              <Field label="ZIP/Postal"><input value={a?.zip||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.zip`, e.target.value)} /></Field>
              <Field label="Country"><input value={a?.country||''} onChange={e=>update(`beneficiary.physicalAddresses.${i}.country`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From"><DateInput value={a?.from||''} onChange={v=>update(`beneficiary.physicalAddresses.${i}.from`, v)} /></Field>
              <Field label="To"><DateInput value={a?.to||''} onChange={v=>update(`beneficiary.physicalAddresses.${i}.to`, v)} /></Field>
            </div>
          </div>
        ))}
        <div className="small">Need more than 2? Put additional addresses in Part 8.</div>
      </div>
    </section>
  );
}

function Part2Employment({ form, update }) {
  const B = form.beneficiary || {};
  const jobs = Array.isArray(B.employment) ? B.employment : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Employment)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Employment History</strong></div>

        {jobs.slice(0,2).map((j,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Employer name"><input value={j?.employer||''} onChange={e=>update(`beneficiary.employment.${i}.employer`, e.target.value)} /></Field>
              <Field label="Occupation"><input value={j?.occupation||''} onChange={e=>update(`beneficiary.employment.${i}.occupation`, e.target.value)} /></Field>
              <Field label="Country"><input value={j?.country||''} onChange={e=>update(`beneficiary.employment.${i}.country`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10}}>
              <Field label="Street / Number"><input value={j?.street||''} onChange={e=>update(`beneficiary.employment.${i}.street`, e.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={j?.unitType||''} onChange={v=>update(`beneficiary.employment.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={j?.unitNumber||''} onChange={e=>update(`beneficiary.employment.${i}.unitNumber`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="City"><input value={j?.city||''} onChange={e=>update(`beneficiary.employment.${i}.city`, e.target.value)} /></Field>
              <Field label="State/Prov"><input value={j?.state||''} onChange={e=>update(`beneficiary.employment.${i}.state`, e.target.value)} /></Field>
              <Field label="ZIP/Postal"><input value={j?.zip||''} onChange={e=>update(`beneficiary.employment.${i}.zip`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From"><DateInput value={j?.from||''} onChange={v=>update(`beneficiary.employment.${i}.from`, v)} /></Field>
              <Field label="To"><DateInput value={j?.to||''} onChange={v=>update(`beneficiary.employment.${i}.to`, v)} /></Field>
            </div>
          </div>
        ))}

        <div className="small">Need more than 2? Put additional employers in Part 8.</div>
      </div>
    </section>
  );
}

function Part2Parents({ form, update }) {
  const B = form.beneficiary || {};
  const parents = Array.isArray(B.parents) ? B.parents : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Parents)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parents</strong></div>

        {parents.slice(0,2).map((p,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Parent #{i+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Family name (last)"><input value={p?.lastName||''} onChange={e=>update(`beneficiary.parents.${i}.lastName`, e.target.value)} /></Field>
              <Field label="Given name (first)"><input value={p?.firstName||''} onChange={e=>update(`beneficiary.parents.${i}.firstName`, e.target.value)} /></Field>
              <Field label="Middle name"><input value={p?.middleName||''} onChange={e=>update(`beneficiary.parents.${i}.middleName`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="DOB"><DateInput value={p?.dob||''} onChange={v=>update(`beneficiary.parents.${i}.dob`, v)} /></Field>
              <Field label="City of birth"><input value={p?.cityBirth||''} onChange={e=>update(`beneficiary.parents.${i}.cityBirth`, e.target.value)} /></Field>
              <Field label="Country of birth"><input value={p?.countryBirth||''} onChange={e=>update(`beneficiary.parents.${i}.countryBirth`, e.target.value)} /></Field>
            </div>
            <Field label="Current city/country"><input value={p?.currentCityCountry||''} onChange={e=>update(`beneficiary.parents.${i}.currentCityCountry`, e.target.value)} /></Field>
          </div>
        ))}
      </div>
    </section>
  );
}

function Parts5to7({ form, update }) {
  const C = form.contact || {};
  const I = form.interpreter || {};
  const P = form.preparer || {};

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Parts 5–7 — Contact / Interpreter / Preparer</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Petitioner Contact</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Daytime phone"><input value={C.daytimePhone||''} onChange={e=>update('contact.daytimePhone', e.target.value)} /></Field>
          <Field label="Mobile"><input value={C.mobile||''} onChange={e=>update('contact.mobile', e.target.value)} /></Field>
          <Field label="Email"><input value={C.email||''} onChange={e=>update('contact.email', e.target.value)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Interpreter</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Family name"><input value={I.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} /></Field>
          <Field label="Given name"><input value={I.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Business/Org"><input value={I.business||''} onChange={e=>update('interpreter.business', e.target.value)} /></Field>
          <Field label="Phone"><input value={I.phone||''} onChange={e=>update('interpreter.phone', e.target.value)} /></Field>
          <Field label="Email"><input value={I.email||''} onChange={e=>update('interpreter.email', e.target.value)} /></Field>
        </div>
        <Field label="Signature date"><DateInput value={I.signDate||''} onChange={v=>update('interpreter.signDate', v)} /></Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Preparer</strong></div>
        <Field label="Is this person an attorney/rep? (yes/no)">
          <input value={P.isAttorney||''} onChange={e=>update('preparer.isAttorney', e.target.value)} placeholder="yes or no" />
        </Field>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Family name"><input value={P.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} /></Field>
          <Field label="Given name"><input value={P.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Business/Org"><input value={P.business||''} onChange={e=>update('preparer.business', e.target.value)} /></Field>
          <Field label="Phone"><input value={P.phone||''} onChange={e=>update('preparer.phone', e.target.value)} /></Field>
          <Field label="Email"><input value={P.email||''} onChange={e=>update('preparer.email', e.target.value)} /></Field>
        </div>
        <Field label="Signature date"><DateInput value={P.signDate||''} onChange={v=>update('preparer.signDate', v)} /></Field>
      </div>
    </section>
  );
}

function Part8Additional({ form, update }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 8 — Additional Information</h3>
      <Field label="Use this to add anything that doesn't fit elsewhere (extra addresses, employers, etc.)">
        <textarea
          rows={8}
          value={form.additionalInfo||''}
          onChange={e=>update('additionalInfo', e.target.value)}
        />
      </Field>
    </section>
  );
}

function Review({ form, onSave, busy }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Review / Download</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Step 1: Save</strong></div>
        <div className="small">Make sure your latest changes are saved before downloading.</div>
        <button type="button" className="btn primary" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save Now'}
        </button>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Step 2: Download the filled PDF</strong></div>
        <div className="small">
          This calls your server endpoint that merges your saved data into the PDF.
        </div>
        <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
          Download I-129F PDF
        </a>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Raw data (for debugging)</strong></div>
        <pre style={{whiteSpace:'pre-wrap', fontSize:12, margin:0}}>
{JSON.stringify(form, null, 2)}
        </pre>
      </div>
    </section>
  );
}

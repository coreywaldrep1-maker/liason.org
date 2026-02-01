'use client';

import { useEffect, useMemo, useState } from 'react';

const SECTIONS = [
  { key: 'p1_identity', label: 'Part 1 — Petitioner' },
  { key: 'p1_address', label: 'Part 1 — Addresses' },
  { key: 'p1_parents', label: 'Part 1 — Parents' },
  { key: 'p2_identity', label: 'Part 2 — Beneficiary' },
  { key: 'p2_address', label: 'Part 2 — Addresses' },
  { key: 'p2_employment', label: 'Part 2 — Employment' },
  { key: 'p2_parents', label: 'Part 2 — Parents' },
  { key: 'p3_criminal', label: 'Part 3 — Criminal' },
  { key: 'p4_other', label: 'Part 4 — Other' },
  { key: 'p5_7', label: 'Parts 5–7' },
  { key: 'p8_additional', label: 'Part 8 — Additional' },
  { key: 'review', label: 'Review / Download' },
];

const EMPTY = {
  petitioner: {
    lastName: '',
    firstName: '',
    middleName: '',
    aNumber: '',
    ssn: '',
    dob: '',
    sex: '',
    countryBirth: '',
    cityBirth: '',
    citizenship: { status: '', acquisition: '' },

    // Page 1 (4a/4b)
    classification: 'k1', // 'k1' or 'k3'
    filedI130: '', // only for k3 (yes/no)

    otherNamesUsed: [{ lastName: '', firstName: '', middleName: '' }],

    mailing: {
      inCareOf: '',
      street: '',
      unitType: '',
      unitNumber: '',
      city: '',
      state: '',
      zip: '',
      province: '',
      postal: '',
      country: '',
      sameAsPhysical: false,
    },
    physicalAddresses: [
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
    ],

    parents: [
      { lastName: '', firstName: '', middleName: '', dob: '', sex: '', cityBirth: '', countryBirth: '', currentCityCountry: '', alive: 'yes', deathDate: '' },
      { lastName: '', firstName: '', middleName: '', dob: '', sex: '', cityBirth: '', countryBirth: '', currentCityCountry: '', alive: 'yes', deathDate: '' },
    ],

    criminal: {
      restrainingOrder: '',
      arrestedOrConvicted2a: '',
      arrestedOrConvicted2b: '',
      arrestedOrConvicted2c: '',
      reasonSelfDefense: false,
      reasonViolatedProtectionOrder: false,
      reasonBatteredCruelty: false,
      everArrestedCitedCharged: '',
      everArrestedDetails: '',
      waiverType: '',
    },
  },

  beneficiary: {
    lastName: '',
    firstName: '',
    middleName: '',
    aNumber: '',
    ssn: '',
    dob: '',
    cityBirth: '',
    countryBirth: '',
    nationality: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],

    // Biographic
    ethnicityHispanic: '',
    race: '',
    heightFeet: '',
    heightInches: '',
    eyeColor: '',
    hairColor: '',

    inUS: '',
    i94: '',
    classOfAdmission: '',
    arrivalDate: '',
    statusExpires: '',
    passportNumber: '',
    travelDocNumber: '',
    passportCountry: '',
    passportExpiration: '',

    mailing: {
      inCareOf: '',
      street: '',
      unitType: '',
      unitNumber: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    physicalAddresses: [
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
      { street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
    ],

    employment: [
      { employer: '', occupation: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
      { employer: '', occupation: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', country: '', from: '', to: '' },
    ],

    parents: [
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '' },
      { lastName: '', firstName: '', middleName: '', dob: '', cityBirth: '', countryBirth: '', currentCityCountry: '' },
    ],
  },

  contact: { daytimePhone: '', mobile: '', email: '' },
  interpreter: { lastName: '', firstName: '', business: '', phone: '', email: '', signDate: '' },
  preparer: { isAttorney: '', lastName: '', firstName: '', business: '', phone: '', email: '', signDate: '' },
  additionalInfo: '',
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setPath(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    const idx = Number.isFinite(Number(p)) ? Number(p) : null;
    if (idx !== null && String(idx) === p) {
      if (!Array.isArray(cur)) throw new Error('setPath: expected array');
      if (!cur[idx]) cur[idx] = {};
      cur = cur[idx];
    } else {
      if (!cur[p]) cur[p] = {};
      cur = cur[p];
    }
  }
  const idxLast = Number.isFinite(Number(last)) ? Number(last) : null;
  if (idxLast !== null && String(idxLast) === last) cur[idxLast] = value;
  else cur[last] = value;
}

function normalizeUs(d) {
  if (!d) return '';
  // supports YYYY-MM-DD from <input type="date"> OR already MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-');
    return `${m}/${day}/${y}`;
  }
  return d;
}

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const active = SECTIONS[step]?.key || SECTIONS[0].key;

  const update = (path, value) => {
    setForm(prev => {
      const next = deepClone(prev);
      setPath(next, path, value);
      return next;
    });
  };

  const add = (path, factory) => {
    setForm(prev => {
      const next = deepClone(prev);
      const parts = path.split('.');
      const last = parts.pop();
      let cur = next;
      for (const p of parts) cur = cur[p];
      cur[last] = Array.isArray(cur[last]) ? [...cur[last], factory()] : [factory()];
      return next;
    });
  };

  const remove = (path, idx) => {
    setForm(prev => {
      const next = deepClone(prev);
      const parts = path.split('.');
      const last = parts.pop();
      let cur = next;
      for (const p of parts) cur = cur[p];
      if (Array.isArray(cur[last])) cur[last].splice(idx, 1);
      return next;
    });
  };

  // load from server if available
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch('/api/i129f/data');
        if (!r.ok) return;
        const j = await r.json();
        if (ignore) return;
        if (j?.data) {
          const merged = deepClone(EMPTY);
          merged.petitioner = { ...EMPTY.petitioner, ...(j.data.petitioner || {}) };
          merged.petitioner.mailing = { ...EMPTY.petitioner.mailing, ...(j.data?.petitioner?.mailing || {}) };
          merged.petitioner.citizenship = { ...EMPTY.petitioner.citizenship, ...(j.data?.petitioner?.citizenship || {}) };
          merged.petitioner.criminal = { ...EMPTY.petitioner.criminal, ...(j.data?.petitioner?.criminal || {}) };
          merged.beneficiary = { ...EMPTY.beneficiary, ...(j.data.beneficiary || {}) };
          merged.beneficiary.mailing = { ...EMPTY.beneficiary.mailing, ...(j.data?.beneficiary?.mailing || {}) };
          merged.contact = { ...EMPTY.contact, ...(j.data.contact || {}) };
          merged.interpreter = { ...EMPTY.interpreter, ...(j.data.interpreter || {}) };
          merged.preparer = { ...EMPTY.preparer, ...(j.data.preparer || {}) };
          merged.additionalInfo = j.data.additionalInfo || '';
          setForm(merged);
        }
      } catch {
        // ignore
      }
    })();
    return () => { ignore = true; };
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      const normalized = deepClone(form);
      // normalize dates used on PDF
      const datePaths = [
        'petitioner.dob',
        'petitioner.parents.0.dob',
        'petitioner.parents.1.dob',
        'petitioner.parents.0.deathDate',
        'petitioner.parents.1.deathDate',
        'petitioner.physicalAddresses.0.from',
        'petitioner.physicalAddresses.0.to',
        'petitioner.physicalAddresses.1.from',
        'petitioner.physicalAddresses.1.to',

        'beneficiary.dob',
        'beneficiary.arrivalDate',
        'beneficiary.statusExpires',
        'beneficiary.passportExpiration',
        'beneficiary.physicalAddresses.0.from',
        'beneficiary.physicalAddresses.0.to',
        'beneficiary.physicalAddresses.1.from',
        'beneficiary.physicalAddresses.1.to',
        'beneficiary.employment.0.from',
        'beneficiary.employment.0.to',
        'beneficiary.employment.1.from',
        'beneficiary.employment.1.to',
        'beneficiary.parents.0.dob',
        'beneficiary.parents.1.dob',
        'interpreter.signDate',
        'preparer.signDate',
      ];

      for (const p of datePaths) {
        const parts = p.split('.');
        let cur = normalized;
        for (let i=0; i<parts.length; i++) {
          const key = parts[i];
          const idx = String(Number(key)) === key ? Number(key) : null;
          if (i === parts.length-1) {
            if (idx !== null) cur[idx] = normalizeUs(cur[idx]);
            else cur[key] = normalizeUs(cur[key]);
          } else {
            cur = (idx !== null) ? cur[idx] : cur[key];
            if (cur == null) break;
          }
        }
      }

      const r = await fetch('/api/i129f/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: normalized }),
      });
      if (!r.ok) throw new Error('Save failed');
      setMsg('Saved.');
    } catch (e) {
      setMsg('Save failed. Check console/server logs.');
    } finally {
      setBusy(false);
    }
  };

  const content = useMemo(() => {
    switch (active) {
      case 'p1_identity': return <Part1Identity form={form} update={update} add={add} remove={remove} />;
      case 'p1_address': return <Part1Addresses form={form} update={update} add={add} remove={remove} />;
      case 'p1_parents': return <Part1Parents form={form} update={update} />;
      case 'p2_identity': return <Part2Identity form={form} update={update} add={add} remove={remove} />;
      case 'p2_address': return <Part2Addresses form={form} update={update} />;
      case 'p2_employment': return <Part2Employment form={form} update={update} />;
      case 'p2_parents': return <Part2Parents form={form} update={update} />;
      case 'p3_criminal': return <Part3Criminal form={form} update={update} />;
      case 'p4_other': return <Part4Other form={form} update={update} />;
      case 'p5_7': return <Parts5to7 form={form} update={update} />;
      case 'p8_additional': return <Part8Additional form={form} update={update} />;
      case 'review': return <Review form={form} onSave={save} busy={busy} />;
      default: return null;
    }
  }, [active, form]);

  return (
    <div style={{display:'grid', gap:14}}>
      <div className="card" style={{display:'flex', gap:10, flexWrap:'wrap', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {SECTIONS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`btn ${i===step ? 'primary' : ''}`}
              onClick={()=>setStep(i)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <button type="button" className="btn" onClick={()=>setStep(s=>Math.max(0, s-1))} disabled={step===0}>Back</button>
          <button type="button" className="btn" onClick={()=>setStep(s=>Math.min(SECTIONS.length-1, s+1))} disabled={step===SECTIONS.length-1}>Next</button>
          <button type="button" className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {msg && <div className="small" style={{opacity:.9}}>{msg}</div>}

      {content}
    </div>
  );
}

/** UI helpers **/

function Field({ label, children }) {
  return (
    <label style={{display:'grid', gap:6}}>
      <div className="small" style={{opacity:.9}}>{label}</div>
      {children}
    </label>
  );
}

function DateInput({ value, onChange }) {
  // Use a native calendar (type="date") but store the value as MM/DD/YYYY.
  const toIso = (v) => {
    if (!v) return '';
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
      const [m, d, y] = s.split('/');
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
    return '';
  };

  const fromIso = (iso) => {
    if (!iso) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) {
      const [y, m, d] = String(iso).split('-');
      return `${m}/${d}/${y}`;
    }
    return String(iso);
  };

  return (
    <input
      type="date"
      value={toIso(value)}
      onChange={(e) => onChange(fromIso(e.target.value))}
    />
  );
}

function UnitTypeSelect({ value, onChange }) {
  return (
    <select value={value || ''} onChange={(e)=>onChange(e.target.value)}>
      <option value="">(none)</option>
      <option value="APT">Apt</option>
      <option value="STE">Ste</option>
      <option value="FLR">Flr</option>
    </select>
  );
}

/** PART 1 **/

function Part1Identity({ form, update, add, remove }) {
  const P = form.petitioner || {};
  const other = Array.isArray(P.otherNamesUsed) ? P.otherNamesUsed : [];
  const onAddOther = () => add('petitioner.otherNamesUsed', ()=>({lastName:'', firstName:'', middleName:''}));

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Identity)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Petition Type (Page 1)</strong></div>

        <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input
              type="radio"
              name="petitionType"
              checked={(P.classification || 'k1') === 'k1'}
              onChange={()=>update('petitioner.classification', 'k1')}
            />
            <span>Fiancé (K-1)</span>
          </label>

          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input
              type="radio"
              name="petitionType"
              checked={(P.classification || 'k1') === 'k3'}
              onChange={()=>update('petitioner.classification', 'k3')}
            />
            <span>Spouse (K-3)</span>
          </label>
        </div>

        {P.classification === 'k3' && (
          <div style={{display:'grid', gap:10}}>
            <Field label="Have you filed Form I-130 for your spouse?">
              <div style={{display:'flex', gap:16, flexWrap:'wrap'}}
              >
                <label style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input
                    type="radio"
                    name="filedI130"
                    checked={String(P.filedI130||'').trim().toLowerCase()==='yes'}
                    onChange={()=>update('petitioner.filedI130','yes')}
                  />
                  <span>Yes</span>
                </label>
                <label style={{display:'flex', gap:8, alignItems:'center'}}>
                  <input
                    type="radio"
                    name="filedI130"
                    checked={String(P.filedI130||'').trim().toLowerCase()==='no'}
                    onChange={()=>update('petitioner.filedI130','no')}
                  />
                  <span>No</span>
                </label>
              </div>
            </Field>
          </div>
        )}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="Family name (last)"><input value={P.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} /></Field>
        <Field label="Given name (first)"><input value={P.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} /></Field>
        <Field label="Middle name"><input value={P.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="A-Number"><input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} /></Field>
        <Field label="SSN"><input value={P.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} /></Field>
        <Field label="Date of birth"><DateInput value={P.dob||''} onChange={v=>update('petitioner.dob', v)} /></Field>
        <Field label="Sex"><input value={P.sex||''} onChange={e=>update('petitioner.sex', e.target.value)} placeholder="Male or Female" /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="City of birth"><input value={P.cityBirth||''} onChange={e=>update('petitioner.cityBirth', e.target.value)} /></Field>
        <Field label="Country of birth"><input value={P.countryBirth||''} onChange={e=>update('petitioner.countryBirth', e.target.value)} /></Field>
        <Field label="Citizenship status"><input value={P.citizenship?.status||''} onChange={e=>update('petitioner.citizenship.status', e.target.value)} placeholder="U.S. citizen / LPR / etc." /></Field>
      </div>

      <Field label="How was citizenship acquired?"><input value={P.citizenship?.acquisition||''} onChange={e=>update('petitioner.citizenship.acquisition', e.target.value)} /></Field>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used (Page 1)</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>

      {other.map((n,i)=>(
        <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}><input value={n?.lastName||''} onChange={e=>update(`petitioner.otherNamesUsed.${i}.lastName`, e.target.value)} /></Field>
          <Field label="Given"><input value={n?.firstName||''} onChange={e=>update(`petitioner.otherNamesUsed.${i}.firstName`, e.target.value)} /></Field>
          <Field label="Middle"><input value={n?.middleName||''} onChange={e=>update(`petitioner.otherNamesUsed.${i}.middleName`, e.target.value)} /></Field>
          {i>0 && <button type="button" className="btn" onClick={()=>remove('petitioner.otherNamesUsed', i)}>Remove</button>}
        </div>
      ))}
    </section>
  );
}

function Part1Addresses({ form, update }) {
  const P = form.petitioner || {};
  const M = P.mailing || {};
  const physical = Array.isArray(P.physicalAddresses) ? P.physicalAddresses : [];

  const onSameAsPhysical = (same) => {
    update('petitioner.mailing.sameAsPhysical', !!same);

    // If user says mailing == physical, copy mailing address into Physical Address #1
    if (same) {
      update('petitioner.physicalAddresses.0.street', M.street || '');
      update('petitioner.physicalAddresses.0.unitType', M.unitType || '');
      update('petitioner.physicalAddresses.0.unitNumber', M.unitNumber || '');
      update('petitioner.physicalAddresses.0.city', M.city || '');
      update('petitioner.physicalAddresses.0.state', M.state || '');
      update('petitioner.physicalAddresses.0.zip', M.zip || '');
      update('petitioner.physicalAddresses.0.country', M.country || '');
    }
  };

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Addresses)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address (Page 1)</strong></div>

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

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Province (if applicable)"><input value={M.province||''} onChange={e=>update('petitioner.mailing.province', e.target.value)} /></Field>
          <Field label="Postal code (if applicable)"><input value={M.postal||''} onChange={e=>update('petitioner.mailing.postal', e.target.value)} /></Field>
        </div>

        <div className="small"><strong>Is the mailing address the same as the physical address?</strong></div>
        <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="mailSameAsPhysical" checked={M.sameAsPhysical===true} onChange={()=>onSameAsPhysical(true)} />
            <span>Yes</span>
          </label>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="radio" name="mailSameAsPhysical" checked={M.sameAsPhysical===false} onChange={()=>onSameAsPhysical(false)} />
            <span>No</span>
          </label>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (Page 2)</strong></div>

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

function Part1Parents({ form, update }) {
  const P = form.petitioner || {};
  const parents = Array.isArray(P.parents) ? P.parents : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Parents)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parents</strong></div>

        {parents.slice(0,2).map((p,i)=>(
          <div key={i} style={{borderTop:i? '1px solid rgba(255,255,255,.08)' : 'none', paddingTop:i?10:0, display:'grid', gap:10}}>
            <div className="small"><strong>Parent #{i+1}</strong></div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Family (last)"><input value={p?.lastName||''} onChange={e=>update(`petitioner.parents.${i}.lastName`, e.target.value)} /></Field>
              <Field label="Given (first)"><input value={p?.firstName||''} onChange={e=>update(`petitioner.parents.${i}.firstName`, e.target.value)} /></Field>
              <Field label="Middle"><input value={p?.middleName||''} onChange={e=>update(`petitioner.parents.${i}.middleName`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Date of birth"><DateInput value={p?.dob||''} onChange={v=>update(`petitioner.parents.${i}.dob`, v)} /></Field>
              <Field label="City of birth"><input value={p?.cityBirth||''} onChange={e=>update(`petitioner.parents.${i}.cityBirth`, e.target.value)} /></Field>
              <Field label="Country of birth"><input value={p?.countryBirth||''} onChange={e=>update(`petitioner.parents.${i}.countryBirth`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Current city/country of residence"><input value={p?.currentCityCountry||''} onChange={e=>update(`petitioner.parents.${i}.currentCityCountry`, e.target.value)} /></Field>
              <Field label="Sex"><input value={p?.sex||''} onChange={e=>update(`petitioner.parents.${i}.sex`, e.target.value)} placeholder="Male or Female" /></Field>
              <Field label="Alive? (yes/no)">
                <select value={p?.alive||'yes'} onChange={e=>update(`petitioner.parents.${i}.alive`, e.target.value)}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </div>

            {String(p?.alive||'yes') === 'no' && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="Date of death"><DateInput value={p?.deathDate||''} onChange={v=>update(`petitioner.parents.${i}.deathDate`, v)} /></Field>
              </div>
            )}
          </div>
        ))}

        <div className="small">Only 2 parents are needed. Extra details can go in Part 8.</div>
      </div>
    </section>
  );
}

/** PART 2 **/

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

          <Field label="Height (Feet)">
            <input type="number" min="0" value={B.heightFeet||''} onChange={e=>update('beneficiary.heightFeet', e.target.value)} />
          </Field>

          <Field label="Height (Inches)">
            <input type="number" min="0" max="11" value={B.heightInches||''} onChange={e=>update('beneficiary.heightInches', e.target.value)} />
          </Field>

          <Field label="Eye Color">
            <select value={B.eyeColor||''} onChange={e=>update('beneficiary.eyeColor', e.target.value)}>
              <option value="">Select...</option>
              <option value="black">Black</option>
              <option value="blue">Blue</option>
              <option value="brown">Brown</option>
              <option value="gray">Gray</option>
              <option value="green">Green</option>
              <option value="hazel">Hazel</option>
              <option value="maroon">Maroon</option>
              <option value="pink">Pink</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>

          <Field label="Hair Color">
            <select value={B.hairColor||''} onChange={e=>update('beneficiary.hairColor', e.target.value)}>
              <option value="">Select...</option>
              <option value="bald">Bald</option>
              <option value="black">Black</option>
              <option value="blond">Blond</option>
              <option value="brown">Brown</option>
              <option value="gray">Gray</option>
              <option value="red">Red</option>
              <option value="sandy">Sandy</option>
              <option value="white">White</option>
              <option value="unknown_other">Unknown / Other</option>
            </select>
          </Field>
        </div>

        <div className="small">Race, Ethnicity, Eye Color, and Hair Color are single selections — we check only one box on the PDF.</div>
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
              <Field label="Family (last)"><input value={p?.lastName||''} onChange={e=>update(`beneficiary.parents.${i}.lastName`, e.target.value)} /></Field>
              <Field label="Given (first)"><input value={p?.firstName||''} onChange={e=>update(`beneficiary.parents.${i}.firstName`, e.target.value)} /></Field>
              <Field label="Middle"><input value={p?.middleName||''} onChange={e=>update(`beneficiary.parents.${i}.middleName`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Date of birth"><DateInput value={p?.dob||''} onChange={v=>update(`beneficiary.parents.${i}.dob`, v)} /></Field>
              <Field label="City of birth"><input value={p?.cityBirth||''} onChange={e=>update(`beneficiary.parents.${i}.cityBirth`, e.target.value)} /></Field>
              <Field label="Country of birth"><input value={p?.countryBirth||''} onChange={e=>update(`beneficiary.parents.${i}.countryBirth`, e.target.value)} /></Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="Current city/country of residence"><input value={p?.currentCityCountry||''} onChange={e=>update(`beneficiary.parents.${i}.currentCityCountry`, e.target.value)} /></Field>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


/** PART 3 — Criminal **/

function Part3Criminal({ form, update }) {
  const C = form.petitioner?.criminal || {};

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Part 3 — Other Information (Criminal)</strong></div>
        <div className="small">
          These questions must be answered even if your records were sealed, cleared, or if anyone (including a judge, law enforcement officer, or attorney) told you that you no longer have a record.
        </div>

        <div style={{display:'grid', gap:10}}>
          <Field label="Have you EVER been subject to a temporary or permanent protection or restraining order (either civil or criminal)? (Item 1)">
            <select value={C.restrainingOrder||''} onChange={e=>update('petitioner.criminal.restrainingOrder', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label={<>Have you EVER been arrested or convicted of any of the following crimes:<br/>Domestic violence, sexual assault, child abuse, child neglect, dating violence, elder abuse, stalking or an attempt to commit any of these crimes? (Item 2.a.)</>}>
            <select value={C.arrestedOrConvicted2a||''} onChange={e=>update('petitioner.criminal.arrestedOrConvicted2a', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label={<>Homicide, murder, manslaughter, rape, abusive sexual contact, sexual exploitation, incest, torture, trafficking, peonage, holding hostage, involuntary servitude, slave trade, kidnapping, abduction, unlawful criminal restraint, false imprisonment, or an attempt to commit any of these crimes? (Item 2.b.)</>}>
            <select value={C.arrestedOrConvicted2b||''} onChange={e=>update('petitioner.criminal.arrestedOrConvicted2b', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label={<>Three or more arrests or convictions, not from a single act, for crimes relating to a controlled substance or alcohol? (Item 2.c.)</>}>
            <select value={C.arrestedOrConvicted2c||''} onChange={e=>update('petitioner.criminal.arrestedOrConvicted2c', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Item 3 — If you were being battered or subjected to extreme cruelty at the time of your conviction</strong></div>
        <div className="small">Select all that apply:</div>

        <div style={{display:'grid', gap:8}}>
          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!C.reasonSelfDefense} onChange={e=>update('petitioner.criminal.reasonSelfDefense', e.target.checked)} />
            <span className="small">3.a. I was acting in self-defense.</span>
          </label>

          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!C.reasonViolatedProtectionOrder} onChange={e=>update('petitioner.criminal.reasonViolatedProtectionOrder', e.target.checked)} />
            <span className="small">3.b. I violated a protection order issued for my own protection.</span>
          </label>

          <label style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!C.reasonBatteredCruelty} onChange={e=>update('petitioner.criminal.reasonBatteredCruelty', e.target.checked)} />
            <span className="small">3.c. I committed, was arrested for, was convicted of, or pled guilty to a crime that did not result in serious bodily injury and there was a connection between the crime and me having been battered or subjected to extreme cruelty.</span>
          </label>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label={<>Have you ever been arrested, cited, charged, indicted, convicted, fined, or imprisoned for breaking or violating any law or ordinance in any country, excluding traffic violations (unless a traffic violation was alcohol- or drug-related or involved a fine of $500 or more)? (Item 4.a.)</>}>
            <select value={C.everArrestedCitedCharged||''} onChange={e=>update('petitioner.criminal.everArrestedCitedCharged', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>

          <Field label="If Yes, provide information (Item 4.b.)">
            <textarea rows={4} value={C.everArrestedDetails||''} onChange={e=>update('petitioner.criminal.everArrestedDetails', e.target.value)} />
          </Field>
        </div>

        <Field label="Indicate which one of the following waivers you are requesting (Item 5.a.–5.d.)">
          <select value={C.waiverType||''} onChange={e=>update('petitioner.criminal.waiverType', e.target.value)}>
            <option value="">Select...</option>
            <option value="general">Multiple Filer, No Permanent Restraining Orders or Convictions for a Specified Offense (General Waiver)</option>
            <option value="extraordinary">Multiple Filer, Prior Permanent Restraining Orders or Criminal Conviction for Specified Offense (Extraordinary Circumstances Waiver)</option>
            <option value="mandatory">Multiple Filer, Prior Permanent Restraining Order or Criminal Convictions for Specified Offense Resulting from Domestic Violence (Mandatory Waiver)</option>
            <option value="not_applicable">Not applicable, beneficiary is my spouse or I am not a multiple filer</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

/** PART 4 placeholder **/

function Part4Other() {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 4 — Other Information</h3>
      <div className="card">
        <div className="small">Continue mapping Part 4 fields as you identify missing items.</div>
      </div>
    </section>
  );
}

/** PARTS 5–7 **/

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
        <div className="small"><strong>Interpreter (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family (last)"><input value={I.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} /></Field>
          <Field label="Given (first)"><input value={I.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} /></Field>
          <Field label="Business/Org"><input value={I.business||''} onChange={e=>update('interpreter.business', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Phone"><input value={I.phone||''} onChange={e=>update('interpreter.phone', e.target.value)} /></Field>
          <Field label="Email"><input value={I.email||''} onChange={e=>update('interpreter.email', e.target.value)} /></Field>
          <Field label="Sign date"><DateInput value={I.signDate||''} onChange={v=>update('interpreter.signDate', v)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Preparer (if used)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Is attorney/rep? (Yes/No)"><input value={P.isAttorney||''} onChange={e=>update('preparer.isAttorney', e.target.value)} /></Field>
          <Field label="Family (last)"><input value={P.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} /></Field>
          <Field label="Given (first)"><input value={P.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Business/Org"><input value={P.business||''} onChange={e=>update('preparer.business', e.target.value)} /></Field>
          <Field label="Phone"><input value={P.phone||''} onChange={e=>update('preparer.phone', e.target.value)} /></Field>
          <Field label="Email"><input value={P.email||''} onChange={e=>update('preparer.email', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Sign date"><DateInput value={P.signDate||''} onChange={v=>update('preparer.signDate', v)} /></Field>
        </div>
      </div>
    </section>
  );
}

function Part8Additional({ form, update }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 8 — Additional Information</h3>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Use this for extra addresses/employers/names and explanations.</strong></div>
        <textarea
          rows={10}
          value={form.additionalInfo || ''}
          onChange={e=>update('additionalInfo', e.target.value)}
          placeholder="Add any continuation notes here..."
        />
      </div>
    </section>
  );
}

function Review({ form, onSave, busy }) {
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Review / Download</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small">
          <strong>Save your progress</strong> first, then download the PDF to verify what’s populating.
        </div>

        <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <button type="button" className="btn primary" onClick={onSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>

          <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
            Download I-129F (PDF)
          </a>

          <a className="btn" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">
            PDF Debug
          </a>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Quick Snapshot</strong></div>
        <pre style={{whiteSpace:'pre-wrap', margin:0, fontSize:12, opacity:.9}}>
{JSON.stringify({
  petitioner: {
    name: `${form?.petitioner?.firstName||''} ${form?.petitioner?.middleName||''} ${form?.petitioner?.lastName||''}`.replace(/\s+/g,' ').trim(),
    aNumber: form?.petitioner?.aNumber,
    mailing: form?.petitioner?.mailing,
  },
  beneficiary: {
    name: `${form?.beneficiary?.firstName||''} ${form?.beneficiary?.middleName||''} ${form?.beneficiary?.lastName||''}`.replace(/\s+/g,' ').trim(),
    dob: form?.beneficiary?.dob,
    mailing: form?.beneficiary?.mailing,
  }
}, null, 2)}
        </pre>
      </div>
    </section>
  );
}

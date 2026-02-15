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
  { key: 'pdf_all', label: 'All PDF Fields' },
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
    weight: '',
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
      { employer: '', occupation: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', province: '', postal: '', country: '', from: '', to: '' },
      { employer: '', occupation: '', street: '', unitType: '', unitNumber: '', city: '', state: '', zip: '', province: '', postal: '', country: '', from: '', to: '' },
    ],

    parents: [
      { lastName: '', firstName: '', middleName: '', dob: '', sex: '', countryBirth: '', residenceCity: '', residenceCountry: '', cityBirth: '', currentCityCountry: '' },
      { lastName: '', firstName: '', middleName: '', dob: '', sex: '', countryBirth: '', residenceCity: '', residenceCountry: '', cityBirth: '', currentCityCountry: '' },
    ],
  },

  contact: { daytimePhone: '', mobile: '', email: '' },
  interpreter: { lastName: '', firstName: '', business: '', phone: '', email: '', signDate: '' },
  preparer: { isAttorney: '', lastName: '', firstName: '', business: '', phone: '', email: '', signDate: '' },

  // Direct PDF field overrides (advanced / completeness)
  // Keys are PDF field names (including dots), values are strings or booleans.
  pdf: {},

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

  // PDF field overrides (keys can include dots, so we do NOT use setPath for these)
  const setPdfField = (pdfName, value) => {
    setForm(prev => {
      const next = deepClone(prev);
      next.pdf = next.pdf && typeof next.pdf === 'object' ? next.pdf : {};

      // For text-ish values, drop empty strings to keep the payload smaller.
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
          delete next.pdf[pdfName];
          return next;
        }
        next.pdf[pdfName] = trimmed;
        return next;
      }

      // For booleans (checkboxes), keep explicit false so users can clear a previously-checked box.
      if (typeof value === 'boolean') {
        next.pdf[pdfName] = value;
        return next;
      }

      if (value === null || value === undefined) {
        delete next.pdf[pdfName];
        return next;
      }

      next.pdf[pdfName] = value;
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

          // Ensure Employment + Parents sections always render two entries (and include any newer fields)
          const empT = EMPTY.beneficiary.employment[0];
          merged.beneficiary.employment = ensureArrayLen(merged.beneficiary.employment, 2, () => deepClone(empT))
            .map((job) => ({ ...deepClone(empT), ...(job || {}) }));

          const parT = EMPTY.beneficiary.parents[0];
          merged.beneficiary.parents = ensureArrayLen(merged.beneficiary.parents, 2, () => deepClone(parT))
            .map((p) => {
              const base = { ...deepClone(parT), ...(p || {}) };
              // Migration: split "currentCityCountry" into residence fields if needed
              if ((!base.residenceCity || !base.residenceCountry) && base.currentCityCountry && base.currentCityCountry.includes(',')) {
                const [city, ...rest] = base.currentCityCountry.split(',');
                const country = rest.join(',').trim();
                base.residenceCity = base.residenceCity || city.trim();
                base.residenceCountry = base.residenceCountry || country;
              }
              return base;
            });
          merged.contact = { ...EMPTY.contact, ...(j.data.contact || {}) };
          merged.interpreter = { ...EMPTY.interpreter, ...(j.data.interpreter || {}) };
          merged.preparer = { ...EMPTY.preparer, ...(j.data.preparer || {}) };
          merged.additionalInfo = j.data.additionalInfo || '';
          merged.pdf = { ...(j.data.pdf || {}) };
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
      case 'pdf_all': return <PdfAllFields form={form} setPdfField={setPdfField} />;
      case 'review': return <Review form={form} onSave={save} busy={busy} />;
      default: return null;
    }
  }, [active, form]);

  return (
    <div className="i129f-wizard" style={{display:'grid', gap:14}}>
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
        <div className="small" style={{opacity:.85}}>
          {msg}
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:12}}>
        {content}
      </div>

      <div className="i129f-save-dock" aria-live="polite">
        {msg ? <div className="i129f-save-toast">{msg}</div> : null}
        <button type="button" className="btn primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

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
      className="date-sm"
      value={toIso(value)}
      onChange={(e) => onChange(fromIso(e.target.value))}
    />
  );
}

function ensureArrayLen(arr, minLen, factory) {
  const a = Array.isArray(arr) ? arr : [];
  if (a.length >= minLen) return a;
  const out = a.slice();
  while (out.length < minLen) out.push(factory());
  return out;
}

function YesNoSelect({ value, onChange, placeholder = '— Select —' }) {
  const raw = (value ?? '').toString().trim();
  const v = raw.toLowerCase();
  const normalized =
    v === 'y' || v === 'yes' || v === 'true' ? 'yes'
    : v === 'n' || v === 'no' || v === 'false' ? 'no'
    : raw;

  return (
    <select value={normalized} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

function RaceSelect({ value, onChange }) {
  const raw = (value ?? '').toString().trim();
  const v = raw.toLowerCase();
  const normalized = ['white','asian','black','nhopi'].includes(v) ? v : raw;

  return (
    <select value={normalized} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Select —</option>
      <option value="white">White</option>
      <option value="asian">Asian</option>
      <option value="black">Black or African American</option>
      <option value="nhopi">Native Hawaiian or Other Pacific Islander</option>
    </select>
  );
}

/** =========================
 *  Part 1 — Identity
 *  ========================= */
function Part1Identity({ form, update, add, remove }) {
  const P = form.petitioner || {};
  const other = Array.isArray(P.otherNamesUsed) ? P.otherNamesUsed : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Information About You (Petitioner)</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family Name (Last Name)">
            <input value={P.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First Name)">
            <input value={P.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={P.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="A-Number (if any)">
            <input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} />
          </Field>
          <Field label="SSN (if any)">
            <input value={P.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <DateInput value={P.dob||''} onChange={v=>update('petitioner.dob', v)} />
          </Field>
          <Field label="Sex">
            <select value={P.sex||''} onChange={e=>update('petitioner.sex', e.target.value)}>
              <option value="">(select)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="City/Town/Village of Birth">
            <input value={P.cityBirth||''} onChange={e=>update('petitioner.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={P.countryBirth||''} onChange={e=>update('petitioner.countryBirth', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Classification requested for the beneficiary</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Classification">
            <select value={P.classification||'k1'} onChange={e=>update('petitioner.classification', e.target.value)}>
              <option value="k1">K-1 (Fiancé(e))</option>
              <option value="k3">K-3 (Spouse)</option>
            </select>
          </Field>
          <Field label="If K-3: Filed Form I-130?">
            <select value={P.filedI130||''} onChange={e=>update('petitioner.filedI130', e.target.value)}>
              <option value="">(select)</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Other names used (if any)</strong></div>

        {other.map((o, idx) => (
          <div key={idx} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
            <Field label="Last Name">
              <input value={o.lastName||''} onChange={e=>update(`petitioner.otherNamesUsed.${idx}.lastName`, e.target.value)} />
            </Field>
            <Field label="First Name">
              <input value={o.firstName||''} onChange={e=>update(`petitioner.otherNamesUsed.${idx}.firstName`, e.target.value)} />
            </Field>
            <Field label="Middle Name">
              <input value={o.middleName||''} onChange={e=>update(`petitioner.otherNamesUsed.${idx}.middleName`, e.target.value)} />
            </Field>
            <button type="button" className="btn" onClick={()=>remove('petitioner.otherNamesUsed', idx)} disabled={other.length<=1}>
              Remove
            </button>
          </div>
        ))}

        <div>
          <button type="button" className="btn" onClick={()=>add('petitioner.otherNamesUsed', ()=>({lastName:'', firstName:'', middleName:''}))}>
            Add another
          </button>
        </div>
      </div>
    </section>
  );
}

/** =========================
 *  Part 1 — Addresses
 *  ========================= */
function Part1Addresses({ form, update, add, remove }) {
  const P = form.petitioner || {};
  const M = P.mailing || {};
  const phys = Array.isArray(P.physicalAddresses) ? P.physicalAddresses : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Addresses</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In Care Of (if any)">
            <input value={M.inCareOf||''} onChange={e=>update('petitioner.mailing.inCareOf', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Street Number and Name">
            <input value={M.street||''} onChange={e=>update('petitioner.mailing.street', e.target.value)} />
          </Field>

          <Field label="Apt/Ste/Flr + Number">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <select value={M.unitType||''} onChange={e=>update('petitioner.mailing.unitType', e.target.value)}>
                <option value="">(none)</option>
                <option value="Apt">Apt</option>
                <option value="Ste">Ste</option>
                <option value="Flr">Flr</option>
              </select>
              <input value={M.unitNumber||''} onChange={e=>update('petitioner.mailing.unitNumber', e.target.value)} placeholder="Number" />
            </div>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="City/Town">
            <input value={M.city||''} onChange={e=>update('petitioner.mailing.city', e.target.value)} />
          </Field>
          <Field label="State">
            <input value={M.state||''} onChange={e=>update('petitioner.mailing.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={M.zip||''} onChange={e=>update('petitioner.mailing.zip', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Province">
            <input value={M.province||''} onChange={e=>update('petitioner.mailing.province', e.target.value)} />
          </Field>
          <Field label="Postal Code">
            <input value={M.postal||''} onChange={e=>update('petitioner.mailing.postal', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={M.country||''} onChange={e=>update('petitioner.mailing.country', e.target.value)} />
          </Field>
        </div>

        <label style={{display:'flex', gap:8, alignItems:'center'}}>
          <input
            type="checkbox"
            checked={!!M.sameAsPhysical}
            onChange={e=>update('petitioner.mailing.sameAsPhysical', e.target.checked)}
          />
          <span className="small">My mailing address is the same as my physical address</span>
        </label>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (2 most recent)</strong></div>

        {phys.map((a, idx) => (
          <div key={idx} style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label={`Address ${idx+1} — Street`}>
                <input value={a.street||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.street`, e.target.value)} />
              </Field>
              <Field label="Apt/Ste/Flr + Number">
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <select value={a.unitType||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.unitType`, e.target.value)}>
                    <option value="">(none)</option>
                    <option value="Apt">Apt</option>
                    <option value="Ste">Ste</option>
                    <option value="Flr">Flr</option>
                  </select>
                  <input value={a.unitNumber||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.unitNumber`, e.target.value)} placeholder="Number" />
                </div>
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="City">
                <input value={a.city||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.city`, e.target.value)} />
              </Field>
              <Field label="State">
                <input value={a.state||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.state`, e.target.value)} />
              </Field>
              <Field label="ZIP">
                <input value={a.zip||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.zip`, e.target.value)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country">
                <input value={a.country||''} onChange={e=>update(`petitioner.physicalAddresses.${idx}.country`, e.target.value)} />
              </Field>
              <Field label="From">
                <DateInput value={a.from||''} onChange={v=>update(`petitioner.physicalAddresses.${idx}.from`, v)} />
              </Field>
              <Field label="To">
                <DateInput value={a.to||''} onChange={v=>update(`petitioner.physicalAddresses.${idx}.to`, v)} />
              </Field>
            </div>

            <div>
              <button type="button" className="btn" onClick={()=>remove('petitioner.physicalAddresses', idx)} disabled={phys.length<=1}>
                Remove address
              </button>
            </div>

            <hr style={{opacity:.2}} />
          </div>
        ))}

        <div>
          <button type="button" className="btn" onClick={()=>add('petitioner.physicalAddresses', ()=>({street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', country:'', from:'', to:''}))}>
            Add another physical address
          </button>
        </div>
      </div>
    </section>
  );
}

/** =========================
 *  Part 1 — Parents
 *  ========================= */
function Part1Parents({ form, update }) {
  const parents = Array.isArray(form?.petitioner?.parents) ? form.petitioner.parents : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Parents</h3>

      {parents.map((p, idx) => (
        <div key={idx} className="card" style={{display:'grid', gap:10}}>
          <div className="small"><strong>Parent {idx+1}</strong></div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Last Name">
              <input value={p.lastName||''} onChange={e=>update(`petitioner.parents.${idx}.lastName`, e.target.value)} />
            </Field>
            <Field label="First Name">
              <input value={p.firstName||''} onChange={e=>update(`petitioner.parents.${idx}.firstName`, e.target.value)} />
            </Field>
            <Field label="Middle Name">
              <input value={p.middleName||''} onChange={e=>update(`petitioner.parents.${idx}.middleName`, e.target.value)} />
            </Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Date of Birth">
              <DateInput value={p.dob||''} onChange={v=>update(`petitioner.parents.${idx}.dob`, v)} />
            </Field>
            <Field label="Sex">
              <select value={p.sex||''} onChange={e=>update(`petitioner.parents.${idx}.sex`, e.target.value)}>
                <option value="">(select)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Alive?">
              <select value={p.alive||'yes'} onChange={e=>update(`petitioner.parents.${idx}.alive`, e.target.value)}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="City/Town/Village of Birth">
              <input value={p.cityBirth||''} onChange={e=>update(`petitioner.parents.${idx}.cityBirth`, e.target.value)} />
            </Field>
            <Field label="Country of Birth">
              <input value={p.countryBirth||''} onChange={e=>update(`petitioner.parents.${idx}.countryBirth`, e.target.value)} />
            </Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="Current City/Country of Residence">
              <input value={p.currentCityCountry||''} onChange={e=>update(`petitioner.parents.${idx}.currentCityCountry`, e.target.value)} />
            </Field>
            <Field label="If deceased: date of death">
              <DateInput value={p.deathDate||''} onChange={v=>update(`petitioner.parents.${idx}.deathDate`, v)} />
            </Field>
          </div>
        </div>
      ))}
    </section>
  );
}

/** =========================
 *  Part 2 — Beneficiary
 *  ========================= */
function Part2Identity({ form, update, add, remove }) {
  const B = form.beneficiary || {};
  const other = Array.isArray(B.otherNames) ? B.otherNames : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Information About Your Beneficiary</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family Name (Last Name)">
            <input value={B.lastName||''} onChange={e=>update('beneficiary.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First Name)">
            <input value={B.firstName||''} onChange={e=>update('beneficiary.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={B.middleName||''} onChange={e=>update('beneficiary.middleName', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="A-Number (if any)">
            <input value={B.aNumber||''} onChange={e=>update('beneficiary.aNumber', e.target.value)} />
          </Field>
          <Field label="SSN (if any)">
            <input value={B.ssn||''} onChange={e=>update('beneficiary.ssn', e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <DateInput value={B.dob||''} onChange={v=>update('beneficiary.dob', v)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="City/Town/Village of Birth">
            <input value={B.cityBirth||''} onChange={e=>update('beneficiary.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={B.countryBirth||''} onChange={e=>update('beneficiary.countryBirth', e.target.value)} />
          </Field>
          <Field label="Country of Citizenship/Nationality">
            <input value={B.nationality||''} onChange={e=>update('beneficiary.nationality', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Biographic Information</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Ethnicity — Hispanic or Latino?">
            <YesNoSelect value={B.ethnicityHispanic||''} onChange={v=>update('beneficiary.ethnicityHispanic', v)} />
          </Field>
          <Field label="Race">
            <RaceSelect value={B.race||''} onChange={v=>update('beneficiary.race', v)} />
          </Field>
          <Field label="Height (Feet)">
            <input className="measure-sm" type="number" min="0" max="8" value={B.heightFeet||''} onChange={e=>update('beneficiary.heightFeet', e.target.value)} />
          </Field>
          <Field label="Height (Inches)">
            <input className="measure-sm" type="number" min="0" max="11" value={B.heightInches||''} onChange={e=>update('beneficiary.heightInches', e.target.value)} />
          </Field>

          <Field label="Weight (lbs)">
            <input className="measure-sm" type="number" min="0" value={B.weight||''} onChange={e=>update('beneficiary.weight', e.target.value)} />
          </Field>

          <Field label="Eye Color">
            <select value={B.eyeColor||''} onChange={e=>update('beneficiary.eyeColor', e.target.value)}>
              <option value="">(select)</option>
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
              <option value="">(select)</option>
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
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Other names used (if any)</strong></div>

        {other.map((o, idx) => (
          <div key={idx} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
            <Field label="Last Name">
              <input value={o.lastName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.lastName`, e.target.value)} />
            </Field>
            <Field label="First Name">
              <input value={o.firstName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.firstName`, e.target.value)} />
            </Field>
            <Field label="Middle Name">
              <input value={o.middleName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.middleName`, e.target.value)} />
            </Field>
            <button type="button" className="btn" onClick={()=>remove('beneficiary.otherNames', idx)} disabled={other.length<=1}>
              Remove
            </button>
          </div>
        ))}

        <div>
          <button type="button" className="btn" onClick={()=>add('beneficiary.otherNames', ()=>({lastName:'', firstName:'', middleName:''}))}>
            Add another
          </button>
        </div>
      </div>
    </section>
  );
}

/** =========================
 *  Part 2 — Beneficiary Addresses
 *  ========================= */
function Part2Addresses({ form, update }) {
  const B = form.beneficiary || {};
  const M = B.mailing || {};
  const phys = Array.isArray(B.physicalAddresses) ? B.physicalAddresses : [];

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Addresses</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In Care Of (if any)">
            <input value={M.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Street Number and Name">
            <input value={M.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} />
          </Field>

          <Field label="Apt/Ste/Flr + Number">
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <select value={M.unitType||''} onChange={e=>update('beneficiary.mailing.unitType', e.target.value)}>
                <option value="">(none)</option>
                <option value="Apt">Apt</option>
                <option value="Ste">Ste</option>
                <option value="Flr">Flr</option>
              </select>
              <input value={M.unitNumber||''} onChange={e=>update('beneficiary.mailing.unitNumber', e.target.value)} placeholder="Number" />
            </div>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="City/Town">
            <input value={M.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} />
          </Field>
          <Field label="State">
            <input value={M.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={M.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(1,1fr)', gap:10}}>
          <Field label="Country">
            <input value={M.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (2 most recent)</strong></div>

        {phys.map((a, idx) => (
          <div key={idx} style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label={`Address ${idx+1} — Street`}>
                <input value={a.street||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.street`, e.target.value)} />
              </Field>
              <Field label="Apt/Ste/Flr + Number">
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  <select value={a.unitType||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.unitType`, e.target.value)}>
                    <option value="">(none)</option>
                    <option value="Apt">Apt</option>
                    <option value="Ste">Ste</option>
                    <option value="Flr">Flr</option>
                  </select>
                  <input value={a.unitNumber||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.unitNumber`, e.target.value)} placeholder="Number" />
                </div>
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="City">
                <input value={a.city||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.city`, e.target.value)} />
              </Field>
              <Field label="State">
                <input value={a.state||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.state`, e.target.value)} />
              </Field>
              <Field label="ZIP">
                <input value={a.zip||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.zip`, e.target.value)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country">
                <input value={a.country||''} onChange={e=>update(`beneficiary.physicalAddresses.${idx}.country`, e.target.value)} />
              </Field>
              <Field label="From">
                <DateInput value={a.from||''} onChange={v=>update(`beneficiary.physicalAddresses.${idx}.from`, v)} />
              </Field>
              <Field label="To">
                <DateInput value={a.to||''} onChange={v=>update(`beneficiary.physicalAddresses.${idx}.to`, v)} />
              </Field>
            </div>

            <hr style={{opacity:.2}} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** =========================
 *  Part 2 — Employment
 *  ========================= */
function Part2Employment({ form, update }) {
  const jobs = ensureArrayLen(form?.beneficiary?.employment, 2, () => deepClone(EMPTY.beneficiary.employment[0]));
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Employment</h3>
      <p className="hint">Enter up to 2 most recent employers.</p>

      {jobs.map((job, idx)=>(
        <section key={idx} className="card" style={{display:'grid', gap:10}}>
          <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'baseline'}}>
            <strong>Employer #{idx+1}</strong>
            <span className="small muted">Most recent first</span>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="Name of Employer">
              <input value={job.employer||''} onChange={e=>update(`beneficiary.employment.${idx}.employer`, e.target.value)} />
            </Field>
            <Field label="Occupation">
              <input value={job.occupation||''} onChange={e=>update(`beneficiary.employment.${idx}.occupation`, e.target.value)} />
            </Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="Street Number and Name">
              <input value={job.street||''} onChange={e=>update(`beneficiary.employment.${idx}.street`, e.target.value)} />
            </Field>
            <Field label="Apt/Ste/Flr + Number">
              <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:8}}>
                <select value={job.unitType||''} onChange={e=>update(`beneficiary.employment.${idx}.unitType`, e.target.value)}>
                  <option value="">(none)</option>
                  <option value="apt">Apt</option>
                  <option value="ste">Ste</option>
                  <option value="flr">Flr</option>
                </select>
                <input value={job.unitNumber||''} onChange={e=>update(`beneficiary.employment.${idx}.unitNumber`, e.target.value)} />
              </div>
            </Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="City"><input value={job.city||''} onChange={e=>update(`beneficiary.employment.${idx}.city`, e.target.value)} /></Field>
            <Field label="State"><input value={job.state||''} onChange={e=>update(`beneficiary.employment.${idx}.state`, e.target.value)} /></Field>
            <Field label="ZIP"><input value={job.zip||''} onChange={e=>update(`beneficiary.employment.${idx}.zip`, e.target.value)} /></Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Province"><input value={job.province||''} onChange={e=>update(`beneficiary.employment.${idx}.province`, e.target.value)} /></Field>
            <Field label="Postal Code"><input value={job.postal||''} onChange={e=>update(`beneficiary.employment.${idx}.postal`, e.target.value)} /></Field>
            <Field label="Country"><input value={job.country||''} onChange={e=>update(`beneficiary.employment.${idx}.country`, e.target.value)} /></Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="From (MM/DD/YYYY)"><DateInput value={job.from||''} onChange={v=>update(`beneficiary.employment.${idx}.from`, v)} /></Field>
            <Field label="To (MM/DD/YYYY)"><DateInput value={job.to||''} onChange={v=>update(`beneficiary.employment.${idx}.to`, v)} /></Field>
          </div>
        </section>
      ))}
    </section>
  );
}


/** =========================
 *  Part 2 — Beneficiary Parents
 *  ========================= */
function Part2Parents({ form, update }) {
  const parents = ensureArrayLen(form?.beneficiary?.parents, 2, () => deepClone(EMPTY.beneficiary.parents[0]));
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary Parents</h3>
      <p className="hint">Enter Parent 1 and Parent 2.</p>

      {parents.map((p, idx)=>(
        <section key={idx} className="card" style={{display:'grid', gap:10}}>
          <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'baseline'}}>
            <strong>Parent #{idx+1}</strong>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Last Name"><input value={p.lastName||''} onChange={e=>update(`beneficiary.parents.${idx}.lastName`, e.target.value)} /></Field>
            <Field label="First Name"><input value={p.firstName||''} onChange={e=>update(`beneficiary.parents.${idx}.firstName`, e.target.value)} /></Field>
            <Field label="Middle Name"><input value={p.middleName||''} onChange={e=>update(`beneficiary.parents.${idx}.middleName`, e.target.value)} /></Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            <Field label="Date of Birth (MM/DD/YYYY)"><DateInput value={p.dob||''} onChange={v=>update(`beneficiary.parents.${idx}.dob`, v)} /></Field>
            <Field label="Sex">
              <select value={p.sex||''} onChange={e=>update(`beneficiary.parents.${idx}.sex`, e.target.value)}>
                <option value="">(select)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Country of Birth"><input value={p.countryBirth||''} onChange={e=>update(`beneficiary.parents.${idx}.countryBirth`, e.target.value)} /></Field>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
            <Field label="City/Town/Village of Residence"><input value={p.residenceCity||''} onChange={e=>update(`beneficiary.parents.${idx}.residenceCity`, e.target.value)} /></Field>
            <Field label="Country of Residence"><input value={p.residenceCountry||''} onChange={e=>update(`beneficiary.parents.${idx}.residenceCountry`, e.target.value)} /></Field>
          </div>
        </section>
      ))}
    </section>
  );
}


/** =========================
 *  Part 3 — Criminal
 *  ========================= */
function Part3Criminal({ form, update }) {
  const C = form?.petitioner?.criminal || {};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 3 — Criminal Information</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Have you ever been issued a restraining/protection order?">
            <YesNoSelect value={C.restrainingOrder||''} onChange={v=>update('petitioner.criminal.restrainingOrder', v)} />
          </Field>

          <Field label="Have you ever been arrested/convicted for any of the offenses? (2a)">
            <YesNoSelect value={C.arrestedOrConvicted2a||''} onChange={v=>update('petitioner.criminal.arrestedOrConvicted2a', v)} />
          </Field>

          <Field label="Arrested/convicted (2b)">
            <YesNoSelect value={C.arrestedOrConvicted2b||''} onChange={v=>update('petitioner.criminal.arrestedOrConvicted2b', v)} />
          </Field>

          <Field label="Arrested/convicted (2c)">
            <YesNoSelect value={C.arrestedOrConvicted2c||''} onChange={v=>update('petitioner.criminal.arrestedOrConvicted2c', v)} />
          </Field>
        </div>

        <div className="small"><strong>If you answered “Yes”, check applicable reasons</strong></div>
        <label style={{display:'flex', gap:8, alignItems:'center'}}>
          <input type="checkbox" checked={!!C.reasonSelfDefense} onChange={e=>update('petitioner.criminal.reasonSelfDefense', e.target.checked)} />
          <span className="small">Self defense</span>
        </label>
        <label style={{display:'flex', gap:8, alignItems:'center'}}>
          <input type="checkbox" checked={!!C.reasonViolatedProtectionOrder} onChange={e=>update('petitioner.criminal.reasonViolatedProtectionOrder', e.target.checked)} />
          <span className="small">Violating a protection order</span>
        </label>
        <label style={{display:'flex', gap:8, alignItems:'center'}}>
          <input type="checkbox" checked={!!C.reasonBatteredCruelty} onChange={e=>update('petitioner.criminal.reasonBatteredCruelty', e.target.checked)} />
          <span className="small">Battering / extreme cruelty</span>
        </label>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Ever arrested/cited/charged?">
            <YesNoSelect value={C.everArrestedCitedCharged||''} onChange={v=>update('petitioner.criminal.everArrestedCitedCharged', v)} />
          </Field>
          <Field label="Waiver type (if any)">
            <input value={C.waiverType||''} onChange={e=>update('petitioner.criminal.waiverType', e.target.value)} />
          </Field>
        </div>

        <Field label="Details (if any)">
          <textarea rows={6} value={C.everArrestedDetails||''} onChange={e=>update('petitioner.criminal.everArrestedDetails', e.target.value)} />
        </Field>
      </div>
    </section>
  );
}

/** =========================
 *  Part 4 — Other
 *  ========================= */
function Part4Other({ form, update }) {
  const B = form?.beneficiary || {};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 4 — Other Information</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="In the U.S. now?">
            <YesNoSelect value={B.inUS||''} onChange={v=>update('beneficiary.inUS', v)} />
          </Field>
          <Field label="I-94 Number (if any)">
            <input value={B.i94||''} onChange={e=>update('beneficiary.i94', e.target.value)} />
          </Field>
          <Field label="Class of Admission (if any)">
            <input value={B.classOfAdmission||''} onChange={e=>update('beneficiary.classOfAdmission', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of Arrival (if any)">
            <DateInput value={B.arrivalDate||''} onChange={v=>update('beneficiary.arrivalDate', v)} />
          </Field>
          <Field label="Status Expires (if any)">
            <DateInput value={B.statusExpires||''} onChange={v=>update('beneficiary.statusExpires', v)} />
          </Field>
          <Field label="Passport Expiration">
            <DateInput value={B.passportExpiration||''} onChange={v=>update('beneficiary.passportExpiration', v)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Passport Number">
            <input value={B.passportNumber||''} onChange={e=>update('beneficiary.passportNumber', e.target.value)} />
          </Field>
          <Field label="Travel Document Number">
            <input value={B.travelDocNumber||''} onChange={e=>update('beneficiary.travelDocNumber', e.target.value)} />
          </Field>
          <Field label="Passport Country">
            <input value={B.passportCountry||''} onChange={e=>update('beneficiary.passportCountry', e.target.value)} />
          </Field>
        </div>
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
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Last name"><input value={I.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} /></Field>
          <Field label="First name"><input value={I.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} /></Field>
          <Field label="Business/Org"><input value={I.business||''} onChange={e=>update('interpreter.business', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Phone"><input value={I.phone||''} onChange={e=>update('interpreter.phone', e.target.value)} /></Field>
          <Field label="Email"><input value={I.email||''} onChange={e=>update('interpreter.email', e.target.value)} /></Field>
          <Field label="Sign date"><DateInput value={I.signDate||''} onChange={v=>update('interpreter.signDate', v)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Preparer</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Is attorney/rep?"><YesNoSelect value={P.isAttorney||''} onChange={v=>update('preparer.isAttorney', v)} /></Field>
          <Field label="Last name"><input value={P.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} /></Field>
          <Field label="First name"><input value={P.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} /></Field>
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

/** ALL PDF FIELDS (ADVANCED) **/

function prettyPdfLabel(name) {
  const s = String(name || '');
  return s
    .replace(/_page\d+\b/gi, '')
    .replace(/\bpage\d+\b/gi, '')
    .replace(/_Num_?/g, ' ')
    .replace(/_Checkbox(es)?\b/gi, '')
    .replace(/_Text\b/gi, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyDateField(name) {
  const s = String(name || '').toLowerCase();
  return (
    s.includes('date') ||
    s.includes('dob') ||
    s.includes('birth') && s.includes('date') ||
    s.includes('day') && s.includes('month') && s.includes('year')
  );
}

function PdfAllFields({ form, setPdfField }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [template, setTemplate] = useState('');
  const [fields, setFields] = useState([]);

  const [page, setPage] = useState(1); // 0 = all
  const [query, setQuery] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [onlyUnset, setOnlyUnset] = useState(false);

  const pdfValues = form?.pdf && typeof form.pdf === 'object' ? form.pdf : {};

  useEffect(() => {
    let ignore = false;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch('/api/i129f/fields', { cache: 'no-store' });
        const j = await r.json().catch(() => null);
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'Failed to load PDF fields');
        if (ignore) return;
        setTemplate(j.template || '');
        setFields(Array.isArray(j.fields) ? j.fields : []);
      } catch (e) {
        if (!ignore) setErr(String(e?.message || e));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const pages = useMemo(() => {
    const nums = new Set();
    for (const f of fields) {
      const p = Number(f.page || 0);
      if (p > 0) nums.add(p);
    }
    return Array.from(nums).sort((a, b) => a - b);
  }, [fields]);

  const filtered = useMemo(() => {
    const q = String(query || '').trim().toLowerCase();
    const list = [...fields].sort((a, b) => (a.index || 0) - (b.index || 0));

    return list.filter((f) => {
      const p = Number(f.page || 0);
      if (page > 0 && p !== page) return false;

      if (onlyUnset) {
        const v = pdfValues?.[f.name];
        if (v !== undefined) return false;
      }

      if (!q) return true;
      const label = prettyPdfLabel(f.name).toLowerCase();
      return f.name.toLowerCase().includes(q) || label.includes(q);
    });
  }, [fields, page, query, onlyUnset, pdfValues]);

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      <h3 style={{ margin: 0 }}>All PDF Fields</h3>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Use this section to fill any remaining fields that aren't in the guided steps.</strong><br />
          These values are saved and written directly into the PDF by field name, so you can reach 100% coverage.
          {template ? <><br />Template: <span style={{opacity: .9}}>{template}</span></> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'end' }}>
          <Field label="Search (by label or PDF name)">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g., Beneficiary passport, page9, City, etc." />
          </Field>

          <Field label="Page filter">
            <select value={String(page)} onChange={(e) => setPage(Number(e.target.value))}>
              <option value="0">All pages</option>
              {pages.map((p) => (
                <option key={p} value={String(p)}>Page {p}</option>
              ))}
            </select>
          </Field>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
            <input type="checkbox" checked={showKeys} onChange={(e) => setShowKeys(e.target.checked)} />
            <span className="small">Show PDF field names</span>
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 6 }}>
            <input type="checkbox" checked={onlyUnset} onChange={(e) => setOnlyUnset(e.target.checked)} />
            <span className="small">Only show unset</span>
          </label>
        </div>

        {pages.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`btn ${page === 0 ? 'primary' : ''}`} onClick={() => setPage(0)}>
              All
            </button>
            {pages.map((p) => (
              <button key={p} type="button" className={`btn ${page === p ? 'primary' : ''}`} onClick={() => setPage(p)}>
                Page {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="card">Loading PDF fields…</div>}
      {err && <div className="card" style={{ color: '#b91c1c' }}>{err}</div>}

      {!loading && !err && (
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <div className="small">
            Showing <strong>{filtered.length}</strong> fields.
          </div>

          <div className="grid-2">
            {filtered.map((f) => {
              const name = f.name;
              const kind = f.kind || 'text';
              const opts = Array.isArray(f.options) ? f.options : [];
              const val = pdfValues?.[name];

              const label = (
                <div style={{ display: 'grid', gap: 2 }}>
                  <div>{prettyPdfLabel(name)}</div>
                  {showKeys && <div className="small" style={{ opacity: 0.75, fontSize: 12 }}>{name}</div>}
                </div>
              );

              // Checkbox
              if (kind === 'checkbox') {
                return (
                  <div key={name} style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => setPdfField(name, e.target.checked)}
                      />
                      <div className="small" style={{ opacity: 0.95 }}>{label}</div>
                    </label>
                  </div>
                );
              }

              // Radio/Dropdown
              if (kind === 'radio' || kind === 'dropdown') {
                return (
                  <div key={name} style={{ gridColumn: '1 / -1' }}>
                    <Field label={label}>
                      <select value={val ?? ''} onChange={(e) => setPdfField(name, e.target.value)}>
                        <option value="">(select)</option>
                        {opts.map((o) => (
                          <option key={o} value={o}>{prettyPdfLabel(o)}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                );
              }

              // Text (dates get a calendar widget)
              if (isLikelyDateField(name)) {
                return (
                  <Field key={name} label={label}>
                    <DateInput value={val ?? ''} onChange={(v) => setPdfField(name, v)} />
                  </Field>
                );
              }

              return (
                <Field key={name} label={label}>
                  <input value={val ?? ''} onChange={(e) => setPdfField(name, e.target.value)} />
                </Field>
              );
            })}
          </div>

          <div className="small">
            Tip: if a field doesn't seem to fill, it may be a radio/checkbox group. Use the dropdown options provided here (they match the PDF's export values).
          </div>
        </div>
      )}
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

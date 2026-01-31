'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * I-129F Wizard (liason.org)
 * - Single-file, copy/paste ready
 * - Uses your existing /api/i129f/save, /api/i129f/load endpoints
 * - Race & Ethnicity are single select in the wizard; mapping checks only one PDF box
 */

const SECTIONS = [
  { key: 'p1_ident', label: 'Part 1 — Petitioner Identity' },
  { key: 'p1_addr', label: 'Part 1 — Petitioner Address History' },
  { key: 'p1_emp', label: 'Part 1 — Petitioner Employment' },
  { key: 'p1_par', label: 'Part 1 — Petitioner Parents & Citizenship' },

  { key: 'p2_ident', label: 'Part 2 — Beneficiary Identity' },
  { key: 'p2_addr', label: 'Part 2 — Beneficiary Address History' },
  { key: 'p2_emp', label: 'Part 2 — Beneficiary Employment' },
  { key: 'p2_par', label: 'Part 2 — Beneficiary Parents' },
  { key: 'p3_crim', label: 'Part 3 — Other Info (Criminal)' },

  { key: 'p5_7', label: 'Parts 5–7 — Contact / Interpreter / Preparer' },
  { key: 'p8', label: 'Part 8 — Additional Information' },
  { key: 'review', label: 'Review & Download' },
];

const EMPTY = {
  petitioner: {
    aNumber: '',
    uscisAccount: '',
    ssn: '',
    lastName: '',
    firstName: '',
    middleName: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],

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
    },

    addresses: [
      { from: '', to: '', street: '', city: '', state: '', zip: '', country: '' },
      { from: '', to: '', street: '', city: '', state: '', zip: '', country: '' },
    ],

    dob: '',
    sex: '',
    maritalStatus: '',
    cityBirth: '',
    countryBirth: '',

    citizenship: { how: 'birth', natzCertificate: '', natzPlace: '', natzDate: '' },
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
    aNumber: '',
    ssn: '',
    lastName: '',
    firstName: '',
    middleName: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],
    dob: '',
    cityBirth: '',
    countryBirth: '',
    sex: '',
    maritalStatus: '',
    filingFromOutsideUS: '',

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
    },

    addresses: [
      { from: '', to: '', street: '', city: '', state: '', zip: '', country: '' },
      { from: '', to: '', street: '', city: '', state: '', zip: '', country: '' },
    ],

    employment: {
      employerName: '',
      occupation: '',
      street: '',
      unitType: '',
      unitNumber: '',
      city: '',
      state: '',
      zip: '',
      province: '',
      postal: '',
      country: '',
    },

    parents: {
      p1Last: '', p1First: '', p1Middle: '', p1Dob: '', p1Sex: '', p1CityBirth: '', p1CountryBirth: '',
      p2Last: '', p2First: '', p2Middle: '', p2Dob: '', p2Sex: '', p2CityBirth: '', p2CountryBirth: '',
    },

    nationality: '',

    ethnicityHispanic: '', // yes/no
    race: '',
    heightFeet: '',
    heightInches: '',
    eyeColor: '',
    hairColor: '',
  },

  contact: {
    petitionerDayPhone: '',
    petitionerMobile: '',
    petitionerEmail: '',
  },

  interpreter: {
    lastName: '',
    firstName: '',
    business: '',
    street: '',
    unitType: '',
    unitNumber: '',
    city: '',
    state: '',
    zip: '',
    province: '',
    postal: '',
    country: '',
    dayPhone: '',
    mobile: '',
    email: '',
    language: '',
  },

  preparer: {
    isAttorney: '',
    lastName: '',
    firstName: '',
    business: '',
    street: '',
    unitType: '',
    unitNumber: '',
    city: '',
    state: '',
    zip: '',
    province: '',
    postal: '',
    country: '',
    dayPhone: '',
    mobile: '',
    email: '',
    barNumber: '',
    stateBar: '',
  },

  additionalInfo: '',
};

function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function getByPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const k of parts) {
    if (!cur) return undefined;
    cur = cur[k];
  }
  return cur;
}

function mergeDefaults(defaults, incoming) {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(incoming)) return deepClone(defaults);
    const out = [];
    const max = Math.max(defaults.length, incoming.length);
    for (let i = 0; i < max; i++) {
      if (defaults[i] === undefined) out[i] = deepClone(incoming[i]);
      else if (incoming[i] === undefined) out[i] = deepClone(defaults[i]);
      else out[i] = mergeDefaults(defaults[i], incoming[i]);
    }
    return out;
  }
  if (defaults && typeof defaults === 'object') {
    const out = {};
    const keys = new Set([...Object.keys(defaults), ...(incoming ? Object.keys(incoming) : [])]);
    for (const k of keys) {
      if (incoming && Object.prototype.hasOwnProperty.call(incoming, k)) {
        out[k] = mergeDefaults(defaults[k], incoming[k]);
      } else {
        out[k] = deepClone(defaults[k]);
      }
    }
    return out;
  }
  return incoming !== undefined ? incoming : defaults;
}

function extractSaved(json) {
  if (!json || typeof json !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(json, 'ok') && json.ok === false) return null;
  if (json.ok === true && json.data && typeof json.data === 'object') return json.data;
  if (json.data && typeof json.data === 'object') return json.data;
  if (json.saved && typeof json.saved === 'object') return json.saved;
  if (json.i129f && typeof json.i129f === 'object') return json.i129f;
  if (json.form && typeof json.form === 'object') return json.form;
  return json;
}

export default function I129fWizard() {
  const [form, setForm] = useState(() => deepClone(EMPTY));
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Load saved data if present
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json().catch(() => null);
        const saved = extractSaved(j);
        if (saved) {
          setForm(mergeDefaults(EMPTY, saved));
        }
      } catch {}
    })();
  }, []);

  const Tabs = useMemo(() => {
    return (
      <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:12}}>
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={'tab ' + (i===step ? 'active' : '')}
            onClick={() => setStep(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
    );
  }, [step]);

  function update(path, value) {
    setForm(prev => {
      const next = deepClone(prev);
      setByPath(next, path, value);
      return next;
    });
  }

  function add(path, item) {
    setForm(prev => {
      const next = deepClone(prev);
      const arr = getByPath(next, path);
      if (Array.isArray(arr)) arr.push(item);
      return next;
    });
  }

  function remove(path, idx) {
    setForm(prev => {
      const next = deepClone(prev);
      const arr = getByPath(next, path);
      if (Array.isArray(arr)) arr.splice(idx, 1);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setSaveMsg(null);
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) {
        setSaveMsg({ type: 'err', text: (j && (j.error || j.message)) || `Save failed (${r.status})` });
      } else {
        setSaveMsg({ type: 'ok', text: 'Your I-129F data has been saved.' });
      }
    } catch (e) {
      setSaveMsg({ type: 'err', text: e?.message || 'Save failed.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <WizardCtx.Provider value={{ form, update, add, remove }}>
      <div className="wizard">
        <div className="header">
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
        {step===8 && <Part3Criminal form={form} update={update} />}
        {step===9 && <Parts5to7 form={form} update={update} />}
        {step===10 && <Part8Additional form={form} update={update} />}
        {step===11 && <Review form={form} onSave={save} busy={busy} />}
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
      onChange={(e) => {
        const v = e.target.value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
          const [y, m, d] = v.split('-');
          onChange(`${m}/${d}/${y}`);
        } else {
          onChange(v);
        }
      }}
    />
  );
}

/* ---------- Sections ---------- */
function Part1Identity({ form, update, add, remove }) {
  const P = form.petitioner;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card">
        <div className="small"><strong>Petitioner (Page 1)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
          <Field label="A-Number">
            <input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} />
          </Field>
          <Field label="USCIS Online Account Number">
            <input value={P.uscisAccount||''} onChange={e=>update('petitioner.uscisAccount', e.target.value)} />
          </Field>
          <Field label="Social Security Number">
            <input value={P.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
          <Field label="Family Name (Last)">
            <input value={P.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First)">
            <input value={P.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={P.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="small"><strong>Other Names Used (Page 1)</strong></div>

        {P.otherNames.map((n, idx) => (
          <div key={idx} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, marginTop:10}}>
            <Field label="Family Name (Last)">
              <input
                value={n.lastName||''}
                onChange={e=>update(`petitioner.otherNames.${idx}.lastName`, e.target.value)}
              />
            </Field>
            <Field label="Given Name (First)">
              <input
                value={n.firstName||''}
                onChange={e=>update(`petitioner.otherNames.${idx}.firstName`, e.target.value)}
              />
            </Field>
            <Field label="Middle Name">
              <input
                value={n.middleName||''}
                onChange={e=>update(`petitioner.otherNames.${idx}.middleName`, e.target.value)}
              />
            </Field>
            <div style={{display:'flex', alignItems:'end'}}>
              <button type="button" className="btn" onClick={()=>remove('petitioner.otherNames', idx)} disabled={P.otherNames.length<=1}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{marginTop:10}}>
          <button
            type="button"
            className="btn"
            onClick={()=>add('petitioner.otherNames', { lastName:'', firstName:'', middleName:'' })}
          >
            Add Another Name
          </button>
        </div>
      </div>

      <div className="card">
        <div className="small"><strong>Petitioner DOB, Sex, Marital Status (Page 1–2)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
          <Field label="Date of Birth">
            <DateInput value={P.dob||''} onChange={v=>update('petitioner.dob', v)} />
          </Field>

          <Field label="Sex">
            <select value={P.sex||''} onChange={e=>update('petitioner.sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <Field label="Marital Status">
            <select value={P.maritalStatus||''} onChange={e=>update('petitioner.maritalStatus', e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="annulled">Annulled</option>
            </select>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginTop:10}}>
          <Field label="City/Town/Village of Birth">
            <input value={P.cityBirth||''} onChange={e=>update('petitioner.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={P.countryBirth||''} onChange={e=>update('petitioner.countryBirth', e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Part1Addresses({ form, update, add, remove }) {
  const P = form.petitioner;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Mailing Address (Page 1)</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In Care Of Name">
            <input value={P.mailing.inCareOf||''} onChange={e=>update('petitioner.mailing.inCareOf', e.target.value)} />
          </Field>
          <Field label="Street Number and Name">
            <input value={P.mailing.street||''} onChange={e=>update('petitioner.mailing.street', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Unit Type (Apt/Ste/Flr)">
            <select value={P.mailing.unitType||''} onChange={e=>update('petitioner.mailing.unitType', e.target.value)}>
              <option value="">Select...</option>
              <option value="apt">Apt</option>
              <option value="ste">Ste</option>
              <option value="flr">Flr</option>
            </select>
          </Field>
          <Field label="Unit Number">
            <input value={P.mailing.unitNumber||''} onChange={e=>update('petitioner.mailing.unitNumber', e.target.value)} />
          </Field>
          <Field label="City or Town">
            <input value={P.mailing.city||''} onChange={e=>update('petitioner.mailing.city', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="State">
            <input value={P.mailing.state||''} onChange={e=>update('petitioner.mailing.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={P.mailing.zip||''} onChange={e=>update('petitioner.mailing.zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={P.mailing.country||''} onChange={e=>update('petitioner.mailing.country', e.target.value)} />
          </Field>
        </div>

        <div className="small">If address is outside the U.S., you can use Province / Postal Code fields as needed.</div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Province">
            <input value={P.mailing.province||''} onChange={e=>update('petitioner.mailing.province', e.target.value)} />
          </Field>
          <Field label="Postal Code">
            <input value={P.mailing.postal||''} onChange={e=>update('petitioner.mailing.postal', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (Page 2)</strong></div>
        <div className="small">Enter the last two physical addresses (if applicable).</div>

        {P.addresses.map((a, idx) => (
          <div key={idx} style={{border:'1px solid #eee', borderRadius:12, padding:12, display:'grid', gap:10}}>
            <div className="small"><strong>Address #{idx+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="From (MM/DD/YYYY)">
                <DateInput value={a.from||''} onChange={v=>update(`petitioner.addresses.${idx}.from`, v)} />
              </Field>
              <Field label="To (MM/DD/YYYY)">
                <DateInput value={a.to||''} onChange={v=>update(`petitioner.addresses.${idx}.to`, v)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="Street Number and Name">
                <input value={a.street||''} onChange={e=>update(`petitioner.addresses.${idx}.street`, e.target.value)} />
              </Field>
              <Field label="City or Town">
                <input value={a.city||''} onChange={e=>update(`petitioner.addresses.${idx}.city`, e.target.value)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="State">
                <input value={a.state||''} onChange={e=>update(`petitioner.addresses.${idx}.state`, e.target.value)} />
              </Field>
              <Field label="ZIP Code">
                <input value={a.zip||''} onChange={e=>update(`petitioner.addresses.${idx}.zip`, e.target.value)} />
              </Field>
              <Field label="Country">
                <input value={a.country||''} onChange={e=>update(`petitioner.addresses.${idx}.country`, e.target.value)} />
              </Field>
            </div>
          </div>
        ))}

        <div style={{display:'flex', gap:8}}>
          <button type="button" className="btn" onClick={()=>add('petitioner.addresses', { from:'', to:'', street:'', city:'', state:'', zip:'', country:'' })}>
            Add Address
          </button>
          <button type="button" className="btn" onClick={()=>remove('petitioner.addresses', P.addresses.length-1)} disabled={P.addresses.length<=1}>
            Remove Last
          </button>
        </div>
      </div>
    </div>
  );
}

function Part1Employment({ form, update }) {
  const P = form.petitioner;

  return (
    <div className="card" style={{display:'grid', gap:10}}>
      <div className="small"><strong>Employment (Petitioner)</strong></div>
      <div className="small">If you are unemployed, you can leave employer name blank and list your occupation as "Unemployed".</div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
        <Field label="Occupation">
          <input value={P.occupation||''} onChange={e=>update('petitioner.occupation', e.target.value)} />
        </Field>
        <Field label="Employer Name">
          <input value={P.employerName||''} onChange={e=>update('petitioner.employerName', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
        <Field label="Employer Street Address">
          <input value={P.employerStreet||''} onChange={e=>update('petitioner.employerStreet', e.target.value)} />
        </Field>
        <Field label="City or Town">
          <input value={P.employerCity||''} onChange={e=>update('petitioner.employerCity', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="State">
          <input value={P.employerState||''} onChange={e=>update('petitioner.employerState', e.target.value)} />
        </Field>
        <Field label="ZIP Code">
          <input value={P.employerZip||''} onChange={e=>update('petitioner.employerZip', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={P.employerCountry||''} onChange={e=>update('petitioner.employerCountry', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Part1ParentsNatz({ form, update }) {
  const P = form.petitioner;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parents (Petitioner)</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Parent 1 Last Name">
            <input value={P.parent1Last||''} onChange={e=>update('petitioner.parent1Last', e.target.value)} />
          </Field>
          <Field label="Parent 1 First Name">
            <input value={P.parent1First||''} onChange={e=>update('petitioner.parent1First', e.target.value)} />
          </Field>
          <Field label="Parent 1 Middle Name">
            <input value={P.parent1Middle||''} onChange={e=>update('petitioner.parent1Middle', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Parent 2 Last Name">
            <input value={P.parent2Last||''} onChange={e=>update('petitioner.parent2Last', e.target.value)} />
          </Field>
          <Field label="Parent 2 First Name">
            <input value={P.parent2First||''} onChange={e=>update('petitioner.parent2First', e.target.value)} />
          </Field>
          <Field label="Parent 2 Middle Name">
            <input value={P.parent2Middle||''} onChange={e=>update('petitioner.parent2Middle', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Citizenship Information (Petitioner)</strong></div>

        <Field label="How did you acquire U.S. citizenship?">
          <select value={P.citizenship.how||'birth'} onChange={e=>update('petitioner.citizenship.how', e.target.value)}>
            <option value="birth">Birth</option>
            <option value="natz">Naturalization</option>
            <option value="parents">Derived (Parents)</option>
          </select>
        </Field>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Naturalization Certificate #">
            <input value={P.citizenship.natzCertificate||''} onChange={e=>update('petitioner.citizenship.natzCertificate', e.target.value)} />
          </Field>
          <Field label="Place of Issuance">
            <input value={P.citizenship.natzPlace||''} onChange={e=>update('petitioner.citizenship.natzPlace', e.target.value)} />
          </Field>
          <Field label="Date of Issuance">
            <DateInput value={P.citizenship.natzDate||''} onChange={v=>update('petitioner.citizenship.natzDate', v)} />
          </Field>
        </div>

        <div className="small">If you selected Birth or Parents, you can leave naturalization fields blank.</div>
      </div>
    </div>
  );
}

function Part2Identity({ form, update, add, remove }) {
  const B = form.beneficiary;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card">
        <div className="small"><strong>Beneficiary (Pages 4–5)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
          <Field label="A-Number">
            <input value={B.aNumber||''} onChange={e=>update('beneficiary.aNumber', e.target.value)} />
          </Field>
          <Field label="Social Security Number">
            <input value={B.ssn||''} onChange={e=>update('beneficiary.ssn', e.target.value)} />
          </Field>
          <Field label="Filing from Outside the U.S.?">
            <select value={B.filingFromOutsideUS||''} onChange={e=>update('beneficiary.filingFromOutsideUS', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:10}}>
          <Field label="Family Name (Last)">
            <input value={B.lastName||''} onChange={e=>update('beneficiary.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First)">
            <input value={B.firstName||''} onChange={e=>update('beneficiary.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={B.middleName||''} onChange={e=>update('beneficiary.middleName', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="small"><strong>Other Names Used (Beneficiary)</strong></div>

        {B.otherNames.map((n, idx) => (
          <div key={idx} style={{display:'grid', gridTemplateColumns:'repeat(3,1fr) auto', gap:10, marginTop:10}}>
            <Field label="Family Name (Last)">
              <input value={n.lastName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.lastName`, e.target.value)} />
            </Field>
            <Field label="Given Name (First)">
              <input value={n.firstName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.firstName`, e.target.value)} />
            </Field>
            <Field label="Middle Name">
              <input value={n.middleName||''} onChange={e=>update(`beneficiary.otherNames.${idx}.middleName`, e.target.value)} />
            </Field>
            <div style={{display:'flex', alignItems:'end'}}>
              <button type="button" className="btn" onClick={()=>remove('beneficiary.otherNames', idx)} disabled={B.otherNames.length<=1}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{marginTop:10}}>
          <button type="button" className="btn" onClick={()=>add('beneficiary.otherNames', { lastName:'', firstName:'', middleName:'' })}>
            Add Another Name
          </button>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Beneficiary DOB / Birth / Sex / Marital Status</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of Birth">
            <DateInput value={B.dob||''} onChange={v=>update('beneficiary.dob', v)} />
          </Field>

          <Field label="Sex">
            <select value={B.sex||''} onChange={e=>update('beneficiary.sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <Field label="Marital Status">
            <select value={B.maritalStatus||''} onChange={e=>update('beneficiary.maritalStatus', e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="annulled">Annulled</option>
            </select>
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="City/Town/Village of Birth">
            <input value={B.cityBirth||''} onChange={e=>update('beneficiary.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={B.countryBirth||''} onChange={e=>update('beneficiary.countryBirth', e.target.value)} />
          </Field>
        </div>

        <Field label="Country of Citizenship / Nationality">
          <input value={B.nationality||''} onChange={e=>update('beneficiary.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Biographic Information (Page 9)</strong></div>
        <div className="small">Race, Ethnicity, Eye Color, and Hair Color are single selections — we check only one box on the PDF.</div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Ethnicity (Hispanic or Latino?)">
            <select value={B.ethnicityHispanic||''} onChange={e=>update('beneficiary.ethnicityHispanic', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Hispanic or Latino</option>
              <option value="no">Not Hispanic or Latino</option>
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
      </div>
    </div>
  );
}

function Part2Addresses({ form, update }) {
  const B = form.beneficiary;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Beneficiary Mailing Address</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="In Care Of Name">
            <input value={B.mailing.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} />
          </Field>
          <Field label="Street Number and Name">
            <input value={B.mailing.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Unit Type (Apt/Ste/Flr)">
            <select value={B.mailing.unitType||''} onChange={e=>update('beneficiary.mailing.unitType', e.target.value)}>
              <option value="">Select...</option>
              <option value="apt">Apt</option>
              <option value="ste">Ste</option>
              <option value="flr">Flr</option>
            </select>
          </Field>
          <Field label="Unit Number">
            <input value={B.mailing.unitNumber||''} onChange={e=>update('beneficiary.mailing.unitNumber', e.target.value)} />
          </Field>
          <Field label="City or Town">
            <input value={B.mailing.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="State">
            <input value={B.mailing.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={B.mailing.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={B.mailing.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} />
          </Field>
        </div>

        <div className="small">If address is outside the U.S., you can use Province / Postal Code fields as needed.</div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Province">
            <input value={B.mailing.province||''} onChange={e=>update('beneficiary.mailing.province', e.target.value)} />
          </Field>
          <Field label="Postal Code">
            <input value={B.mailing.postal||''} onChange={e=>update('beneficiary.mailing.postal', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Physical Address History (Beneficiary)</strong></div>
        <div className="small">Enter the last two physical addresses (if applicable).</div>

        {B.addresses.map((a, idx) => (
          <div key={idx} style={{border:'1px solid #eee', borderRadius:12, padding:12, display:'grid', gap:10}}>
            <div className="small"><strong>Address #{idx+1}</strong></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="From (MM/DD/YYYY)">
                <DateInput value={a.from||''} onChange={v=>update(`beneficiary.addresses.${idx}.from`, v)} />
              </Field>
              <Field label="To (MM/DD/YYYY)">
                <DateInput value={a.to||''} onChange={v=>update(`beneficiary.addresses.${idx}.to`, v)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
              <Field label="Street Number and Name">
                <input value={a.street||''} onChange={e=>update(`beneficiary.addresses.${idx}.street`, e.target.value)} />
              </Field>
              <Field label="City or Town">
                <input value={a.city||''} onChange={e=>update(`beneficiary.addresses.${idx}.city`, e.target.value)} />
              </Field>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="State">
                <input value={a.state||''} onChange={e=>update(`beneficiary.addresses.${idx}.state`, e.target.value)} />
              </Field>
              <Field label="ZIP Code">
                <input value={a.zip||''} onChange={e=>update(`beneficiary.addresses.${idx}.zip`, e.target.value)} />
              </Field>
              <Field label="Country">
                <input value={a.country||''} onChange={e=>update(`beneficiary.addresses.${idx}.country`, e.target.value)} />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Part2Employment({ form, update }) {
  const E = form.beneficiary.employment;

  return (
    <div className="card" style={{display:'grid', gap:10}}>
      <div className="small"><strong>Employment (Beneficiary)</strong></div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
        <Field label="Employer Name">
          <input value={E.employerName||''} onChange={e=>update('beneficiary.employment.employerName', e.target.value)} />
        </Field>
        <Field label="Occupation">
          <input value={E.occupation||''} onChange={e=>update('beneficiary.employment.occupation', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
        <Field label="Street Number and Name">
          <input value={E.street||''} onChange={e=>update('beneficiary.employment.street', e.target.value)} />
        </Field>
        <Field label="City or Town">
          <input value={E.city||''} onChange={e=>update('beneficiary.employment.city', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
        <Field label="State">
          <input value={E.state||''} onChange={e=>update('beneficiary.employment.state', e.target.value)} />
        </Field>
        <Field label="ZIP Code">
          <input value={E.zip||''} onChange={e=>update('beneficiary.employment.zip', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={E.country||''} onChange={e=>update('beneficiary.employment.country', e.target.value)} />
        </Field>
      </div>

      <div className="small">If outside the U.S., you can also enter Province / Postal Code as needed.</div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
        <Field label="Province">
          <input value={E.province||''} onChange={e=>update('beneficiary.employment.province', e.target.value)} />
        </Field>
        <Field label="Postal Code">
          <input value={E.postal||''} onChange={e=>update('beneficiary.employment.postal', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Part2Parents({ form, update }) {
  const P = form.beneficiary.parents;

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      <div className="small"><strong>Beneficiary Parents</strong></div>

      <div style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent 1</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Last Name">
            <input value={P.p1Last||''} onChange={e=>update('beneficiary.parents.p1Last', e.target.value)} />
          </Field>
          <Field label="First Name">
            <input value={P.p1First||''} onChange={e=>update('beneficiary.parents.p1First', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={P.p1Middle||''} onChange={e=>update('beneficiary.parents.p1Middle', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of Birth">
            <DateInput value={P.p1Dob||''} onChange={v=>update('beneficiary.parents.p1Dob', v)} />
          </Field>
          <Field label="Sex">
            <select value={P.p1Sex||''} onChange={e=>update('beneficiary.parents.p1Sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="City/Town/Village of Birth">
            <input value={P.p1CityBirth||''} onChange={e=>update('beneficiary.parents.p1CityBirth', e.target.value)} />
          </Field>
        </div>

        <Field label="Country of Birth">
          <input value={P.p1CountryBirth||''} onChange={e=>update('beneficiary.parents.p1CountryBirth', e.target.value)} />
        </Field>
      </div>

      <div style={{display:'grid', gap:10}}>
        <div className="small"><strong>Parent 2</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Last Name">
            <input value={P.p2Last||''} onChange={e=>update('beneficiary.parents.p2Last', e.target.value)} />
          </Field>
          <Field label="First Name">
            <input value={P.p2First||''} onChange={e=>update('beneficiary.parents.p2First', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={P.p2Middle||''} onChange={e=>update('beneficiary.parents.p2Middle', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Date of Birth">
            <DateInput value={P.p2Dob||''} onChange={v=>update('beneficiary.parents.p2Dob', v)} />
          </Field>
          <Field label="Sex">
            <select value={P.p2Sex||''} onChange={e=>update('beneficiary.parents.p2Sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="City/Town/Village of Birth">
            <input value={P.p2CityBirth||''} onChange={e=>update('beneficiary.parents.p2CityBirth', e.target.value)} />
          </Field>
        </div>

        <Field label="Country of Birth">
          <input value={P.p2CountryBirth||''} onChange={e=>update('beneficiary.parents.p2CountryBirth', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

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

function Parts5to7({ form, update }) {
  const C = form.contact;
  const I = form.interpreter;
  const P = form.preparer;

  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Part 5 — Petitioner Contact Information</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Daytime Phone">
            <input value={C.petitionerDayPhone||''} onChange={e=>update('contact.petitionerDayPhone', e.target.value)} />
          </Field>
          <Field label="Mobile Phone">
            <input value={C.petitionerMobile||''} onChange={e=>update('contact.petitionerMobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={C.petitionerEmail||''} onChange={e=>update('contact.petitionerEmail', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Part 6 — Interpreter Information</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Last Name">
            <input value={I.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} />
          </Field>
          <Field label="First Name">
            <input value={I.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} />
          </Field>
          <Field label="Business / Organization">
            <input value={I.business||''} onChange={e=>update('interpreter.business', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Street Number and Name">
            <input value={I.street||''} onChange={e=>update('interpreter.street', e.target.value)} />
          </Field>
          <Field label="City or Town">
            <input value={I.city||''} onChange={e=>update('interpreter.city', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="State">
            <input value={I.state||''} onChange={e=>update('interpreter.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={I.zip||''} onChange={e=>update('interpreter.zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={I.country||''} onChange={e=>update('interpreter.country', e.target.value)} />
          </Field>
          <Field label="Language">
            <input value={I.language||''} onChange={e=>update('interpreter.language', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Daytime Phone">
            <input value={I.dayPhone||''} onChange={e=>update('interpreter.dayPhone', e.target.value)} />
          </Field>
          <Field label="Mobile Phone">
            <input value={I.mobile||''} onChange={e=>update('interpreter.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={I.email||''} onChange={e=>update('interpreter.email', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Part 7 — Preparer Information</strong></div>

        <Field label="Is the preparer an attorney or accredited representative?">
          <select value={P.isAttorney||''} onChange={e=>update('preparer.isAttorney', e.target.value)}>
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Last Name">
            <input value={P.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} />
          </Field>
          <Field label="First Name">
            <input value={P.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} />
          </Field>
          <Field label="Business / Organization">
            <input value={P.business||''} onChange={e=>update('preparer.business', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10}}>
          <Field label="Street Number and Name">
            <input value={P.street||''} onChange={e=>update('preparer.street', e.target.value)} />
          </Field>
          <Field label="City or Town">
            <input value={P.city||''} onChange={e=>update('preparer.city', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="State">
            <input value={P.state||''} onChange={e=>update('preparer.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={P.zip||''} onChange={e=>update('preparer.zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={P.country||''} onChange={e=>update('preparer.country', e.target.value)} />
          </Field>
          <Field label="Bar Number (if applicable)">
            <input value={P.barNumber||''} onChange={e=>update('preparer.barNumber', e.target.value)} />
          </Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Daytime Phone">
            <input value={P.dayPhone||''} onChange={e=>update('preparer.dayPhone', e.target.value)} />
          </Field>
          <Field label="Mobile Phone">
            <input value={P.mobile||''} onChange={e=>update('preparer.mobile', e.target.value)} />
          </Field>
          <Field label="Email">
            <input value={P.email||''} onChange={e=>update('preparer.email', e.target.value)} />
          </Field>
        </div>

        <Field label="State Bar (if applicable)">
          <input value={P.stateBar||''} onChange={e=>update('preparer.stateBar', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Part8Additional({ form, update }) {
  return (
    <div className="card" style={{display:'grid', gap:10}}>
      <div className="small"><strong>Part 8 — Additional Information</strong></div>
      <div className="small">Use this space for any extra details the form requests.</div>
      <textarea
        rows={10}
        value={form.additionalInfo||''}
        onChange={e=>update('additionalInfo', e.target.value)}
      />
    </div>
  );
}

function Review({ form, onSave, busy }) {
  return (
    <div style={{display:'grid', gap:12}}>
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Review</strong></div>
        <div className="small">Save first, then download your filled PDF.</div>

        <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
          <button type="button" className="btn" onClick={onSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save Now'}
          </button>

          <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
            Download Filled PDF
          </a>

          <a className="btn" href="/api/i129f/pdf?flatten=1" target="_blank" rel="noreferrer">
            Download Flattened PDF
          </a>
        </div>
      </div>

      <details className="card">
        <summary className="small"><strong>Raw JSON (for debugging)</strong></summary>
        <pre style={{whiteSpace:'pre-wrap', fontSize:12}}>{JSON.stringify(form, null, 2)}</pre>
      </details>
    </div>
  );
}

/* ---------- Styles ---------- */
const WizardCtx = (() => {
  // simple context shim (no external deps)
  const Ctx = { Provider: ({ children }) => children };
  return Ctx;
})();

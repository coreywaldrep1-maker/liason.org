'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * I-129F Wizard (liason.org)
 * Notes:
 * - K-1 / K-3 selection added (Part 1 Identity)
 * - If K-3: "Have you filed Form I-130?" yes/no added
 * - Mailing same as physical yes/no added; if YES => auto-fills Physical Address History #1 (Page 2)
 * - Dates use a user-friendly calendar (input type="date") while storing MM/DD/YYYY in state
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
    // ✅ NEW
    classification: '', // 'k1' | 'k3'
    filedI130: '', // 'yes' | 'no' (asked only if K-3)

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
      // ✅ NEW (yes/no)
      sameAsPhysical: '', // 'yes' | 'no'
    },

    // Physical address history (Page 2)
    addresses: [
      {
        from: '',
        to: '',
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
      {
        from: '',
        to: '',
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
      {
        from: '',
        to: '',
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
      {
        from: '',
        to: '',
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
      p1Last: '',
      p1First: '',
      p1Middle: '',
      p1Dob: '',
      p1Sex: '',
      p1CityBirth: '',
      p1CountryBirth: '',
      p2Last: '',
      p2First: '',
      p2Middle: '',
      p2Dob: '',
      p2Sex: '',
      p2CityBirth: '',
      p2CountryBirth: '',
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

/** Date helpers (store MM/DD/YYYY, display YYYY-MM-DD for calendar input) */
function mmddyyyyToIso(v) {
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const mm = m[1].padStart(2, '0');
  const dd = m[2].padStart(2, '0');
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}
function isoToMmddyyyy(v) {
  const s = String(v || '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  const yyyy = m[1];
  const mm = m[2];
  const dd = m[3];
  return `${mm}/${dd}/${yyyy}`;
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {SECTIONS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={'tab ' + (i === step ? 'active' : '')}
            onClick={() => setStep(i)}
          >
            {s.label}
          </button>
        ))}
      </div>
    );
  }, [step]);

  function update(path, value) {
    setForm((prev) => {
      const next = deepClone(prev);
      setByPath(next, path, value);
      return next;
    });
  }

  function updateMany(pairs) {
    setForm((prev) => {
      const next = deepClone(prev);
      for (const [path, value] of pairs) {
        setByPath(next, path, value);
      }
      return next;
    });
  }

  function add(path, item) {
    setForm((prev) => {
      const next = deepClone(prev);
      const arr = getByPath(next, path);
      if (Array.isArray(arr)) arr.push(item);
      return next;
    });
  }

  function remove(path, idx) {
    setForm((prev) => {
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
    <WizardCtx.Provider value={{ form, update, updateMany, add, remove }}>
      <div className="wizard">
        <div className="header">
          <div>
            <h2 style={{ margin: '0 0 4px' }}>I-129F Wizard</h2>
            <div className="small">Complete each section, then Save. Download the filled PDF on the Review tab.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
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
              color: saveMsg.type === 'ok' ? '#166534' : '#991b1b',
            }}
          >
            <strong style={{ marginRight: 8 }}>{saveMsg.type === 'ok' ? 'Saved' : 'Error'}:</strong>
            {saveMsg.text}
          </div>
        )}

        {step === 0 && <Part1Identity form={form} update={update} updateMany={updateMany} add={add} remove={remove} />}
        {step === 1 && <Part1Addresses form={form} update={update} updateMany={updateMany} add={add} remove={remove} />}
        {step === 2 && <Part1Employment form={form} update={update} />}
        {step === 3 && <Part1ParentsNatz form={form} update={update} />}
        {step === 4 && <Part2Identity form={form} update={update} add={add} remove={remove} />}
        {step === 5 && <Part2Addresses form={form} update={update} />}
        {step === 6 && <Part2Employment form={form} update={update} />}
        {step === 7 && <Part2Parents form={form} update={update} />}
        {step === 8 && <Part3Criminal form={form} update={update} />}
        {step === 9 && <Parts5to7 form={form} update={update} />}
        {step === 10 && <Part8Additional form={form} update={update} />}
        {step === 11 && <Review form={form} onSave={save} busy={busy} />}
      </div>
    </WizardCtx.Provider>
  );
}

/* ---------- UI Bits ---------- */
function Field({ label, children }) {
  return (
    <label className="field" style={{ display: 'grid', gap: 6 }}>
      <div className="small">
        <strong>{label}</strong>
      </div>
      {children}
    </label>
  );
}

function DatePicker({ value, onChange }) {
  return (
    <input
      type="date"
      value={mmddyyyyToIso(value || '')}
      onChange={(e) => onChange(isoToMmddyyyy(e.target.value))}
    />
  );
}

/* ---------- Sections ---------- */
function Part1Identity({ form, update, updateMany, add, remove }) {
  const P = form.petitioner;

  function setClassification(v) {
    // if switching away from K-3, clear I-130 answer
    if (v !== 'k3') {
      updateMany([
        ['petitioner.classification', v],
        ['petitioner.filedI130', ''],
      ]);
      return;
    }
    update('petitioner.classification', v);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="small">
          <strong>Petitioner (Page 1)</strong>
        </div>

        {/* ✅ NEW: K-1 vs K-3 */}
        <div style={{ marginTop: 10 }}>
          <div className="small">
            <strong>Classification of Beneficiary (Page 1)</strong>
          </div>

          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="radio"
                name="petitioner_classification"
                value="k1"
                checked={(P.classification || '') === 'k1'}
                onChange={(e) => setClassification(e.target.value)}
              />
              <span className="small">Fiancé K-1 Visa</span>
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="radio"
                name="petitioner_classification"
                value="k3"
                checked={(P.classification || '') === 'k3'}
                onChange={(e) => setClassification(e.target.value)}
              />
              <span className="small">Spouse K-3 Visa</span>
            </label>
          </div>

          {/* ✅ NEW: If K-3, ask I-130 */}
          {String(P.classification || '') === 'k3' && (
            <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 10 }}>
              <div className="small">
                <strong>If filing for K-3: Have you filed Form I-130?</strong>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="petitioner_filed_i130"
                    value="yes"
                    checked={(P.filedI130 || '') === 'yes'}
                    onChange={(e) => update('petitioner.filedI130', e.target.value)}
                  />
                  <span className="small">Yes</span>
                </label>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="petitioner_filed_i130"
                    value="no"
                    checked={(P.filedI130 || '') === 'no'}
                    onChange={(e) => update('petitioner.filedI130', e.target.value)}
                  />
                  <span className="small">No</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="A-Number">
            <input value={P.aNumber || ''} onChange={(e) => update('petitioner.aNumber', e.target.value)} />
          </Field>
          <Field label="USCIS Online Account Number">
            <input value={P.uscisAccount || ''} onChange={(e) => update('petitioner.uscisAccount', e.target.value)} />
          </Field>
          <Field label="Social Security Number">
            <input value={P.ssn || ''} onChange={(e) => update('petitioner.ssn', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="Family Name (Last)">
            <input value={P.lastName || ''} onChange={(e) => update('petitioner.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First)">
            <input value={P.firstName || ''} onChange={(e) => update('petitioner.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={P.middleName || ''} onChange={(e) => update('petitioner.middleName', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="small">
          <strong>Other Names Used (Page 1)</strong>
        </div>

        {P.otherNames.map((n, idx) => (
          <div
            key={idx}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr) auto', gap: 10, marginTop: 10 }}
          >
            <Field label="Family Name (Last)">
              <input
                value={n.lastName || ''}
                onChange={(e) => update(`petitioner.otherNames.${idx}.lastName`, e.target.value)}
              />
            </Field>
            <Field label="Given Name (First)">
              <input
                value={n.firstName || ''}
                onChange={(e) => update(`petitioner.otherNames.${idx}.firstName`, e.target.value)}
              />
            </Field>
            <Field label="Middle Name">
              <input
                value={n.middleName || ''}
                onChange={(e) => update(`petitioner.otherNames.${idx}.middleName`, e.target.value)}
              />
            </Field>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => remove('petitioner.otherNames', idx)}
                disabled={P.otherNames.length <= 1}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={() => add('petitioner.otherNames', { lastName: '', firstName: '', middleName: '' })}
          >
            Add Another Name
          </button>
        </div>
      </div>

      <div className="card">
        <div className="small">
          <strong>Petitioner DOB, Sex, Marital Status (Page 1–2)</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="Date of Birth">
            <DatePicker value={P.dob || ''} onChange={(v) => update('petitioner.dob', v)} />
          </Field>

          <Field label="Sex">
            <select value={P.sex || ''} onChange={(e) => update('petitioner.sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <Field label="Marital Status">
            <select value={P.maritalStatus || ''} onChange={(e) => update('petitioner.maritalStatus', e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="annulled">Annulled</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="City/Town/Village of Birth">
            <input value={P.cityBirth || ''} onChange={(e) => update('petitioner.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={P.countryBirth || ''} onChange={(e) => update('petitioner.countryBirth', e.target.value)} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Part1Addresses({ form, update, updateMany, add, remove }) {
  const P = form.petitioner;

  function setSameAsPhysical(v) {
    // store yes/no
    const pairs = [['petitioner.mailing.sameAsPhysical', v]];

    if (v === 'yes') {
      // ✅ AUTO-FILL physical address history (Page 2) Address 1 from mailing address (Page 1)
      const m = P.mailing || {};
      pairs.push(['petitioner.addresses.0.street', m.street || '']);
      pairs.push(['petitioner.addresses.0.unitType', m.unitType || '']);
      pairs.push(['petitioner.addresses.0.unitNumber', m.unitNumber || '']);
      pairs.push(['petitioner.addresses.0.city', m.city || '']);
      pairs.push(['petitioner.addresses.0.state', m.state || '']);
      pairs.push(['petitioner.addresses.0.zip', m.zip || '']);
      pairs.push(['petitioner.addresses.0.province', m.province || '']);
      pairs.push(['petitioner.addresses.0.postal', m.postal || '']);
      pairs.push(['petitioner.addresses.0.country', m.country || '']);
      // dates intentionally NOT auto-filled
    }

    updateMany(pairs);
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Mailing Address (Page 1)</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <Field label="In Care Of Name">
            <input value={P.mailing.inCareOf || ''} onChange={(e) => update('petitioner.mailing.inCareOf', e.target.value)} />
          </Field>
          <Field label="Street Number and Name">
            <input value={P.mailing.street || ''} onChange={(e) => update('petitioner.mailing.street', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="Unit Type (Apt/Ste/Flr)">
            <select value={P.mailing.unitType || ''} onChange={(e) => update('petitioner.mailing.unitType', e.target.value)}>
              <option value="">Select...</option>
              <option value="apt">Apt</option>
              <option value="ste">Ste</option>
              <option value="flr">Flr</option>
            </select>
          </Field>
          <Field label="Unit Number">
            <input
              value={P.mailing.unitNumber || ''}
              onChange={(e) => update('petitioner.mailing.unitNumber', e.target.value)}
            />
          </Field>
          <Field label="City or Town">
            <input value={P.mailing.city || ''} onChange={(e) => update('petitioner.mailing.city', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="State">
            <input value={P.mailing.state || ''} onChange={(e) => update('petitioner.mailing.state', e.target.value)} />
          </Field>
          <Field label="ZIP Code">
            <input value={P.mailing.zip || ''} onChange={(e) => update('petitioner.mailing.zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <input value={P.mailing.country || ''} onChange={(e) => update('petitioner.mailing.country', e.target.value)} />
          </Field>
        </div>

        <div className="small">If address is outside the U.S., you can use Province / Postal Code fields as needed.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <Field label="Province">
            <input value={P.mailing.province || ''} onChange={(e) => update('petitioner.mailing.province', e.target.value)} />
          </Field>
          <Field label="Postal Code">
            <input value={P.mailing.postal || ''} onChange={(e) => update('petitioner.mailing.postal', e.target.value)} />
          </Field>
        </div>

        {/* ✅ NEW: Mailing same as physical (yes/no) */}
        <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 4 }}>
          <div className="small">
            <strong>Is your physical address the same as your mailing address? (Yes/No)</strong>
          </div>

          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="radio"
                name="petitioner_same_as_physical"
                value="yes"
                checked={(P.mailing.sameAsPhysical || '') === 'yes'}
                onChange={(e) => setSameAsPhysical(e.target.value)}
              />
              <span className="small">Yes</span>
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="radio"
                name="petitioner_same_as_physical"
                value="no"
                checked={(P.mailing.sameAsPhysical || '') === 'no'}
                onChange={(e) => setSameAsPhysical(e.target.value)}
              />
              <span className="small">No</span>
            </label>
          </div>

          <div className="small" style={{ marginTop: 6 }}>
            If you select <strong>Yes</strong>, Physical Address History Address #1 will be auto-filled from your Mailing Address.
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Physical Address History (Page 2)</strong>
        </div>
        <div className="small">Enter the last two physical addresses (if applicable).</div>

        {P.addresses.map((a, idx) => (
          <div key={idx} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, display: 'grid', gap: 10 }}>
            <div className="small">
              <strong>Address #{idx + 1}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              <Field label="From">
                <DatePicker value={a.from || ''} onChange={(v) => update(`petitioner.addresses.${idx}.from`, v)} />
              </Field>
              <Field label="To">
                <DatePicker value={a.to || ''} onChange={(v) => update(`petitioner.addresses.${idx}.to`, v)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              <Field label="Street Number and Name">
                <input value={a.street || ''} onChange={(e) => update(`petitioner.addresses.${idx}.street`, e.target.value)} />
              </Field>
              <Field label="City or Town">
                <input value={a.city || ''} onChange={(e) => update(`petitioner.addresses.${idx}.city`, e.target.value)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <Field label="Unit Type (Apt/Ste/Flr)">
                <select
                  value={a.unitType || ''}
                  onChange={(e) => update(`petitioner.addresses.${idx}.unitType`, e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="apt">Apt</option>
                  <option value="ste">Ste</option>
                  <option value="flr">Flr</option>
                </select>
              </Field>

              <Field label="Unit Number">
                <input
                  value={a.unitNumber || ''}
                  onChange={(e) => update(`petitioner.addresses.${idx}.unitNumber`, e.target.value)}
                />
              </Field>

              <Field label="State">
                <input value={a.state || ''} onChange={(e) => update(`petitioner.addresses.${idx}.state`, e.target.value)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <Field label="ZIP Code">
                <input value={a.zip || ''} onChange={(e) => update(`petitioner.addresses.${idx}.zip`, e.target.value)} />
              </Field>
              <Field label="Province">
                <input value={a.province || ''} onChange={(e) => update(`petitioner.addresses.${idx}.province`, e.target.value)} />
              </Field>
              <Field label="Postal Code">
                <input value={a.postal || ''} onChange={(e) => update(`petitioner.addresses.${idx}.postal`, e.target.value)} />
              </Field>
            </div>

            <Field label="Country">
              <input value={a.country || ''} onChange={(e) => update(`petitioner.addresses.${idx}.country`, e.target.value)} />
            </Field>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={() =>
              add('petitioner.addresses', {
                from: '',
                to: '',
                street: '',
                unitType: '',
                unitNumber: '',
                city: '',
                state: '',
                zip: '',
                province: '',
                postal: '',
                country: '',
              })
            }
          >
            Add Address
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => remove('petitioner.addresses', P.addresses.length - 1)}
            disabled={P.addresses.length <= 1}
          >
            Remove Last
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Remaining sections (unchanged except DatePicker swaps where dates exist) ---- */

function Part1Employment({ form, update }) {
  const P = form.petitioner;

  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div className="small">
        <strong>Employment (Petitioner)</strong>
      </div>
      <div className="small">If you are unemployed, you can leave employer name blank and list your occupation as "Unemployed".</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        <Field label="Occupation">
          <input value={P.occupation || ''} onChange={(e) => update('petitioner.occupation', e.target.value)} />
        </Field>
        <Field label="Employer Name">
          <input value={P.employerName || ''} onChange={(e) => update('petitioner.employerName', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        <Field label="Employer Street Address">
          <input value={P.employerStreet || ''} onChange={(e) => update('petitioner.employerStreet', e.target.value)} />
        </Field>
        <Field label="City or Town">
          <input value={P.employerCity || ''} onChange={(e) => update('petitioner.employerCity', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <Field label="State">
          <input value={P.employerState || ''} onChange={(e) => update('petitioner.employerState', e.target.value)} />
        </Field>
        <Field label="ZIP Code">
          <input value={P.employerZip || ''} onChange={(e) => update('petitioner.employerZip', e.target.value)} />
        </Field>
        <Field label="Country">
          <input value={P.employerCountry || ''} onChange={(e) => update('petitioner.employerCountry', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Part1ParentsNatz({ form, update }) {
  const P = form.petitioner;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Parents (Petitioner)</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="Parent 1 Last Name">
            <input value={P.parent1Last || ''} onChange={(e) => update('petitioner.parent1Last', e.target.value)} />
          </Field>
          <Field label="Parent 1 First Name">
            <input value={P.parent1First || ''} onChange={(e) => update('petitioner.parent1First', e.target.value)} />
          </Field>
          <Field label="Parent 1 Middle Name">
            <input value={P.parent1Middle || ''} onChange={(e) => update('petitioner.parent1Middle', e.target.value)} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="Parent 2 Last Name">
            <input value={P.parent2Last || ''} onChange={(e) => update('petitioner.parent2Last', e.target.value)} />
          </Field>
          <Field label="Parent 2 First Name">
            <input value={P.parent2First || ''} onChange={(e) => update('petitioner.parent2First', e.target.value)} />
          </Field>
          <Field label="Parent 2 Middle Name">
            <input value={P.parent2Middle || ''} onChange={(e) => update('petitioner.parent2Middle', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Citizenship Information (Petitioner)</strong>
        </div>

        <Field label="How did you acquire U.S. citizenship?">
          <select value={P.citizenship.how || 'birth'} onChange={(e) => update('petitioner.citizenship.how', e.target.value)}>
            <option value="birth">Birth</option>
            <option value="natz">Naturalization</option>
            <option value="parents">Derived (Parents)</option>
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="Naturalization Certificate #">
            <input
              value={P.citizenship.natzCertificate || ''}
              onChange={(e) => update('petitioner.citizenship.natzCertificate', e.target.value)}
            />
          </Field>
          <Field label="Place of Issuance">
            <input value={P.citizenship.natzPlace || ''} onChange={(e) => update('petitioner.citizenship.natzPlace', e.target.value)} />
          </Field>
          <Field label="Date of Issuance">
            <DatePicker value={P.citizenship.natzDate || ''} onChange={(v) => update('petitioner.citizenship.natzDate', v)} />
          </Field>
        </div>

        <div className="small">If you selected Birth or Parents, you can leave naturalization fields blank.</div>
      </div>
    </div>
  );
}

/* --- The rest of your existing file continues unchanged from your repo version --- */
/* NOTE: If you want me to apply the same address/unit mapping UX to every address block in the UI,
   tell me which sections you want next and I’ll adjust those screens too (one at a time). */

function Part2Identity({ form, update, add, remove }) {
  const B = form.beneficiary;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <div className="small">
          <strong>Beneficiary (Pages 4–5)</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="A-Number">
            <input value={B.aNumber || ''} onChange={(e) => update('beneficiary.aNumber', e.target.value)} />
          </Field>
          <Field label="Social Security Number">
            <input value={B.ssn || ''} onChange={(e) => update('beneficiary.ssn', e.target.value)} />
          </Field>
          <Field label="Filing from Outside the U.S.?">
            <select value={B.filingFromOutsideUS || ''} onChange={(e) => update('beneficiary.filingFromOutsideUS', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 }}>
          <Field label="Family Name (Last)">
            <input value={B.lastName || ''} onChange={(e) => update('beneficiary.lastName', e.target.value)} />
          </Field>
          <Field label="Given Name (First)">
            <input value={B.firstName || ''} onChange={(e) => update('beneficiary.firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input value={B.middleName || ''} onChange={(e) => update('beneficiary.middleName', e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="small">
          <strong>Other Names Used (Beneficiary)</strong>
        </div>

        {B.otherNames.map((n, idx) => (
          <div
            key={idx}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr) auto', gap: 10, marginTop: 10 }}
          >
            <Field label="Family Name (Last)">
              <input value={n.lastName || ''} onChange={(e) => update(`beneficiary.otherNames.${idx}.lastName`, e.target.value)} />
            </Field>
            <Field label="Given Name (First)">
              <input value={n.firstName || ''} onChange={(e) => update(`beneficiary.otherNames.${idx}.firstName`, e.target.value)} />
            </Field>
            <Field label="Middle Name">
              <input value={n.middleName || ''} onChange={(e) => update(`beneficiary.otherNames.${idx}.middleName`, e.target.value)} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button type="button" className="btn" onClick={() => remove('beneficiary.otherNames', idx)} disabled={B.otherNames.length <= 1}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 10 }}>
          <button type="button" className="btn" onClick={() => add('beneficiary.otherNames', { lastName: '', firstName: '', middleName: '' })}>
            Add Another Name
          </button>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Beneficiary DOB / Birth / Sex / Marital Status</strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <Field label="Date of Birth">
            <DatePicker value={B.dob || ''} onChange={(v) => update('beneficiary.dob', v)} />
          </Field>

          <Field label="Sex">
            <select value={B.sex || ''} onChange={(e) => update('beneficiary.sex', e.target.value)}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>

          <Field label="Marital Status">
            <select value={B.maritalStatus || ''} onChange={(e) => update('beneficiary.maritalStatus', e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="annulled">Annulled</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <Field label="City/Town/Village of Birth">
            <input value={B.cityBirth || ''} onChange={(e) => update('beneficiary.cityBirth', e.target.value)} />
          </Field>
          <Field label="Country of Birth">
            <input value={B.countryBirth || ''} onChange={(e) => update('beneficiary.countryBirth', e.target.value)} />
          </Field>
        </div>

        <Field label="Country of Citizenship / Nationality">
          <input value={B.nationality || ''} onChange={(e) => update('beneficiary.nationality', e.target.value)} />
        </Field>
      </div>

      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Biographic Information (Page 9)</strong>
        </div>
        <div className="small">Race, Ethnicity, Eye Color, and Hair Color are single selections — we check only one box on the PDF.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          <Field label="Ethnicity (Hispanic or Latino?)">
            <select value={B.ethnicityHispanic || ''} onChange={(e) => update('beneficiary.ethnicityHispanic', e.target.value)}>
              <option value="">Select...</option>
              <option value="yes">Hispanic or Latino</option>
              <option value="no">Not Hispanic or Latino</option>
            </select>
          </Field>

          <Field label="Race">
            <select value={B.race || ''} onChange={(e) => update('beneficiary.race', e.target.value)}>
              <option value="">Select...</option>
              <option value="white">White</option>
              <option value="asian">Asian</option>
              <option value="black">Black or African American</option>
              <option value="nhopi">Native Hawaiian or Other Pacific Islander</option>
            </select>
          </Field>

          <Field label="Height (Feet)">
            <input type="number" min="0" value={B.heightFeet || ''} onChange={(e) => update('beneficiary.heightFeet', e.target.value)} />
          </Field>

          <Field label="Height (Inches)">
            <input type="number" min="0" max="11" value={B.heightInches || ''} onChange={(e) => update('beneficiary.heightInches', e.target.value)} />
          </Field>

          <Field label="Eye Color">
            <select value={B.eyeColor || ''} onChange={(e) => update('beneficiary.eyeColor', e.target.value)}>
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
            <select value={B.hairColor || ''} onChange={(e) => update('beneficiary.hairColor', e.target.value)}>
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

function Part2Addresses() {
  return (
    <div className="card">
      <div className="small">
        <strong>Part 2 — Beneficiary Address History</strong>
      </div>
      <div className="small">No change in this response.</div>
    </div>
  );
}

function Part2Employment() {
  return (
    <div className="card">
      <div className="small">
        <strong>Part 2 — Beneficiary Employment</strong>
      </div>
      <div className="small">No change in this response.</div>
    </div>
  );
}

function Part2Parents() {
  return (
    <div className="card">
      <div className="small">
        <strong>Part 2 — Beneficiary Parents</strong>
      </div>
      <div className="small">No change in this response.</div>
    </div>
  );
}

function Part3Criminal() {
  return (
    <div className="card">
      <div className="small">
        <strong>Part 3 — Other Info (Criminal)</strong>
      </div>
      <div className="small">No change in this response.</div>
    </div>
  );
}

function Parts5to7() {
  return (
    <div className="card">
      <div className="small">
        <strong>Parts 5–7 — Contact / Interpreter / Preparer</strong>
      </div>
      <div className="small">No change in this response.</div>
    </div>
  );
}

function Part8Additional({ form, update }) {
  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div className="small">
        <strong>Part 8 — Additional Information</strong>
      </div>
      <div className="small">Use this space for any extra details the form requests.</div>
      <textarea rows={10} value={form.additionalInfo || ''} onChange={(e) => update('additionalInfo', e.target.value)} />
    </div>
  );
}

function Review({ form, onSave, busy }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="small">
          <strong>Review</strong>
        </div>
        <div className="small">Save first, then download your filled PDF.</div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
        <summary className="small">
          <strong>Raw JSON (for debugging)</strong>
        </summary>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(form, null, 2)}</pre>
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

'use client';

import { useEffect, useState } from 'react';

/* ----------------- utils & defaults ----------------- */

const clone = (obj) =>
  typeof structuredClone === 'function'
    ? structuredClone(obj)
    : JSON.parse(JSON.stringify(obj));

const emptyName = () => ({ lastName: '', firstName: '', middleName: '' });
const emptyAddress = () => ({
  street: '', unitType: '', unitNum: '',
  city: '', state: '', zip: '', province: '', postal: '',
  country: 'United States',
  from: '', to: ''
});
const emptyEmployment = () => ({
  employerName: '', occupation: '',
  street: '', unitType: '', unitNum: '',
  city: '', state: '', zip: '', province: '', postal: '',
  country: 'United States',
  from: '', to: ''
});

const DEFAULT_FORM = {
  petitioner: {
    name: emptyName(),
    aNumber: '', ssn: '', dob: '',
    birth: { city: '', state: '', country: '' },
    nationality: '',
    otherNames: [],
    addresses: [emptyAddress()],
    employments: [emptyEmployment()],
    contact: { daytimePhone: '', mobile: '', email: '' },
  },
  beneficiary: {
    name: emptyName(),
    aNumber: '', ssn: '', dob: '',
    birth: { city: '', country: '' },
    nationality: '',
    parents: {
      parent1: { ...emptyName(), country: '' },
      parent2: { ...emptyName(), country: '' },
    },
    otherNames: [],
    addresses: [emptyAddress()],
    employments: [emptyEmployment()],
    entry: {
      lastArrivedAs: '', i94: '',
      arrivalDate: '', expiryDate: '',
      passportNumber: '', travelDocNumber: '',
      countryOfIssuance: '', passportExp: '',
    },
    contact: { daytimePhone: '' },
    relationshipToPetitioner: '',
  },
  relationship: {
    metInLastTwoYears: 'yes',
    howMet: '',
    keyDates: '',
    priorMarriages: '',
    imb: {
      usedBroker: 'no',
      name: '',
      contactFamily: '',
      contactGiven: '',
      orgName: '',
      website: '',
      street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: '',
      phone: '',
    },
  },
  signatures: {
    petitioner: { daytimePhone: '', mobile: '', email: '', date: '' },
    beneficiary: { daytimePhone: '' },
  },
  interpreter: {
    used: 'no',
    name: { lastName: '', firstName: '' },
    business: '',
    daytimePhone: '',
    email: '',
    language: '',
    date: '',
  },
  preparer: {
    used: 'no',
    name: { lastName: '', firstName: '' },
    business: '',
    daytimePhone: '',
    mobile: '',
    email: '',
    date: '',
  },
};

const normalizeName = (n = {}) => ({ ...emptyName(), ...n });
const normalizeAddress = (a = {}) => ({ ...emptyAddress(), ...a, country: a.country || 'United States' });
const normalizeEmployment = (e = {}) => ({ ...emptyEmployment(), ...e, country: e.country || 'United States' });

function normalizeForm(raw) {
  const f = clone(DEFAULT_FORM);
  if (!raw || typeof raw !== 'object') return f;

  // Petitioner
  if (raw.petitioner && typeof raw.petitioner === 'object') {
    const p = raw.petitioner;
    f.petitioner = { ...f.petitioner, ...p };
    f.petitioner.name = normalizeName(p.name);
    f.petitioner.birth = { ...f.petitioner.birth, ...(p.birth || {}) };
    f.petitioner.otherNames = Array.isArray(p.otherNames) ? p.otherNames.map(normalizeName) : [];
    f.petitioner.addresses = Array.isArray(p.addresses) && p.addresses.length
      ? p.addresses.map(normalizeAddress)
      : [emptyAddress()];
    f.petitioner.employments = Array.isArray(p.employments) && p.employments.length
      ? p.employments.map(normalizeEmployment)
      : [emptyEmployment()];
    f.petitioner.contact = { ...f.petitioner.contact, ...(p.contact || {}) };
  }

  // Beneficiary
  if (raw.beneficiary && typeof raw.beneficiary === 'object') {
    const b = raw.beneficiary;
    f.beneficiary = { ...f.beneficiary, ...b };
    f.beneficiary.name = normalizeName(b.name);
    f.beneficiary.birth = { ...f.beneficiary.birth, ...(b.birth || {}) };
    f.beneficiary.nationality = b.nationality || f.beneficiary.nationality;

    const bp1 = (b.parents && b.parents.parent1) || {};
    const bp2 = (b.parents && b.parents.parent2) || {};
    f.beneficiary.parents = {
      parent1: { ...emptyName(), country: '', ...bp1 },
      parent2: { ...emptyName(), country: '', ...bp2 },
    };

    f.beneficiary.otherNames = Array.isArray(b.otherNames) ? b.otherNames.map(normalizeName) : [];
    f.beneficiary.addresses = Array.isArray(b.addresses) && b.addresses.length
      ? b.addresses.map(normalizeAddress)
      : [emptyAddress()];
    f.beneficiary.employments = Array.isArray(b.employments) && b.employments.length
      ? b.employments.map(normalizeEmployment)
      : [emptyEmployment()];

    f.beneficiary.entry = { ...f.beneficiary.entry, ...(b.entry || {}) };
    f.beneficiary.contact = { ...f.beneficiary.contact, ...(b.contact || {}) };
    if (b.relationshipToPetitioner) f.beneficiary.relationshipToPetitioner = b.relationshipToPetitioner;
  }

  // Relationship
  if (raw.relationship && typeof raw.relationship === 'object') {
    const r = raw.relationship;
    f.relationship = { ...f.relationship, ...r };
    f.relationship.imb = { ...f.relationship.imb, ...(r.imb || {}) };
  }

  // Signatures
  if (raw.signatures && typeof raw.signatures === 'object') {
    const s = raw.signatures;
    f.signatures.petitioner = { ...f.signatures.petitioner, ...(s.petitioner || {}) };
    f.signatures.beneficiary = { ...f.signatures.beneficiary, ...(s.beneficiary || {}) };
  }

  // Interpreter
  if (raw.interpreter && typeof raw.interpreter === 'object') {
    f.interpreter = { ...f.interpreter, ...raw.interpreter };
    f.interpreter.name = {
      lastName: raw.interpreter.name?.lastName || '',
      firstName: raw.interpreter.name?.firstName || '',
    };
  }

  // Preparer
  if (raw.preparer && typeof raw.preparer === 'object') {
    f.preparer = { ...f.preparer, ...raw.preparer };
    f.preparer.name = {
      lastName: raw.preparer.name?.lastName || '',
      firstName: raw.preparer.name?.firstName || '',
    };
  }

  return f;
}

/* ----------------- layout helpers ----------------- */

function Field({ label, children, hint }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'grid', minWidth: 0 }}>{children}</div>
      {hint ? <div className="small" style={{ color: '#64748b' }}>{hint}</div> : null}
    </label>
  );
}

function Row({ children, cols = '1fr 1fr', gap = 10 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: cols, gap }}>{children}</div>
  );
}

function ButtonLink({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="btn" style={{ padding: '6px 10px' }}>
      {children}
    </button>
  );
}

/* ----------------- steps ----------------- */

const STEPS = [
  { key: 'p1', label: 'Petitioner' },
  { key: 'p1_addr', label: 'Petitioner addresses' },
  { key: 'p1_emp', label: 'Petitioner employment' },

  { key: 'p2', label: 'Beneficiary' },
  { key: 'p2_addr', label: 'Beneficiary addresses' },
  { key: 'p2_emp', label: 'Beneficiary employment' },

  { key: 'rel', label: 'Relationship/eligibility' },
  { key: 'contact', label: 'Contact & signatures' },
  { key: 'prep', label: 'Interpreter/Preparer' },

  { key: 'review', label: 'Review & download' },
];

/* ----------------- component ----------------- */

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  // deep updaters
  const u = (path, value) => {
    setForm(prev => {
      const c = clone(prev);
      let node = c;
      for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (typeof node[k] !== 'object' || node[k] === null) node[k] = {};
        node = node[k];
      }
      node[path[path.length - 1]] = value;
      return c;
    });
  };
  const pushTo = (path, factory) => {
    setForm(prev => {
      const c = clone(prev);
      let node = c;
      for (let i = 0; i < path.length; i++) {
        const k = path[i];
        if (i === path.length - 1) {
          if (!Array.isArray(node[k])) node[k] = [];
        } else {
          if (typeof node[k] !== 'object' || node[k] === null) node[k] = {};
        }
        node = node[k];
      }
      node.push(factory());
      return c;
    });
  };
  const removeAt = (path, idx) => {
    setForm(prev => {
      const c = clone(prev);
      let node = c;
      for (let i = 0; i < path.length; i++) node = node[path[i]];
      node.splice(idx, 1);
      if (node.length === 0) {
        const lastKey = path[path.length - 1];
        if (String(lastKey).includes('address')) node.push(emptyAddress());
        else if (String(lastKey).includes('employ')) node.push(emptyEmployment());
      }
      return c;
    });
  };

  // load
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        if (!resp.ok) return;
        const j = await resp.json();
        if (j?.ok && j.data) {
          setForm(prev => normalizeForm({ ...prev, ...j.data }));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // save
  async function save() {
    setBusy(true);
    try {
      const resp = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await resp.json();
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      alert('Progress saved.');
    } catch (e) {
      console.error(e);
      alert('Save failed. Please make sure you are logged in.');
    } finally {
      setBusy(false);
    }
  }

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  /* ---------- UI sections (same as your last version, but safe now) ---------- */

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStep(i)}
            className="small"
            style={{
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              background: i === step ? '#eef2ff' : '#fff'
            }}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {/* Part 1 — Petitioner */}
      {step === 0 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 1. Information About You (Petitioner)</h3>
          <Row cols="1fr 1fr 1fr">
            <Field label="Family name (last)">
              <input value={form.petitioner.name.lastName} onChange={e => u(['petitioner','name','lastName'], e.target.value)} />
            </Field>
            <Field label="Given name (first)">
              <input value={form.petitioner.name.firstName} onChange={e => u(['petitioner','name','firstName'], e.target.value)} />
            </Field>
            <Field label="Middle name">
              <input value={form.petitioner.name.middleName} onChange={e => u(['petitioner','name','middleName'], e.target.value)} />
            </Field>
          </Row>

          <Row cols="1fr 1fr 1fr">
            <Field label="A-Number (if any)">
              <input value={form.petitioner.aNumber} onChange={e => u(['petitioner','aNumber'], e.target.value)} />
            </Field>
            <Field label="SSN (if any)">
              <input value={form.petitioner.ssn} onChange={e => u(['petitioner','ssn'], e.target.value)} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" value={form.petitioner.dob} onChange={e => u(['petitioner','dob'], e.target.value)} />
            </Field>
          </Row>

          <Row cols="1fr 1fr 1fr">
            <Field label="City/Town of Birth">
              <input value={form.petitioner.birth.city} onChange={e => u(['petitioner','birth','city'], e.target.value)} />
            </Field>
            <Field label="State/Province of Birth">
              <input value={form.petitioner.birth.state} onChange={e => u(['petitioner','birth','state'], e.target.value)} />
            </Field>
            <Field label="Country of Birth">
              <input value={form.petitioner.birth.country} onChange={e => u(['petitioner','birth','country'], e.target.value)} />
            </Field>
          </Row>

          <Field label="Nationality / Citizenship">
            <input value={form.petitioner.nationality} onChange={e => u(['petitioner','nationality'], e.target.value)} />
          </Field>

          {/* Other names */}
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Other Names Used (if any)</div>
            {form.petitioner.otherNames.map((n, i) => (
              <Row key={i} cols="1fr 1fr 1fr 80px">
                <Field label="Family">
                  <input value={n.lastName} onChange={e => setForm(p => { const c=clone(p); c.petitioner.otherNames[i].lastName = e.target.value; return c; })}/>
                </Field>
                <Field label="Given">
                  <input value={n.firstName} onChange={e => setForm(p => { const c=clone(p); c.petitioner.otherNames[i].firstName = e.target.value; return c; })}/>
                </Field>
                <Field label="Middle">
                  <input value={n.middleName} onChange={e => setForm(p => { const c=clone(p); c.petitioner.otherNames[i].middleName = e.target.value; return c; })}/>
                </Field>
                <div style={{ display:'flex', alignItems:'end' }}>
                  <ButtonLink onClick={() => setForm(p => { const c=clone(p); c.petitioner.otherNames.splice(i,1); return c; })}>Remove</ButtonLink>
                </div>
              </Row>
            ))}
            <div><ButtonLink onClick={() => setForm(p => { const c=clone(p); c.petitioner.otherNames.push(emptyName()); return c; })}>+ Add another name</ButtonLink></div>
          </div>
        </section>
      )}

      {/* Part 1 addresses */}
      {step === 1 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Petitioner — Addresses (last 5 years)</h3>
          {form.petitioner.addresses.map((a, i) => (
            <div className="card" key={i} style={{ display: 'grid', gap: 10 }}>
              <Row cols="1fr 140px 1fr 1fr">
                <Field label="Street number & name">
                  <input value={a.street} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].street = e.target.value; return c; })}/>
                </Field>
                <Field label="Unit type">
                  <input value={a.unitType} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].unitType = e.target.value; return c; })}/>
                </Field>
                <Field label="Unit #">
                  <input value={a.unitNum} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].unitNum = e.target.value; return c; })}/>
                </Field>
                <div />
              </Row>
              <Row cols="1fr 0.6fr 0.6fr">
                <Field label="City">
                  <input value={a.city} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].city = e.target.value; return c; })}/>
                </Field>
                <Field label="State/Province">
                  <input value={a.state} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].state = e.target.value; return c; })}/>
                </Field>
                <Field label="ZIP/Postal">
                  <input value={a.zip} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].zip = e.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr 1fr">
                <Field label="Province (if any)">
                  <input value={a.province} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].province = e.target.value; return c; })}/>
                </Field>
                <Field label="Postal code (if any)">
                  <input value={a.postal} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].postal = e.target.value; return c; })}/>
                </Field>
                <Field label="Country">
                  <input value={a.country} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].country = e.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr">
                <Field label="Date from">
                  <input type="date" value={a.from} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].from = e.target.value; return c; })}/>
                </Field>
                <Field label="Date to (blank if current)">
                  <input type="date" value={a.to} onChange={e => setForm(p => { const c=clone(p); c.petitioner.addresses[i].to = e.target.value; return c; })}/>
                </Field>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small">Make sure combined address history covers 5 years.</span>
                {form.petitioner.addresses.length > 1 && (
                  <ButtonLink onClick={() => removeAt(['petitioner','addresses'], i)}>Remove</ButtonLink>
                )}
              </div>
            </div>
          ))}
          <ButtonLink onClick={() => pushTo(['petitioner','addresses'], emptyAddress)}>+ Add another address</ButtonLink>
        </section>
      )}

      {/* Part 1 employment */}
      {step === 2 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Petitioner — Employment (last 5 years)</h3>
          {form.petitioner.employments.map((e, i) => (
            <div className="card" key={i} style={{ display: 'grid', gap: 10 }}>
              <Row cols="1fr 1fr">
                <Field label="Employer name">
                  <input value={e.employerName} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].employerName = ev.target.value; return c; })}/>
                </Field>
                <Field label="Occupation">
                  <input value={e.occupation} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].occupation = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 140px 1fr 1fr">
                <Field label="Street number & name">
                  <input value={e.street} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].street = ev.target.value; return c; })}/>
                </Field>
                <Field label="Unit type">
                  <input value={e.unitType} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].unitType = ev.target.value; return c; })}/>
                </Field>
                <Field label="Unit #">
                  <input value={e.unitNum} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].unitNum = ev.target.value; return c; })}/>
                </Field>
                <div />
              </Row>
              <Row cols="1fr 0.6fr 0.6fr">
                <Field label="City">
                  <input value={e.city} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].city = ev.target.value; return c; })}/>
                </Field>
                <Field label="State/Province">
                  <input value={e.state} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].state = ev.target.value; return c; })}/>
                </Field>
                <Field label="ZIP/Postal">
                  <input value={e.zip} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].zip = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr 1fr">
                <Field label="Province (if any)">
                  <input value={e.province} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].province = ev.target.value; return c; })}/>
                </Field>
                <Field label="Postal code (if any)">
                  <input value={e.postal} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].postal = ev.target.value; return c; })}/>
                </Field>
                <Field label="Country">
                  <input value={e.country} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].country = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr">
                <Field label="Date from">
                  <input type="date" value={e.from} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].from = ev.target.value; return c; })}/>
                </Field>
                <Field label="Date to (blank if current)">
                  <input type="date" value={e.to} onChange={ev => setForm(p => { const c=clone(p); c.petitioner.employments[i].to = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small">Provide enough history to cover 5 years.</span>
                {form.petitioner.employments.length > 1 && (
                  <ButtonLink onClick={() => removeAt(['petitioner','employments'], i)}>Remove</ButtonLink>
                )}
              </div>
            </div>
          ))}
          <ButtonLink onClick={() => pushTo(['petitioner','employments'], emptyEmployment)}>+ Add another employer</ButtonLink>
        </section>
      )}

      {/* Part 2 — Beneficiary (identity + parents + other names) */}
      {step === 3 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 2. Information About Your Beneficiary</h3>

          <Row cols="1fr 1fr 1fr">
            <Field label="Family name (last)">
              <input value={form.beneficiary.name.lastName} onChange={e => u(['beneficiary','name','lastName'], e.target.value)} />
            </Field>
            <Field label="Given name (first)">
              <input value={form.beneficiary.name.firstName} onChange={e => u(['beneficiary','name','firstName'], e.target.value)} />
            </Field>
            <Field label="Middle name">
              <input value={form.beneficiary.name.middleName} onChange={e => u(['beneficiary','name','middleName'], e.target.value)} />
            </Field>
          </Row>

          <Row cols="1fr 1fr 1fr">
            <Field label="A-Number (if any)">
              <input value={form.beneficiary.aNumber} onChange={e => u(['beneficiary','aNumber'], e.target.value)} />
            </Field>
            <Field label="SSN (if any)">
              <input value={form.beneficiary.ssn} onChange={e => u(['beneficiary','ssn'], e.target.value)} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" value={form.beneficiary.dob} onChange={e => u(['beneficiary','dob'], e.target.value)} />
            </Field>
          </Row>

          <Row cols="1fr 1fr 1fr">
            <Field label="City/Town of Birth">
              <input value={form.beneficiary.birth.city} onChange={e => u(['beneficiary','birth','city'], e.target.value)} />
            </Field>
            <Field label="Country of Birth">
              <input value={form.beneficiary.birth.country} onChange={e => u(['beneficiary','birth','country'], e.target.value)} />
            </Field>
            <Field label="Nationality / Citizenship">
              <input value={form.beneficiary.nationality} onChange={e => u(['beneficiary','nationality'], e.target.value)} />
            </Field>
          </Row>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Parents</div>
            <Row cols="1fr 1fr 1fr 1fr">
              <Field label="Parent 1 — Family">
                <input value={form.beneficiary.parents.parent1.lastName} onChange={e => u(['beneficiary','parents','parent1','lastName'], e.target.value)} />
              </Field>
              <Field label="Parent 1 — Given">
                <input value={form.beneficiary.parents.parent1.firstName} onChange={e => u(['beneficiary','parents','parent1','firstName'], e.target.value)} />
              </Field>
              <Field label="Parent 1 — Middle">
                <input value={form.beneficiary.parents.parent1.middleName} onChange={e => u(['beneficiary','parents','parent1','middleName'], e.target.value)} />
              </Field>
              <Field label="Parent 1 — Country">
                <input value={form.beneficiary.parents.parent1.country} onChange={e => u(['beneficiary','parents','parent1','country'], e.target.value)} />
              </Field>
            </Row>
            <Row cols="1fr 1fr 1fr 1fr">
              <Field label="Parent 2 — Family">
                <input value={form.beneficiary.parents.parent2.lastName} onChange={e => u(['beneficiary','parents','parent2','lastName'], e.target.value)} />
              </Field>
              <Field label="Parent 2 — Given">
                <input value={form.beneficiary.parents.parent2.firstName} onChange={e => u(['beneficiary','parents','parent2','firstName'], e.target.value)} />
              </Field>
              <Field label="Parent 2 — Middle">
                <input value={form.beneficiary.parents.parent2.middleName} onChange={e => u(['beneficiary','parents','parent2','middleName'], e.target.value)} />
              </Field>
              <Field label="Parent 2 — Country">
                <input value={form.beneficiary.parents.parent2.country} onChange={e => u(['beneficiary','parents','parent2','country'], e.target.value)} />
              </Field>
            </Row>
          </div>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Other Names Used (if any)</div>
            {form.beneficiary.otherNames.map((n, i) => (
              <Row key={i} cols="1fr 1fr 1fr 80px">
                <Field label="Family">
                  <input value={n.lastName} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.otherNames[i].lastName = e.target.value; return c; })}/>
                </Field>
                <Field label="Given">
                  <input value={n.firstName} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.otherNames[i].firstName = e.target.value; return c; })}/>
                </Field>
                <Field label="Middle">
                  <input value={n.middleName} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.otherNames[i].middleName = e.target.value; return c; })}/>
                </Field>
                <div style={{ display:'flex', alignItems:'end' }}>
                  <ButtonLink onClick={() => setForm(p => { const c=clone(p); c.beneficiary.otherNames.splice(i,1); return c; })}>Remove</ButtonLink>
                </div>
              </Row>
            ))}
            <div><ButtonLink onClick={() => setForm(p => { const c=clone(p); c.beneficiary.otherNames.push(emptyName()); return c; })}>+ Add another name</ButtonLink></div>
          </div>

          <Row cols="1fr 1fr 1fr">
            <Field label="Beneficiary daytime phone">
              <input value={form.beneficiary.contact.daytimePhone} onChange={e => u(['beneficiary','contact','daytimePhone'], e.target.value)} />
            </Field>
            <Field label="Relationship to petitioner (fiancé(e)/spouse)">
              <input value={form.beneficiary.relationshipToPetitioner} onChange={e => u(['beneficiary','relationshipToPetitioner'], e.target.value)} />
            </Field>
            <div />
          </Row>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Last Entry / Passport</div>
            <Row cols="1fr 1fr 1fr">
              <Field label="Last arrived as (e.g., B2, VWP)">
                <input value={form.beneficiary.entry.lastArrivedAs} onChange={e => u(['beneficiary','entry','lastArrivedAs'], e.target.value)} />
              </Field>
              <Field label="I-94 / Arrival-Departure #">
                <input value={form.beneficiary.entry.i94} onChange={e => u(['beneficiary','entry','i94'], e.target.value)} />
              </Field>
              <Field label="Date of arrival">
                <input type="date" value={form.beneficiary.entry.arrivalDate} onChange={e => u(['beneficiary','entry','arrivalDate'], e.target.value)} />
              </Field>
            </Row>
            <Row cols="1fr 1fr 1fr">
              <Field label="Authorized stay expiration">
                <input type="date" value={form.beneficiary.entry.expiryDate} onChange={e => u(['beneficiary','entry','expiryDate'], e.target.value)} />
              </Field>
              <Field label="Passport #">
                <input value={form.beneficiary.entry.passportNumber} onChange={e => u(['beneficiary','entry','passportNumber'], e.target.value)} />
              </Field>
              <Field label="Travel doc # (if any)">
                <input value={form.beneficiary.entry.travelDocNumber} onChange={e => u(['beneficiary','entry','travelDocNumber'], e.target.value)} />
              </Field>
            </Row>
            <Row cols="1fr 1fr 1fr">
              <Field label="Country of issuance">
                <input value={form.beneficiary.entry.countryOfIssuance} onChange={e => u(['beneficiary','entry','countryOfIssuance'], e.target.value)} />
              </Field>
              <Field label="Passport expiration">
                <input type="date" value={form.beneficiary.entry.passportExp} onChange={e => u(['beneficiary','entry','passportExp'], e.target.value)} />
              </Field>
              <div />
            </Row>
          </div>
        </section>
      )}

      {/* Beneficiary addresses */}
      {step === 4 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Beneficiary — Addresses (last 5 years)</h3>
          {form.beneficiary.addresses.map((a, i) => (
            <div className="card" key={i} style={{ display: 'grid', gap: 10 }}>
              <Row cols="1fr 140px 1fr 1fr">
                <Field label="Street number & name">
                  <input value={a.street} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].street = e.target.value; return c; })}/>
                </Field>
                <Field label="Unit type">
                  <input value={a.unitType} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].unitType = e.target.value; return c; })}/>
                </Field>
                <Field label="Unit #">
                  <input value={a.unitNum} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].unitNum = e.target.value; return c; })}/>
                </Field>
                <div />
              </Row>
              <Row cols="1fr 0.6fr 0.6fr">
                <Field label="City">
                  <input value={a.city} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].city = e.target.value; return c; })}/>
                </Field>
                <Field label="State/Province">
                  <input value={a.state} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].state = e.target.value; return c; })}/>
                </Field>
                <Field label="ZIP/Postal">
                  <input value={a.zip} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].zip = e.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr 1fr">
                <Field label="Province (if any)">
                  <input value={a.province} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].province = e.target.value; return c; })}/>
                </Field>
                <Field label="Postal code (if any)">
                  <input value={a.postal} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].postal = e.target.value; return c; })}/>
                </Field>
                <Field label="Country">
                  <input value={a.country} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].country = e.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr">
                <Field label="Date from">
                  <input type="date" value={a.from} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].from = e.target.value; return c; })}/>
                </Field>
                <Field label="Date to (blank if current)">
                  <input type="date" value={a.to} onChange={e => setForm(p => { const c=clone(p); c.beneficiary.addresses[i].to = e.target.value; return c; })}/>
                </Field>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small">Make sure combined address history covers 5 years.</span>
                {form.beneficiary.addresses.length > 1 && (
                  <ButtonLink onClick={() => removeAt(['beneficiary','addresses'], i)}>Remove</ButtonLink>
                )}
              </div>
            </div>
          ))}
          <ButtonLink onClick={() => pushTo(['beneficiary','addresses'], emptyAddress)}>+ Add another address</ButtonLink>
        </section>
      )}

      {/* Beneficiary employment */}
      {step === 5 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Beneficiary — Employment (last 5 years)</h3>
          {form.beneficiary.employments.map((e, i) => (
            <div className="card" key={i} style={{ display: 'grid', gap: 10 }}>
              <Row cols="1fr 1fr">
                <Field label="Employer name">
                  <input value={e.employerName} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].employerName = ev.target.value; return c; })}/>
                </Field>
                <Field label="Occupation">
                  <input value={e.occupation} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].occupation = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 140px 1fr 1fr">
                <Field label="Street number & name">
                  <input value={e.street} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].street = ev.target.value; return c; })}/>
                </Field>
                <Field label="Unit type">
                  <input value={e.unitType} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].unitType = ev.target.value; return c; })}/>
                </Field>
                <Field label="Unit #">
                  <input value={e.unitNum} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].unitNum = ev.target.value; return c; })}/>
                </Field>
                <div />
              </Row>
              <Row cols="1fr 0.6fr 0.6fr">
                <Field label="City">
                  <input value={e.city} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].city = ev.target.value; return c; })}/>
                </Field>
                <Field label="State/Province">
                  <input value={e.state} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].state = ev.target.value; return c; })}/>
                </Field>
                <Field label="ZIP/Postal">
                  <input value={e.zip} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].zip = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr 1fr">
                <Field label="Province (if any)">
                  <input value={e.province} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].province = ev.target.value; return c; })}/>
                </Field>
                <Field label="Postal code (if any)">
                  <input value={e.postal} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].postal = ev.target.value; return c; })}/>
                </Field>
                <Field label="Country">
                  <input value={e.country} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].country = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <Row cols="1fr 1fr">
                <Field label="Date from">
                  <input type="date" value={e.from} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].from = ev.target.value; return c; })}/>
                </Field>
                <Field label="Date to (blank if current)">
                  <input type="date" value={e.to} onChange={ev => setForm(p => { const c=clone(p); c.beneficiary.employments[i].to = ev.target.value; return c; })}/>
                </Field>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small">Provide enough history to cover 5 years.</span>
                {form.beneficiary.employments.length > 1 && (
                  <ButtonLink onClick={() => removeAt(['beneficiary','employments'], i)}>Remove</ButtonLink>
                )}
              </div>
            </div>
          ))}
          <ButtonLink onClick={() => pushTo(['beneficiary','employments'], emptyEmployment)}>+ Add another employer</ButtonLink>
        </section>
      )}

      {/* Part 3 — Relationship & eligibility */}
      {step === 6 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 3. Other Information</h3>
          <Row cols="1fr 1fr">
            <Field label="Have you met your fiancé(e) in person in the last 2 years?">
              <select value={form.relationship.metInLastTwoYears} onChange={e => u(['relationship','metInLastTwoYears'], e.target.value)}>
                <option value="yes">Yes</option>
                <option value="no">No (explain in Part 8)</option>
              </select>
            </Field>
            <div />
          </Row>

          <Field label="How did you meet?">
            <textarea rows={4} value={form.relationship.howMet} onChange={e => u(['relationship','howMet'], e.target.value)} />
          </Field>

          <Field label="Important dates (met/engaged/visited)">
            <textarea rows={3} value={form.relationship.keyDates} onChange={e => u(['relationship','keyDates'], e.target.value)} />
          </Field>

          <Field label="Prior marriages / divorces (if any)">
            <textarea rows={3} value={form.relationship.priorMarriages} onChange={e => u(['relationship','priorMarriages'], e.target.value)} />
          </Field>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>International Marriage Broker (IMB)</div>
            <Row cols="1fr 1fr">
              <Field label="Did you use an IMB?">
                <select value={form.relationship.imb.usedBroker} onChange={e => u(['relationship','imb','usedBroker'], e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              <div />
            </Row>

            {form.relationship.imb.usedBroker === 'yes' && (
              <>
                <Row cols="1fr 1fr 1fr">
                  <Field label="IMB Name">
                    <input value={form.relationship.imb.name} onChange={e => u(['relationship','imb','name'], e.target.value)} />
                  </Field>
                  <Field label="IMB Contact (Family)">
                    <input value={form.relationship.imb.contactFamily} onChange={e => u(['relationship','imb','contactFamily'], e.target.value)} />
                  </Field>
                  <Field label="IMB Contact (Given)">
                    <input value={form.relationship.imb.contactGiven} onChange={e => u(['relationship','imb','contactGiven'], e.target.value)} />
                  </Field>
                </Row>
                <Row cols="1fr 1fr">
                  <Field label="Organization name">
                    <input value={form.relationship.imb.orgName} onChange={e => u(['relationship','imb','orgName'], e.target.value)} />
                  </Field>
                  <Field label="Website">
                    <input value={form.relationship.imb.website} onChange={e => u(['relationship','imb','website'], e.target.value)} />
                  </Field>
                </Row>
                <Row cols="1fr 1fr 1fr">
                  <Field label="Street">
                    <input value={form.relationship.imb.street} onChange={e => u(['relationship','imb','street'], e.target.value)} />
                  </Field>
                  <Field label="Unit #">
                    <input value={form.relationship.imb.unitNum} onChange={e => u(['relationship','imb','unitNum'], e.target.value)} />
                  </Field>
                  <Field label="City">
                    <input value={form.relationship.imb.city} onChange={e => u(['relationship','imb','city'], e.target.value)} />
                  </Field>
                </Row>
                <Row cols="1fr 1fr 1fr">
                  <Field label="State/Province">
                    <input value={form.relationship.imb.state} onChange={e => u(['relationship','imb','state'], e.target.value)} />
                  </Field>
                  <Field label="ZIP/Postal">
                    <input value={form.relationship.imb.zip} onChange={e => u(['relationship','imb','zip'], e.target.value)} />
                  </Field>
                  <Field label="Country">
                    <input value={form.relationship.imb.country} onChange={e => u(['relationship','imb','country'], e.target.value)} />
                  </Field>
                </Row>
                <Field label="Daytime telephone">
                  <input value={form.relationship.imb.phone} onChange={e => u(['relationship','imb','phone'], e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </section>
      )}

      {/* Part 4 & 5 */}
      {step === 7 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 4 & 5. Contact & Signatures</h3>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Petitioner contact</div>
            <Row cols="1fr 1fr 1fr">
              <Field label="Daytime telephone">
                <input value={form.signatures.petitioner.daytimePhone} onChange={e => u(['signatures','petitioner','daytimePhone'], e.target.value)} />
              </Field>
              <Field label="Mobile">
                <input value={form.signatures.petitioner.mobile} onChange={e => u(['signatures','petitioner','mobile'], e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.signatures.petitioner.email} onChange={e => u(['signatures','petitioner','email'], e.target.value)} />
              </Field>
            </Row>
            <Field label="Date of signature (you will sign the printed form)">
              <input type="date" value={form.signatures.petitioner.date} onChange={e => u(['signatures','petitioner','date'], e.target.value)} />
            </Field>
          </div>
        </section>
      )}

      {/* Part 6 & 7 */}
      {step === 8 && (
        <section style={{ display: 'grid', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Part 6 & 7. Interpreter / Preparer</h3>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Interpreter</div>
            <Row cols="1fr 1fr">
              <Field label="Used an Interpreter?">
                <select value={form.interpreter.used} onChange={e => u(['interpreter','used'], e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              <div />
            </Row>
            {form.interpreter.used === 'yes' && (
              <>
                <Row cols="1fr 1fr 1fr">
                  <Field label="Family name">
                    <input value={form.interpreter.name.lastName} onChange={e => u(['interpreter','name','lastName'], e.target.value)} />
                  </Field>
                  <Field label="Given name">
                    <input value={form.interpreter.name.firstName} onChange={e => u(['interpreter','name','firstName'], e.target.value)} />
                  </Field>
                  <Field label="Business/Org (if any)">
                    <input value={form.interpreter.business} onChange={e => u(['interpreter','business'], e.target.value)} />
                  </Field>
                </Row>
                <Row cols="1fr 1fr 1fr">
                  <Field label="Daytime telephone">
                    <input value={form.interpreter.daytimePhone} onChange={e => u(['interpreter','daytimePhone'], e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={form.interpreter.email} onChange={e => u(['interpreter','email'], e.target.value)} />
                  </Field>
                  <Field label="Language">
                    <input value={form.interpreter.language} onChange={e => u(['interpreter','language'], e.target.value)} />
                  </Field>
                </Row>
                <Field label="Date of signature">
                  <input type="date" value={form.interpreter.date} onChange={e => u(['interpreter','date'], e.target.value)} />
                </Field>
              </>
            )}
          </div>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 600 }}>Preparer</div>
            <Row cols="1fr 1fr">
              <Field label="Used a Preparer?">
                <select value={form.preparer.used} onChange={e => u(['preparer','used'], e.target.value)}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              <div />
            </Row>
            {form.preparer.used === 'yes' && (
              <>
                <Row cols="1fr 1fr 1fr">
                  <Field label="Family name">
                    <input value={form.preparer.name.lastName} onChange={e => u(['preparer','name','lastName'], e.target.value)} />
                  </Field>
                  <Field label="Given name">
                    <input value={form.preparer.name.firstName} onChange={e => u(['preparer','name','firstName'], e.target.value)} />
                  </Field>
                  <Field label="Business/Org (if any)">
                    <input value={form.preparer.business} onChange={e => u(['preparer','business'], e.target.value)} />
                  </Field>
                </Row>
                <Row cols="1fr 1fr 1fr">
                  <Field label="Daytime telephone">
                    <input value={form.preparer.daytimePhone} onChange={e => u(['preparer','daytimePhone'], e.target.value)} />
                  </Field>
                  <Field label="Mobile">
                    <input value={form.preparer.mobile} onChange={e => u(['preparer','mobile'], e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={form.preparer.email} onChange={e => u(['preparer','email'], e.target.value)} />
                  </Field>
                </Row>
                <Field label="Date of signature">
                  <input type="date" value={form.preparer.date} onChange={e => u(['preparer','date'], e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </section>
      )}

      {/* Review & download */}
      {step === 9 && (
        <section style={{ display: 'grid', gap: 10 }}>
          <h3 style={{ margin: 0 }}>Review & download</h3>
          <div className="small">Save your progress, then download a draft PDF to check field placement.</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <a className="small" href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">Debug overlay</a>
          </div>
        </section>
      )}

      {/* Footer nav */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={back} className="btn" disabled={step === 0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step === STEPS.length - 1}>Next</button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>
    </div>
  );
}

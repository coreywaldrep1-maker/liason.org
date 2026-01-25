// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Part 1 — Petitioner' },
  { key: 'mailing', label: 'Part 1 — Mailing' },
  { key: 'physical', label: 'Part 1 — Physical' },
  { key: 'employment', label: 'Part 1 — Employment' },
  { key: 'classification', label: 'Part 2 — Classification' },
  { key: 'review', label: 'Review & Download' },
];

const EMPTY = {
  petitioner: {
    aNumber: '',
    uscisOnlineAccount: '',
    ssn: '',
    lastName: '',
    firstName: '',
    middleName: '',
    otherNames: [{ lastName: '', firstName: '', middleName: '' }],
    dob: '',
    cityBirth: '',
    provinceBirth: '',
    countryBirth: '',
    phone: '',
    email: '',
  },
  mailing: {
    inCareOf: '',
    street: '',
    unitNum: '',
    city: '',
    state: '',
    zip: '',
    province: '',
    postal: '',
    country: 'United States',
    sameAsPhysical: false,
  },
  physicalAddresses: [
    { street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: 'United States' },
    { street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: 'United States' },
  ],
  employment: [
    { employer: '', occupation: '', street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: 'United States', from: '', to: '' },
    { employer: '', occupation: '', street: '', unitNum: '', city: '', state: '', zip: '', province: '', postal: '', country: 'United States', from: '', to: '' },
  ],
  classification: {
    type: 'k1', // 'k1' | 'k3'
    i130Filed: false, // only relevant if type === 'k3'
  },
  part8: {
    line3d: '',
    line4d: '',
    line5d: '',
    line6d: '',
  },
  // optional override map: exact PDF field name -> value
  other: {},
};

function deepClone(x) {
  if (typeof structuredClone === 'function') return structuredClone(x);
  return JSON.parse(JSON.stringify(x));
}

function pathToParts(p) {
  return String(p)
    .replaceAll('[', '.')
    .replaceAll(']', '')
    .split('.')
    .filter(Boolean);
}

function getByPath(obj, p) {
  const parts = pathToParts(p);
  let cur = obj;
  for (const k of parts) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function setByPath(obj, p, value) {
  const parts = pathToParts(p);
  const next = deepClone(obj ?? {});
  let cur = next;
  for (let i = 0; i < parts.length; i++) {
    const k = parts[i];
    const last = i === parts.length - 1;
    if (last) {
      cur[k] = value;
    } else {
      const n = Number(parts[i + 1]);
      const wantArr = Number.isInteger(n);
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = wantArr ? [] : {};
      cur = cur[k];
    }
  }
  return next;
}

function isUSLike(country) {
  const c = String(country || '').trim().toLowerCase();
  return c === 'united states' || c === 'usa' || c === 'us' || c === 'u.s.' || c === 'u.s.a.';
}

function SmallNote({ children }) {
  return <div className="small" style={{ color: '#64748b' }}>{children}</div>;
}

function Card({ title, children, right }) {
  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {right ?? null}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(12, 1fr)' }}>{children}</div>;
}

function Col({ span = 12, children }) {
  return <div style={{ gridColumn: `span ${span}` }}>{children}</div>;
}

function Field({ label, value, onChange, type = 'text', placeholder, help }) {
  return (
    <label className="small" style={{ display: 'grid', gap: 6 }}>
      <span>
        <b>{label}</b>
      </span>
      {type === 'textarea' ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      ) : type === 'select' ? (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {/* options injected by caller via children */}
        </select>
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
      {help ? <SmallNote>{help}</SmallNote> : null}
    </label>
  );
}

export default function I129fWizard() {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx]?.key || 'petitioner';

  const [form, setForm] = useState(() => deepClone(EMPTY));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const mailingCountry = getByPath(form, 'mailing.country');
  const mailingIsUS = isUSLike(mailingCountry);

  useEffect(() => {
    // Load saved data once on mount
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store', credentials: 'include' });
        const j = await r.json().catch(() => ({}));
        if (j?.ok && j?.data && typeof j.data === 'object') {
          // merge saved onto EMPTY so missing keys don’t break the UI
          const merged = deepClone(EMPTY);
          Object.assign(merged, j.data);
          // deep-merge common subobjects
          merged.petitioner = { ...deepClone(EMPTY.petitioner), ...(j.data.petitioner || {}) };
          merged.mailing = { ...deepClone(EMPTY.mailing), ...(j.data.mailing || {}) };
          merged.classification = { ...deepClone(EMPTY.classification), ...(j.data.classification || {}) };
          merged.part8 = { ...deepClone(EMPTY.part8), ...(j.data.part8 || {}) };
          merged.physicalAddresses = Array.isArray(j.data.physicalAddresses) ? j.data.physicalAddresses : deepClone(EMPTY.physicalAddresses);
          merged.employment = Array.isArray(j.data.employment) ? j.data.employment : deepClone(EMPTY.employment);
          if (!Array.isArray(merged.petitioner.otherNames) || merged.petitioner.otherNames.length === 0) {
            merged.petitioner.otherNames = deepClone(EMPTY.petitioner.otherNames);
          }
          setForm(merged);
          setLastSavedAt(j.updated_at || null);
          setStatus('Loaded saved draft.');
          setTimeout(() => setStatus(''), 2000);
        }
      } catch {
        // ignore quietly (not logged in, etc.)
      }
    })();
  }, []);

  const setField = (path, value) => {
    setForm((prev) => setByPath(prev, path, value));
  };

  const canPrev = stepIdx > 0;
  const canNext = stepIdx < STEPS.length - 1;

  async function saveDraft() {
    setBusy(true);
    setStatus('');
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j?.ok) throw new Error(j?.error || 'Save failed');
      setStatus('Saved.');
      setLastSavedAt(new Date().toISOString());
      setTimeout(() => setStatus(''), 2000);
      return true;
    } catch (e) {
      console.error(e);
      setStatus(`Save error: ${e?.message || e}`);
      return false;
    } finally {
      setBusy(false);
    }
  }

  // ✅ The key: POST current in-memory answers to generate a filled PDF
  async function downloadPdfFromCurrentAnswers() {
    setBusy(true);
    setStatus('');
    try {
      // strongly recommended so the user doesn’t lose work
      await saveDraft();

      const r = await fetch('/api/i129f/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: form }),
      });

      const ct = (r.headers.get('content-type') || '').toLowerCase();
      if (!r.ok || !ct.includes('application/pdf')) {
        const txt = await r.text().catch(() => '');
        throw new Error(txt || `PDF download failed (${r.status})`);
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'i-129f-filled.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus('PDF generated.');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error(e);
      setStatus(`PDF error: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  // If mailing is same as physical, keep them in sync (using physicalAddresses[0])
  useEffect(() => {
    const same = !!getByPath(form, 'mailing.sameAsPhysical');
    if (!same) return;

    const phys0 = getByPath(form, 'physicalAddresses[0]') || {};
    const nextMailing = {
      ...(getByPath(form, 'mailing') || {}),
      street: phys0.street || '',
      unitNum: phys0.unitNum || '',
      city: phys0.city || '',
      state: phys0.state || '',
      zip: phys0.zip || '',
      province: phys0.province || '',
      postal: phys0.postal || '',
      country: phys0.country || 'United States',
    };
    setForm((prev) => setByPath(prev, 'mailing', nextMailing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getByPath(form, 'mailing.sameAsPhysical'),
    getByPath(form, 'physicalAddresses[0].street'),
    getByPath(form, 'physicalAddresses[0].unitNum'),
    getByPath(form, 'physicalAddresses[0].city'),
    getByPath(form, 'physicalAddresses[0].state'),
    getByPath(form, 'physicalAddresses[0].zip'),
    getByPath(form, 'physicalAddresses[0].province'),
    getByPath(form, 'physicalAddresses[0].postal'),
    getByPath(form, 'physicalAddresses[0].country'),
  ]);

  const headerRight = useMemo(() => {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <button className="btn" type="button" onClick={saveDraft} disabled={busy}>
          {busy ? 'Working…' : 'Save draft'}
        </button>
        <button className="btn btn-primary" type="button" onClick={downloadPdfFromCurrentAnswers} disabled={busy}>
          {busy ? 'Preparing…' : 'Download filled PDF'}
        </button>
      </div>
    );
  }, [busy]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Step tabs */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {STEPS.map((s, idx) => (
          <button
            key={s.key}
            type="button"
            className={idx === stepIdx ? 'btn btn-primary' : 'btn'}
            onClick={() => setStepIdx(idx)}
          >
            {s.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }} className="small">
          {status ? <b>{status}</b> : lastSavedAt ? `Last saved: ${String(lastSavedAt).slice(0, 19).replace('T', ' ')}` : ''}
        </div>
      </div>

      {/* Step content */}
      {step === 'petitioner' && (
        <Card title="Part 1 — Petitioner Information" right={headerRight}>
          <Row>
            <Col span={4}>
              <Field
                label="A-Number (if any)"
                value={getByPath(form, 'petitioner.aNumber')}
                onChange={(v) => setField('petitioner.aNumber', v)}
                placeholder="A123456789"
              />
            </Col>
            <Col span={4}>
              <Field
                label="USCIS Online Account Number (if any)"
                value={getByPath(form, 'petitioner.uscisOnlineAccount')}
                onChange={(v) => setField('petitioner.uscisOnlineAccount', v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Social Security Number (if any)"
                value={getByPath(form, 'petitioner.ssn')}
                onChange={(v) => setField('petitioner.ssn', v)}
              />
            </Col>
          </Row>

          <Row>
            <Col span={4}>
              <Field
                label="Family Name (Last)"
                value={getByPath(form, 'petitioner.lastName')}
                onChange={(v) => setField('petitioner.lastName', v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Given Name (First)"
                value={getByPath(form, 'petitioner.firstName')}
                onChange={(v) => setField('petitioner.firstName', v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Middle Name"
                value={getByPath(form, 'petitioner.middleName')}
                onChange={(v) => setField('petitioner.middleName', v)}
              />
            </Col>
          </Row>

          <Card
            title="Other Names Used (optional)"
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const arr = deepClone(getByPath(form, 'petitioner.otherNames') || []);
                    arr.push({ lastName: '', firstName: '', middleName: '' });
                    setField('petitioner.otherNames', arr);
                  }}
                >
                  + Add
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const arr = deepClone(getByPath(form, 'petitioner.otherNames') || []);
                    if (arr.length <= 1) return;
                    arr.pop();
                    setField('petitioner.otherNames', arr);
                  }}
                >
                  − Remove
                </button>
              </div>
            }
          >
            {(getByPath(form, 'petitioner.otherNames') || []).map((_, idx) => (
              <Row key={idx}>
                <Col span={4}>
                  <Field
                    label={`Other Last Name #${idx + 1}`}
                    value={getByPath(form, `petitioner.otherNames[${idx}].lastName`)}
                    onChange={(v) => setField(`petitioner.otherNames[${idx}].lastName`, v)}
                  />
                </Col>
                <Col span={4}>
                  <Field
                    label={`Other First Name #${idx + 1}`}
                    value={getByPath(form, `petitioner.otherNames[${idx}].firstName`)}
                    onChange={(v) => setField(`petitioner.otherNames[${idx}].firstName`, v)}
                  />
                </Col>
                <Col span={4}>
                  <Field
                    label={`Other Middle Name #${idx + 1}`}
                    value={getByPath(form, `petitioner.otherNames[${idx}].middleName`)}
                    onChange={(v) => setField(`petitioner.otherNames[${idx}].middleName`, v)}
                  />
                </Col>
              </Row>
            ))}
            <SmallNote>
              If you have more names than fit on the form, you can add details in Part 8 (Additional Information) on the Review step.
            </SmallNote>
          </Card>

          <Row>
            <Col span={4}>
              <Field
                label="Date of Birth"
                type="date"
                value={getByPath(form, 'petitioner.dob')}
                onChange={(v) => setField('petitioner.dob', v)}
                help="Use the date picker; we convert to MM/DD/YYYY for the PDF."
              />
            </Col>
            <Col span={4}>
              <Field
                label="City/Town/Village of Birth"
                value={getByPath(form, 'petitioner.cityBirth')}
                onChange={(v) => setField('petitioner.cityBirth', v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="State/Province of Birth"
                value={getByPath(form, 'petitioner.provinceBirth')}
                onChange={(v) => setField('petitioner.provinceBirth', v)}
              />
            </Col>
          </Row>

          <Row>
            <Col span={6}>
              <Field
                label="Country of Birth"
                value={getByPath(form, 'petitioner.countryBirth')}
                onChange={(v) => setField('petitioner.countryBirth', v)}
              />
            </Col>
            <Col span={3}>
              <Field
                label="Phone"
                value={getByPath(form, 'petitioner.phone')}
                onChange={(v) => setField('petitioner.phone', v)}
                placeholder="Digits only preferred"
              />
            </Col>
            <Col span={3}>
              <Field
                label="Email"
                type="email"
                value={getByPath(form, 'petitioner.email')}
                onChange={(v) => setField('petitioner.email', v)}
              />
            </Col>
          </Row>

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}

      {step === 'mailing' && (
        <Card title="Part 1 — Mailing Address" right={headerRight}>
          <Row>
            <Col span={6}>
              <Field
                label="In Care Of (if any)"
                value={getByPath(form, 'mailing.inCareOf')}
                onChange={(v) => setField('mailing.inCareOf', v)}
              />
            </Col>
            <Col span={6}>
              <Field
                label="Country"
                value={getByPath(form, 'mailing.country')}
                onChange={(v) => setField('mailing.country', v)}
                placeholder="United States"
                help="If not U.S., use Province + Postal Code instead of State + ZIP."
              />
            </Col>
          </Row>

          <Row>
            <Col span={8}>
              <Field
                label="Street Number and Name"
                value={getByPath(form, 'mailing.street')}
                onChange={(v) => setField('mailing.street', v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Apt/Ste/Flr (Unit)"
                value={getByPath(form, 'mailing.unitNum')}
                onChange={(v) => setField('mailing.unitNum', v)}
              />
            </Col>
          </Row>

          <Row>
            <Col span={4}>
              <Field
                label="City"
                value={getByPath(form, 'mailing.city')}
                onChange={(v) => setField('mailing.city', v)}
              />
            </Col>

            {mailingIsUS ? (
              <>
                <Col span={4}>
                  <Field
                    label="State"
                    value={getByPath(form, 'mailing.state')}
                    onChange={(v) => setField('mailing.state', v)}
                    placeholder="OK"
                  />
                </Col>
                <Col span={4}>
                  <Field
                    label="ZIP Code"
                    value={getByPath(form, 'mailing.zip')}
                    onChange={(v) => setField('mailing.zip', v)}
                    placeholder="74133"
                  />
                </Col>
              </>
            ) : (
              <>
                <Col span={4}>
                  <Field
                    label="Province"
                    value={getByPath(form, 'mailing.province')}
                    onChange={(v) => setField('mailing.province', v)}
                  />
                </Col>
                <Col span={4}>
                  <Field
                    label="Postal Code"
                    value={getByPath(form, 'mailing.postal')}
                    onChange={(v) => setField('mailing.postal', v)}
                  />
                </Col>
              </>
            )}
          </Row>

          <Row>
            <Col span={6}>
              <Field
                label="Mailing same as Physical Address?"
                type="checkbox"
                value={getByPath(form, 'mailing.sameAsPhysical')}
                onChange={(v) => setField('mailing.sameAsPhysical', v)}
                help="If checked, we will copy Physical Address #1 into Mailing."
              />
            </Col>
          </Row>

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}

      {step === 'physical' && (
        <Card title="Part 1 — Physical Addresses (last 5 years)" right={headerRight}>
          <AddressBlock
            title="Physical Address #1"
            basePath="physicalAddresses[0]"
            form={form}
            setField={setField}
          />
          <AddressBlock
            title="Physical Address #2 (optional)"
            basePath="physicalAddresses[1]"
            form={form}
            setField={setField}
          />

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}

      {step === 'employment' && (
        <Card title="Part 1 — Employment (last 5 years)" right={headerRight}>
          <EmploymentBlock title="Employment #1" basePath="employment[0]" form={form} setField={setField} />
          <EmploymentBlock title="Employment #2 (optional)" basePath="employment[1]" form={form} setField={setField} />

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}

      {step === 'classification' && (
        <Card title="Part 2 — Classification" right={headerRight}>
          <Row>
            <Col span={6}>
              <label className="small" style={{ display: 'grid', gap: 6 }}>
                <span>
                  <b>Petition Type</b>
                </span>
                <select
                  value={getByPath(form, 'classification.type') || 'k1'}
                  onChange={(e) => setField('classification.type', e.target.value)}
                >
                  <option value="k1">K-1 (Fiancé(e))</option>
                  <option value="k3">K-3 (Spouse)</option>
                </select>
                <SmallNote>
                  If you select K-3, the form may require confirming whether you filed Form I-130.
                </SmallNote>
              </label>
            </Col>

            <Col span={6}>
              {String(getByPath(form, 'classification.type') || '').toLowerCase() === 'k3' ? (
                <Field
                  label="Have you filed Form I-130 for the beneficiary?"
                  type="checkbox"
                  value={getByPath(form, 'classification.i130Filed')}
                  onChange={(v) => setField('classification.i130Filed', v)}
                />
              ) : (
                <SmallNote>Tip: For most fiancé(e) petitions, choose K-1.</SmallNote>
              )}
            </Col>
          </Row>

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}

      {step === 'review' && (
        <Card title="Review & Download" right={headerRight}>
          <SmallNote>
            The **Download filled PDF** button posts your current answers to the server and returns a completed AcroForm PDF.
            If your PDF still looks blank, open it in Adobe Reader (Chrome sometimes hides appearances).
          </SmallNote>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <h4 style={{ margin: 0 }}>Quick checklist</h4>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Petitioner name + DOB are complete</li>
              <li>Mailing address is complete</li>
              <li>Physical address #1 is complete</li>
              <li>Employment #1 is complete (if applicable)</li>
            </ul>
          </div>

          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <h4 style={{ margin: 0 }}>Part 8 (Additional Information) — optional</h4>
            <Row>
              <Col span={6}>
                <Field
                  label="Line 3.d Additional Info"
                  type="textarea"
                  value={getByPath(form, 'part8.line3d')}
                  onChange={(v) => setField('part8.line3d', v)}
                  placeholder="Extra details if you ran out of space on the form…"
                />
              </Col>
              <Col span={6}>
                <Field
                  label="Line 4.d Additional Info"
                  type="textarea"
                  value={getByPath(form, 'part8.line4d')}
                  onChange={(v) => setField('part8.line4d', v)}
                />
              </Col>
              <Col span={6}>
                <Field
                  label="Line 5.d Additional Info"
                  type="textarea"
                  value={getByPath(form, 'part8.line5d')}
                  onChange={(v) => setField('part8.line5d', v)}
                />
              </Col>
              <Col span={6}>
                <Field
                  label="Line 6.d Additional Info"
                  type="textarea"
                  value={getByPath(form, 'part8.line6d')}
                  onChange={(v) => setField('part8.line6d', v)}
                />
              </Col>
            </Row>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" type="button" onClick={() => setStepIdx(0)}>
              Back to start
            </button>
            <button className="btn" type="button" onClick={saveDraft} disabled={busy}>
              {busy ? 'Working…' : 'Save draft'}
            </button>
            <button className="btn btn-primary" type="button" onClick={downloadPdfFromCurrentAnswers} disabled={busy}>
              {busy ? 'Preparing…' : 'Download filled PDF'}
            </button>

            {/* Optional fallback: if you keep a GET route */}
            <a className="btn" href="/api/i129f/pdf" target="_blank" rel="noreferrer">
              Download (server copy)
            </a>
          </div>

          <NavButtons
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => setStepIdx((i) => Math.max(0, i - 1))}
            onNext={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
          />
        </Card>
      )}
    </div>
  );
}

function NavButtons({ canPrev, canNext, onPrev, onNext }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
      <button className="btn" type="button" onClick={onPrev} disabled={!canPrev}>
        ← Previous
      </button>
      <button className="btn btn-primary" type="button" onClick={onNext} disabled={!canNext}>
        Next →
      </button>
    </div>
  );
}

function AddressBlock({ title, basePath, form, setField }) {
  const country = getByPath(form, `${basePath}.country`);
  const isUS = isUSLike(country);

  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <h4 style={{ margin: 0 }}>{title}</h4>
      <Row>
        <Col span={6}>
          <Field
            label="Country"
            value={getByPath(form, `${basePath}.country`)}
            onChange={(v) => setField(`${basePath}.country`, v)}
            placeholder="United States"
          />
        </Col>
        <Col span={6}>
          <SmallNote>For non-U.S. addresses, use Province + Postal Code.</SmallNote>
        </Col>
      </Row>
      <Row>
        <Col span={8}>
          <Field
            label="Street Number and Name"
            value={getByPath(form, `${basePath}.street`)}
            onChange={(v) => setField(`${basePath}.street`, v)}
          />
        </Col>
        <Col span={4}>
          <Field
            label="Apt/Ste/Flr (Unit)"
            value={getByPath(form, `${basePath}.unitNum`)}
            onChange={(v) => setField(`${basePath}.unitNum`, v)}
          />
        </Col>
      </Row>
      <Row>
        <Col span={4}>
          <Field
            label="City"
            value={getByPath(form, `${basePath}.city`)}
            onChange={(v) => setField(`${basePath}.city`, v)}
          />
        </Col>

        {isUS ? (
          <>
            <Col span={4}>
              <Field
                label="State"
                value={getByPath(form, `${basePath}.state`)}
                onChange={(v) => setField(`${basePath}.state`, v)}
                placeholder="OK"
              />
            </Col>
            <Col span={4}>
              <Field
                label="ZIP"
                value={getByPath(form, `${basePath}.zip`)}
                onChange={(v) => setField(`${basePath}.zip`, v)}
                placeholder="74133"
              />
            </Col>
          </>
        ) : (
          <>
            <Col span={4}>
              <Field
                label="Province"
                value={getByPath(form, `${basePath}.province`)}
                onChange={(v) => setField(`${basePath}.province`, v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Postal Code"
                value={getByPath(form, `${basePath}.postal`)}
                onChange={(v) => setField(`${basePath}.postal`, v)}
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}

function EmploymentBlock({ title, basePath, form, setField }) {
  const country = getByPath(form, `${basePath}.country`);
  const isUS = isUSLike(country);

  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <h4 style={{ margin: 0 }}>{title}</h4>

      <Row>
        <Col span={6}>
          <Field
            label="Employer Name"
            value={getByPath(form, `${basePath}.employer`)}
            onChange={(v) => setField(`${basePath}.employer`, v)}
          />
        </Col>
        <Col span={6}>
          <Field
            label="Occupation"
            value={getByPath(form, `${basePath}.occupation`)}
            onChange={(v) => setField(`${basePath}.occupation`, v)}
          />
        </Col>
      </Row>

      <Row>
        <Col span={6}>
          <Field
            label="From (date)"
            type="date"
            value={getByPath(form, `${basePath}.from`)}
            onChange={(v) => setField(`${basePath}.from`, v)}
          />
        </Col>
        <Col span={6}>
          <Field
            label="To (date)"
            type="date"
            value={getByPath(form, `${basePath}.to`)}
            onChange={(v) => setField(`${basePath}.to`, v)}
            help="Leave blank if current."
          />
        </Col>
      </Row>

      <Row>
        <Col span={6}>
          <Field
            label="Country"
            value={getByPath(form, `${basePath}.country`)}
            onChange={(v) => setField(`${basePath}.country`, v)}
            placeholder="United States"
          />
        </Col>
        <Col span={6}>
          <SmallNote>For non-U.S. addresses, use Province + Postal Code.</SmallNote>
        </Col>
      </Row>

      <Row>
        <Col span={8}>
          <Field
            label="Street Number and Name"
            value={getByPath(form, `${basePath}.street`)}
            onChange={(v) => setField(`${basePath}.street`, v)}
          />
        </Col>
        <Col span={4}>
          <Field
            label="Apt/Ste/Flr (Unit)"
            value={getByPath(form, `${basePath}.unitNum`)}
            onChange={(v) => setField(`${basePath}.unitNum`, v)}
          />
        </Col>
      </Row>

      <Row>
        <Col span={4}>
          <Field
            label="City"
            value={getByPath(form, `${basePath}.city`)}
            onChange={(v) => setField(`${basePath}.city`, v)}
          />
        </Col>

        {isUS ? (
          <>
            <Col span={4}>
              <Field
                label="State"
                value={getByPath(form, `${basePath}.state`)}
                onChange={(v) => setField(`${basePath}.state`, v)}
                placeholder="OK"
              />
            </Col>
            <Col span={4}>
              <Field
                label="ZIP"
                value={getByPath(form, `${basePath}.zip`)}
                onChange={(v) => setField(`${basePath}.zip`, v)}
                placeholder="74133"
              />
            </Col>
          </>
        ) : (
          <>
            <Col span={4}>
              <Field
                label="Province"
                value={getByPath(form, `${basePath}.province`)}
                onChange={(v) => setField(`${basePath}.province`, v)}
              />
            </Col>
            <Col span={4}>
              <Field
                label="Postal Code"
                value={getByPath(form, `${basePath}.postal`)}
                onChange={(v) => setField(`${basePath}.postal`, v)}
              />
            </Col>
          </>
        )}
      </Row>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

/**
 * This wizard saves data under a nested shape that matches lib/i129f-map.js:
 * relationship, petitioner (with name/mailing/physical/prevAddresses/jobs/contact),
 * beneficiary (same ideas), etc. Missing values are fine—the PDF filler skips them.
 */

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses',  label: 'Addresses' },
  { key: 'beneficiary',label: 'Beneficiary' },
  { key: 'history',    label: 'Relationship & history' },
  { key: 'review',     label: 'Review & download' },
];

// ---------- tiny helpers to read/set nested paths ----------

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

// simple controlled setter
function useSetter(form, setForm) {
  return (path) => (eOrVal) => {
    const value = typeof eOrVal === 'object' && eOrVal?.target !== undefined
      ? eOrVal.target.value
      : eOrVal;
    setForm(prev => {
      const copy = structuredClone(prev);
      setByPath(copy, path, value);
      return copy;
    });
  };
}

// ---------- main component ----------

export default function I129fWizard() {
  const [step, setStep]   = useState(0);
  const [busy, setBusy]   = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm]   = useState(() => ({
    relationship: {
      classification: 'K1',    // 'K1' or 'K3'
      i130Filed: false
    },
    petitioner: {
      aNumber: '', uscisAccount: '', ssn: '',
      name: { last:'', first:'', middle:'' },
      otherNames: [], // [{last,first,middle}]
      mailingSameAsPhysical: true,
      mailing:  { inCareOf:'', street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
      physical: { street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
      prevAddresses: [
        { street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US', dateFrom:'', dateTo:'' },
        { street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US', dateFrom:'', dateTo:'' }
      ],
      jobs: [
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' }
      ],
      contact: { dayPhone:'', mobile:'', email:'' },
      signature: { date:'' }
    },
    beneficiary: {
      aNumber:'', ssn:'', dob:'',
      name: { last:'', first:'', middle:'' },
      birth: { city:'', country:'' },
      citizenship:'',
      mailing:  { inCareOf:'', street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
      physical: { street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
      jobs: [
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' }
      ],
      parents: [
        { first:'', last:'', middle:'', dob:'', deceased:false, citizenship:'', birth:{ city:'', country:'' } }
      ],
      travel: {
        arrivedAs:'', i94:'', dateArrival:'', dateExpiry:'',
        passportNumber:'', travelDocNumber:'', passportCountry:'', passportExp:''
      },
      traits: { race: { white:false, asian:false, black:false, nativeAmerican:false, pacificIslander:false } }
    },
    interpreter: {
      name:{ first:'', last:'' }, business:'', language:'',
      phone:{ area:'', number:'' }, email:'', signatureDate:''
    },
    preparer: {
      name:{ first:'', last:'' }, business:'', dayPhone:'', mobile:'', email:'', signatureDate:''
    },
    additional: []
  }));

  const set = useSetter(form, setForm);

  // Load previously saved draft (if any)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.ok && j.data) {
          // Merge shallowly — prefer saved keys
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch {}
    })();
  }, []);

  async function save() {
    setBusy(true);
    setNotice('');
    try {
      const r = await fetch('/api/i129f/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: form }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Save failed');
      setNotice('Progress saved.');
    } catch (e) {
      console.error(e);
      setNotice('Save failed. Please make sure you are logged in and try again.');
    } finally {
      setBusy(false);
      setTimeout(() => setNotice(''), 4000);
    }
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  // If "mailing same as physical" is toggled true, copy mailing into physical (one-time copy)
  function onMailingSameToggle(val) {
    set('petitioner.mailingSameAsPhysical')(val);
    if (val) {
      const m = getByPath(form, 'petitioner.mailing') || {};
      setForm(prev => ({
        ...prev,
        petitioner: {
          ...prev.petitioner,
          physical: { ...m }
        }
      }));
    }
  }

  // UI helpers
  const Row = ({ children }) => <div style={{display:'grid', gap:8}}>{children}</div>;
  const TwoCol = ({ children }) => (
    <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr', alignItems:'end'}}>{children}</div>
  );
  const Field = ({ label, children, hint }) => (
    <label className="small" style={{display:'grid', gap:6}}>
      <span style={{fontWeight:600}}>{label}</span>
      {hint && <span style={{color:'#64748b'}}>{hint}</span>}
      <div style={{display:'grid'}}>{children}</div>
    </label>
  );

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      {/* step tabs */}
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStep(i)}
            className="small"
            style={{
              padding:'6px 10px',
              border:'1px solid #e2e8f0',
              borderRadius:8,
              background: i===step ? '#eef2ff' : '#fff'
            }}
          >
            {i+1}. {s.label}
          </button>
        ))}
      </div>

      {/* STEP 0: Petitioner */}
      {step===0 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>

          <TwoCol>
            <Field label="Classification">
              <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <label className="small" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
                  <input type="radio"
                         name="class"
                         checked={getByPath(form,'relationship.classification')==='K1'}
                         onChange={()=>set('relationship.classification')('K1')} />
                  K-1 Fiancé(e)
                </label>
                <label className="small" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
                  <input type="radio"
                         name="class"
                         checked={getByPath(form,'relationship.classification')==='K3'}
                         onChange={()=>set('relationship.classification')('K3')} />
                  K-3 Spouse
                </label>
              </div>
            </Field>

            {getByPath(form,'relationship.classification')==='K3' && (
              <Field label="If K-3: Have you filed Form I-130 for your spouse?">
                <select
                  value={getByPath(form,'relationship.i130Filed') ? 'yes':'no'}
                  onChange={(e)=>set('relationship.i130Filed')(e.target.value==='yes')}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            )}
          </TwoCol>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Your name</h4>
            <TwoCol>
              <Field label="Family name (last)">
                <input value={getByPath(form,'petitioner.name.last')||''}
                       onChange={set('petitioner.name.last')} />
              </Field>
              <Field label="Given name (first)">
                <input value={getByPath(form,'petitioner.name.first')||''}
                       onChange={set('petitioner.name.first')} />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Middle name">
                <input value={getByPath(form,'petitioner.name.middle')||''}
                       onChange={set('petitioner.name.middle')} />
              </Field>
              <div />
            </TwoCol>
          </Row>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Other names used</h4>
            <Field label="Have you used any other names? (aliases, maiden, nicknames)">
              <select
                value={(getByPath(form,'petitioner.otherNames')||[]).length>0 ? 'yes':'no'}
                onChange={(e)=>{
                  const yes = e.target.value==='yes';
                  setForm(prev => {
                    const copy = structuredClone(prev);
                    copy.petitioner.otherNames = yes ? (prev.petitioner.otherNames?.length? prev.petitioner.otherNames : [{last:'',first:'',middle:''}]) : [];
                    return copy;
                  });
                }}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            {(getByPath(form,'petitioner.otherNames')||[]).slice(0,1).map((_,i)=>(
              <TwoCol key={i}>
                <Field label="Other family name (last)">
                  <input value={getByPath(form,`petitioner.otherNames[${i}].last`)||''}
                         onChange={set(`petitioner.otherNames[${i}].last`)} />
                </Field>
                <Field label="Other given name (first)">
                  <input value={getByPath(form,`petitioner.otherNames[${i}].first`)||''}
                         onChange={set(`petitioner.otherNames[${i}].first`)} />
                </Field>
                <Field label="Other middle name">
                  <input value={getByPath(form,`petitioner.otherNames[${i}].middle`)||''}
                         onChange={set(`petitioner.otherNames[${i}].middle`)} />
                </Field>
                <div />
              </TwoCol>
            ))}
          </Row>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Government numbers (if any)</h4>
            <TwoCol>
              <Field label="Alien Registration Number (A-Number)">
                <input value={getByPath(form,'petitioner.aNumber')||''}
                       onChange={set('petitioner.aNumber')} />
              </Field>
              <Field label="USCIS Online Account Number">
                <input value={getByPath(form,'petitioner.uscisAccount')||''}
                       onChange={set('petitioner.uscisAccount')} />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="U.S. Social Security Number">
                <input value={getByPath(form,'petitioner.ssn')||''}
                       onChange={set('petitioner.ssn')} />
              </Field>
              <div />
            </TwoCol>
          </Row>
        </section>
      )}

      {/* STEP 1: Addresses */}
      {step===1 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Addresses</h3>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Mailing address</h4>
            <Field label="In care of (optional)">
              <input value={getByPath(form,'petitioner.mailing.inCareOf')||''}
                     onChange={set('petitioner.mailing.inCareOf')} />
            </Field>
            <TwoCol>
              <Field label="Street number and name">
                <input value={getByPath(form,'petitioner.mailing.street')||''}
                       onChange={set('petitioner.mailing.street')} />
              </Field>
              <Field label="Unit type (Apt/Ste/Flr)">
                <select value={getByPath(form,'petitioner.mailing.unitType')||''}
                        onChange={set('petitioner.mailing.unitType')}>
                  <option value="">—</option>
                  <option value="apt">Apt</option>
                  <option value="ste">Ste</option>
                  <option value="flr">Flr</option>
                </select>
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Unit number">
                <input value={getByPath(form,'petitioner.mailing.unitNumber')||''}
                       onChange={set('petitioner.mailing.unitNumber')} />
              </Field>
              <Field label="City">
                <input value={getByPath(form,'petitioner.mailing.city')||''}
                       onChange={set('petitioner.mailing.city')} />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="State / Province">
                <input value={getByPath(form,'petitioner.mailing.state')||getByPath(form,'petitioner.mailing.province')||''}
                       onChange={(e)=>{
                         set('petitioner.mailing.state')(e);
                         set('petitioner.mailing.province')(e);
                       }} />
              </Field>
              <Field label="ZIP / Postal code">
                <input value={getByPath(form,'petitioner.mailing.zip')||getByPath(form,'petitioner.mailing.postalCode')||''}
                       onChange={(e)=>{
                         set('petitioner.mailing.zip')(e);
                         set('petitioner.mailing.postalCode')(e);
                       }} />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Country">
                <input value={getByPath(form,'petitioner.mailing.country')||''}
                       onChange={set('petitioner.mailing.country')} />
              </Field>
              <Field label="Is your mailing address the same as your physical address?">
                <select
                  value={getByPath(form,'petitioner.mailingSameAsPhysical') ? 'yes':'no'}
                  onChange={(e)=>onMailingSameToggle(e.target.value==='yes')}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </Field>
            </TwoCol>
          </Row>

          {!getByPath(form,'petitioner.mailingSameAsPhysical') && (
            <Row>
              <h4 style={{margin:'8px 0 0'}}>Physical address</h4>
              <TwoCol>
                <Field label="Street number and name">
                  <input value={getByPath(form,'petitioner.physical.street')||''}
                         onChange={set('petitioner.physical.street')} />
                </Field>
                <Field label="Unit type (Apt/Ste/Flr)">
                  <select value={getByPath(form,'petitioner.physical.unitType')||''}
                          onChange={set('petitioner.physical.unitType')}>
                    <option value="">—</option>
                    <option value="apt">Apt</option>
                    <option value="ste">Ste</option>
                    <option value="flr">Flr</option>
                  </select>
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Unit number">
                  <input value={getByPath(form,'petitioner.physical.unitNumber')||''}
                         onChange={set('petitioner.physical.unitNumber')} />
                </Field>
                <Field label="City">
                  <input value={getByPath(form,'petitioner.physical.city')||''}
                         onChange={set('petitioner.physical.city')} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="State / Province">
                  <input value={getByPath(form,'petitioner.physical.state')||getByPath(form,'petitioner.physical.province')||''}
                         onChange={(e)=>{
                           set('petitioner.physical.state')(e);
                           set('petitioner.physical.province')(e);
                         }} />
                </Field>
                <Field label="ZIP / Postal code">
                  <input value={getByPath(form,'petitioner.physical.zip')||getByPath(form,'petitioner.physical.postalCode')||''}
                         onChange={(e)=>{
                           set('petitioner.physical.zip')(e);
                           set('petitioner.physical.postalCode')(e);
                         }} />
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Country">
                  <input value={getByPath(form,'petitioner.physical.country')||''}
                         onChange={set('petitioner.physical.country')} />
                </Field>
                <div />
              </TwoCol>
            </Row>
          )}
        </section>
      )}

      {/* STEP 2: Beneficiary */}
      {step===2 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Beneficiary</h3>

          <TwoCol>
            <Field label="Family name (last)">
              <input value={getByPath(form,'beneficiary.name.last')||''}
                     onChange={set('beneficiary.name.last')} />
            </Field>
            <Field label="Given name (first)">
              <input value={getByPath(form,'beneficiary.name.first')||''}
                     onChange={set('beneficiary.name.first')} />
            </Field>
          </TwoCol>
          <TwoCol>
            <Field label="Middle name">
              <input value={getByPath(form,'beneficiary.name.middle')||''}
                     onChange={set('beneficiary.name.middle')} />
            </Field>
            <Field label="Date of birth (YYYY-MM-DD)">
              <input value={getByPath(form,'beneficiary.dob')||''}
                     onChange={set('beneficiary.dob')} placeholder="YYYY-MM-DD" />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="City/Town of birth">
              <input value={getByPath(form,'beneficiary.birth.city')||''}
                     onChange={set('beneficiary.birth.city')} />
            </Field>
            <Field label="Country of birth">
              <input value={getByPath(form,'beneficiary.birth.country')||''}
                     onChange={set('beneficiary.birth.country')} />
            </Field>
          </TwoCol>

          <TwoCol>
            <Field label="Citizenship / Nationality">
              <input value={getByPath(form,'beneficiary.citizenship')||''}
                     onChange={set('beneficiary.citizenship')} />
            </Field>
            <div />
          </TwoCol>
        </section>
      )}

      {/* STEP 3: Relationship & History */}
      {step===3 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Relationship & history</h3>
          <Field label="How did you meet? (short description)" hint="1–3 sentences is fine">
            <textarea rows={4}
                      value={getByPath(form,'history.howMet')||''}
                      onChange={set('history.howMet')} />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <textarea rows={3}
                      value={getByPath(form,'history.dates')||''}
                      onChange={set('history.dates')} />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea rows={3}
                      value={getByPath(form,'history.priorMarriages')||''}
                      onChange={set('history.priorMarriages')} />
          </Field>
        </section>
      )}

      {/* STEP 4: Review & Download */}
      {step===4 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">
            When you’re ready, click to download a draft of your I-129F with your current answers.
          </div>
          <div>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
          </div>
        </section>
      )}

      {/* footer actions */}
      <div style={{display:'flex', gap:8, justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:8}}>
          <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step===STEPS.length-1}>Next</button>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          {notice && <span className="small" style={{color: notice.includes('failed') ? '#b91c1c' : '#16a34a'}}>{notice}</span>}
          <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save progress'}
          </button>
        </div>
      </div>
    </div>
  );
}

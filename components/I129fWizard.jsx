'use client';
import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses',  label: 'Addresses' },
  { key: 'beneficiary',label: 'Beneficiary' },
  { key: 'history',    label: 'Relationship & history' },
  { key: 'review',     label: 'Review & download' },
];

function getByPath(obj, path) {
  if (!obj) return '';
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) { if (cur == null) return ''; cur = cur[p]; }
  return cur ?? '';
}
function setByPath(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur = obj;
  for (let i=0;i<parts.length-1;i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length-1]] = value;
}
function normalizeDateMMDDYYYY(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  // Allow digits, slashes, dashes; reformat to MM/DD/YYYY if possible
  const only = s.replace(/[^\d]/g,'');
  if (only.length === 8) {
    const mm = only.slice(0,2);
    const dd = only.slice(2,4);
    const yyyy = only.slice(4);
    return `${mm}/${dd}/${yyyy}`;
  }
  return s; // let server do final validation
}

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(() => ({
    relationship: { classification:'K1', i130Filed:false },
    petitioner: {
      aNumber:'', uscisAccount:'', ssn:'',
      name:{ last:'', first:'', middle:'' },
      otherNames: [],
      mailingSameAsPhysical: true,
      mailing:{ inCareOf:'', street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
      physical:{ street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
      prevAddresses:[
        { street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US', dateFrom:'', dateTo:'' },
        { street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US', dateFrom:'', dateTo:'' }
      ],
      jobs:[
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' },
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'US' }
      ],
      contact:{ dayPhone:'', mobile:'', email:'' },
      signature:{ date:'' }
    },
    beneficiary:{
      aNumber:'', ssn:'', dob:'',
      name:{ last:'', first:'', middle:'' },
      birth:{ city:'', country:'' },
      citizenship:'',
      mailing:{ inCareOf:'', street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
      physical:{ street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
      jobs:[
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' },
        { employer:'', occupation:'', dateFrom:'', dateTo:'', street:'', unitNumber:'', city:'', state:'', zip:'', province:'', postalCode:'', country:'' }
      ],
      parents:[{ first:'', last:'', middle:'', dob:'', deceased:false, citizenship:'', birth:{ city:'', country:'' } }],
      travel:{ arrivedAs:'', i94:'', dateArrival:'', dateExpiry:'', passportNumber:'', travelDocNumber:'', passportCountry:'', passportExp:'' },
      traits:{ race:{ white:false, asian:false, black:false, nativeAmerican:false, pacificIslander:false } }
    },
    interpreter:{ name:{first:'',last:''}, business:'', language:'', phone:{area:'',number:''}, email:'', signatureDate:'' },
    preparer:{ name:{first:'',last:''}, business:'', dayPhone:'', mobile:'', email:'', signatureDate:'' },
    additional:[]
  }));

  // bind() so inputs always take raw value (not pooled event)
  const bind = (path, {isDate=false} = {}) => ({
    value: getByPath(form, path),
    onChange: (e) => {
      const raw = e?.target?.value ?? '';
      const val = isDate ? normalizeDateMMDDYYYY(raw) : raw;
      setForm(prev => {
        const copy = structuredClone(prev);
        setByPath(copy, path, val);
        return copy;
      });
    }
  });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/i129f/load', { cache: 'no-store' });
        if (!r.ok) return;
        const j = await r.json();
        if (j?.ok && j.data) {
          setForm(prev => ({ ...prev, ...j.data }));
        }
      } catch {}
    })();
  }, []);

 async function save() {
  setBusy(true);
  try {
    const r = await fetch('/api/i129f/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',        // <— add this line
      body: JSON.stringify({ data: form }),
    });
    const j = await r.json();
    if (!j?.ok) throw new Error(j?.error || 'Save failed');
    alert('Progress saved.');
  } catch (e) {
    alert('Save failed. Please try again.');
    console.error(e);
  } finally {
    setBusy(false);
  }
}

  function next(){ setStep(s => Math.min(s+1, STEPS.length-1)); }
  function back(){ setStep(s => Math.max(s-1, 0)); }

  function onMailingSameToggle(valYesNo) {
    const yes = valYesNo === 'yes';
    setForm(prev => {
      const copy = structuredClone(prev);
      copy.petitioner.mailingSameAsPhysical = yes;
      if (yes) copy.petitioner.physical = { ...copy.petitioner.mailing };
      return copy;
    });
  }

  const Row   = ({children}) => <div style={{display:'grid', gap:8}}>{children}</div>;
  const TwoCol= ({children}) => <div style={{display:'grid', gap:10, gridTemplateColumns:'1fr 1fr', alignItems:'end'}}>{children}</div>;
  const Field = ({ label, hint, children }) => (
    <label className="small" style={{display:'grid', gap:6}}>
      <span style={{fontWeight:600}}>{label}</span>
      {hint && <span style={{color:'#64748b'}}>{hint}</span>}
      <div style={{display:'grid'}}>{children}</div>
    </label>
  );

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {STEPS.map((s,i)=>(
          <button key={s.key} type="button" onClick={()=>setStep(i)}
            className="small"
            style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:i===step?'#eef2ff':'#fff'}}>
            {i+1}. {s.label}
          </button>
        ))}
      </div>

      {step===0 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Petitioner</h3>
          <div className="small">Usually the U.S. citizen filing the petition.</div>
          <TwoCol>
            <Field label="Classification">
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <label className="small" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
                  <input type="radio" name="class" checked={form.relationship.classification==='K1'}
                         onChange={()=> setForm(p=>({...p,relationship:{...p.relationship,classification:'K1'}}))} />
                  K-1 Fiancé(e)
                </label>
                <label className="small" style={{display:'inline-flex', gap:6, alignItems:'center'}}>
                  <input type="radio" name="class" checked={form.relationship.classification==='K3'}
                         onChange={()=> setForm(p=>({...p,relationship:{...p.relationship,classification:'K3'}}))} />
                  K-3 Spouse
                </label>
              </div>
            </Field>
            {form.relationship.classification==='K3' && (
              <Field label="If K-3: Have you filed Form I-130?">
                <select value={form.relationship.i130Filed?'yes':'no'}
                        onChange={(e)=> setForm(p=>({...p,relationship:{...p.relationship,i130Filed:e.target.value==='yes'}}))}>
                  <option value="no">No</option><option value="yes">Yes</option>
                </select>
              </Field>
            )}
          </TwoCol>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Your name</h4>
            <TwoCol>
              <Field label="Family name (last)"><input style={{width:'100%'}} {...bind('petitioner.name.last')} /></Field>
              <Field label="Given name (first)"><input style={{width:'100%'}} {...bind('petitioner.name.first')} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="Middle name"><input style={{width:'100%'}} {...bind('petitioner.name.middle')} /></Field>
              <div />
            </TwoCol>
          </Row>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Other names used</h4>
            <Field label="Have you used any other names?">
              <select
                value={(form.petitioner.otherNames||[]).length>0 ? 'yes' : 'no'}
                onChange={(e)=>{
                  const yes = e.target.value==='yes';
                  setForm(prev => ({...prev, petitioner:{
                    ...prev.petitioner,
                    otherNames: yes ? (prev.petitioner.otherNames?.length? prev.petitioner.otherNames : [{last:'',first:'',middle:''}]) : []
                  }}));
                }}
              >
                <option value="no">No</option><option value="yes">Yes</option>
              </select>
            </Field>
            {(form.petitioner.otherNames||[]).slice(0,1).map((_,i)=>(
              <TwoCol key={i}>
                <Field label="Other family name (last)"><input style={{width:'100%'}} {...bind(`petitioner.otherNames[${i}].last`)} /></Field>
                <Field label="Other given name (first)"><input style={{width:'100%'}} {...bind(`petitioner.otherNames[${i}].first`)} /></Field>
                <Field label="Other middle name"><input style={{width:'100%'}} {...bind(`petitioner.otherNames[${i}].middle`)} /></Field>
                <div />
              </TwoCol>
            ))}
          </Row>

          <Row>
            <h4 style={{margin:'8px 0 0'}}>Government numbers (if any)</h4>
            <TwoCol>
              <Field label="Alien Registration Number (A-Number)"><input style={{width:'100%'}} {...bind('petitioner.aNumber')} /></Field>
              <Field label="USCIS Online Account Number"><input style={{width:'100%'}} {...bind('petitioner.uscisAccount')} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="U.S. Social Security Number"><input style={{width:'100%'}} {...bind('petitioner.ssn')} /></Field>
              <div />
            </TwoCol>
          </Row>
        </section>
      )}

      {step===1 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Addresses</h3>
          <Row>
            <h4 style={{margin:'8px 0 0'}}>Mailing address</h4>
            <Field label="In care of (optional)"><input style={{width:'100%'}} {...bind('petitioner.mailing.inCareOf')} /></Field>
            <TwoCol>
              <Field label="Street number and name"><input style={{width:'100%'}} {...bind('petitioner.mailing.street')} /></Field>
              <Field label="Unit type (Apt/Ste/Flr)">
                <select {...bind('petitioner.mailing.unitType')}>
                  <option value="">—</option><option value="apt">Apt</option><option value="ste">Ste</option><option value="flr">Flr</option>
                </select>
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Unit number"><input style={{width:'100%'}} {...bind('petitioner.mailing.unitNumber')} /></Field>
              <Field label="City"><input style={{width:'100%'}} {...bind('petitioner.mailing.city')} /></Field>
            </TwoCol>
            <TwoCol>
              <Field label="State / Province">
                <input style={{width:'100%'}} {...bind('petitioner.mailing.state')} />
              </Field>
              <Field label="ZIP / Postal code">
                <input style={{width:'100%'}} {...bind('petitioner.mailing.zip')} />
              </Field>
            </TwoCol>
            <TwoCol>
              <Field label="Country"><input style={{width:'100%'}} {...bind('petitioner.mailing.country')} /></Field>
              <Field label="Is mailing same as physical?">
                <select value={form.petitioner.mailingSameAsPhysical ? 'yes':'no'} onChange={(e)=>onMailingSameToggle(e.target.value)}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </Field>
            </TwoCol>
          </Row>

          {!form.petitioner.mailingSameAsPhysical && (
            <Row>
              <h4 style={{margin:'8px 0 0'}}>Physical address</h4>
              <TwoCol>
                <Field label="Street number and name"><input style={{width:'100%'}} {...bind('petitioner.physical.street')} /></Field>
                <Field label="Unit type (Apt/Ste/Flr)">
                  <select {...bind('petitioner.physical.unitType')}>
                    <option value="">—</option><option value="apt">Apt</option><option value="ste">Ste</option><option value="flr">Flr</option>
                  </select>
                </Field>
              </TwoCol>
              <TwoCol>
                <Field label="Unit number"><input style={{width:'100%'}} {...bind('petitioner.physical.unitNumber')} /></Field>
                <Field label="City"><input style={{width:'100%'}} {...bind('petitioner.physical.city')} /></Field>
              </TwoCol>
              <TwoCol>
                <Field label="State / Province"><input style={{width:'100%'}} {...bind('petitioner.physical.state')} /></Field>
                <Field label="ZIP / Postal code"><input style={{width:'100%'}} {...bind('petitioner.physical.zip')} /></Field>
              </TwoCol>
              <TwoCol>
                <Field label="Country"><input style={{width:'100%'}} {...bind('petitioner.physical.country')} /></Field>
                <div />
              </TwoCol>
            </Row>
          )}
        </section>
      )}

      {step===2 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Beneficiary</h3>
          <TwoCol>
            <Field label="Family name (last)"><input style={{width:'100%'}} {...bind('beneficiary.name.last')} /></Field>
            <Field label="Given name (first)"><input style={{width:'100%'}} {...bind('beneficiary.name.first')} /></Field>
          </TwoCol>
          <TwoCol>
            <Field label="Middle name"><input style={{width:'100%'}} {...bind('beneficiary.name.middle')} /></Field>
            <Field label="Date of birth (MM/DD/YYYY)"><input style={{width:'100%'}} {...bind('beneficiary.dob', {isDate:true})} placeholder="MM/DD/YYYY" /></Field>
          </TwoCol>
          <TwoCol>
            <Field label="City/Town of birth"><input style={{width:'100%'}} {...bind('beneficiary.birth.city')} /></Field>
            <Field label="Country of birth"><input style={{width:'100%'}} {...bind('beneficiary.birth.country')} /></Field>
          </TwoCol>
          <TwoCol>
            <Field label="Citizenship / Nationality"><input style={{width:'100%'}} {...bind('beneficiary.citizenship')} /></Field>
            <div />
          </TwoCol>
        </section>
      )}

      {step===3 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Relationship & history</h3>
          <Field label="How did you meet? (short description)" hint="1–3 sentences">
            <textarea rows={4} style={{width:'100%'}} {...bind('history.howMet')} />
          </Field>
          <Field label="Important dates (met/engaged/visited)">
            <textarea rows={3} style={{width:'100%'}} {...bind('history.dates')} />
          </Field>
          <Field label="Prior marriages / divorces (if any)">
            <textarea rows={3} style={{width:'100%'}} {...bind('history.priorMarriages')} />
          </Field>
        </section>
      )}

      {step===4 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">Download a draft of your I-129F with your current answers (stays editable).</div>
          <div><a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a></div>
        </section>
      )}

      <div style={{display:'flex', gap:8, justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:8}}>
          <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step===STEPS.length-1}>Next</button>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          {notice && <span className="small" style={{color: notice.includes('failed') ? '#b91c1c' : '#16a34a'}}>{notice}</span>}
          <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save progress'}</button>
        </div>
      </div>
    </div>
  );
}

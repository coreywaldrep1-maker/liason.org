// components/I129fWizard.jsx
'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { key: 'petitioner', label: 'Petitioner' },
  { key: 'addresses', label: 'Addresses (5 years)' },
  { key: 'employment', label: 'Employment (5 years)' },
  { key: 'beneficiary', label: 'Beneficiary (Part 2)' },
  { key: 'travelParents', label: 'Travel & Parents (P2)' },
  { key: 'bio', label: 'Biographic (P3–P4)' },
  { key: 'contact', label: 'Contact & Signatures (P5–P7)' },
  { key: 'review', label: 'Review & download' },
];

// small helpers (row factories)
function emptyOtherName() { return { lastName:'', firstName:'', middleName:'' }; }
function emptyAddress() {
  return { street:'', unitType:'Apt', unitNum:'', city:'', state:'', zip:'', from:'', to:'' };
}
function emptyEmployer() {
  return { name:'', occupation:'', street:'', unitType:'Apt', unitNum:'', city:'', state:'', zip:'', from:'', to:'' };
}

export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    petitionType: 'K1', // K1 (fiancé(e)) or K3 (spouse)
    petitioner: {
      lastName:'', firstName:'', middleName:'',
      otherNames: [emptyOtherName()],
    },
    mailing: { street:'', unitType:'Apt', unitNum:'', city:'', state:'', zip:'' },

    addresses: [emptyAddress()],   // last 5 years
    employers: [emptyEmployer()],  // last 5 years

    // -------- Part 2: Beneficiary ----------
    beneficiary: {
      lastName:'', firstName:'', middleName:'',
      otherNames: [emptyOtherName()],
      alienNumber:'', ssn:'',
      dob:'', birthCity:'', birthCountry:'', citizenship:'',

      mailing: { street:'', unitType:'Apt', unitNum:'', city:'', state:'', zip:'' },
      addresses: [emptyAddress()],
      employers: [emptyEmployer()],

      travel: {
        lastArrivedAs:'', i94:'', arrivalDate:'', expiredDate:'',
        passport:'', travelDoc:'', countryOfIssuance:'', passportExpDate:''
      },
      parents: {
        parent1: { lastName:'', firstName:'', middleName:'', country:'' },
        parent2: { lastName:'', firstName:'', middleName:'', country:'' },
      },
      relationship: 'Fiancé(e)', // or 'Spouse'
      relationshipDescribe: '',   // free text if needed
    },

    // -------- Part 3–4: Biographic (limited) ----------
    bio: {
      heightFeet:'', heightInches:'', hairColor:'', // keep simple text for now
      raceNotes:'', // free text if you want to note race/ethnicity selection
    },

    // -------- Part 5–7: Contact/Signatures ----------
    contact: {
      petitionerDayPhone:'', petitionerMobile:'', petitionerEmail:'', petitionerSignDate:'',
      interpreter: {
        lastName:'', firstName:'', business:'', daytimePhone1:'', daytimePhone2:'', email:'', language:'', signDate:''
      },
      preparer: {
        lastName:'', firstName:'', business:'', dayPhone:'', mobile:'', email:'', signDate:''
      }
    },
  });

  // Load saved data (credentials are REQUIRED so your auth cookie is sent)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/i129f/load', { cache:'no-store', credentials:'include' });
        if (!resp.ok) return;
        const j = await resp.json();
        if (j?.ok && j.data) {
          setForm(prev => {
            const merged = { ...prev, ...j.data };

            // Guarantee at least one row in arrays
            if (!merged.petitioner) merged.petitioner = prev.petitioner;
            if (!Array.isArray(merged.petitioner.otherNames) || merged.petitioner.otherNames.length === 0)
              merged.petitioner.otherNames = [emptyOtherName()];

            if (!Array.isArray(merged.addresses) || merged.addresses.length === 0)
              merged.addresses = [emptyAddress()];
            if (!Array.isArray(merged.employers) || merged.employers.length === 0)
              merged.employers = [emptyEmployer()];

            if (!merged.beneficiary) merged.beneficiary = prev.beneficiary;
            if (!Array.isArray(merged.beneficiary.otherNames) || merged.beneficiary.otherNames.length === 0)
              merged.beneficiary.otherNames = [emptyOtherName()];
            if (!Array.isArray(merged.beneficiary.addresses) || merged.beneficiary.addresses.length === 0)
              merged.beneficiary.addresses = [emptyAddress()];
            if (!Array.isArray(merged.beneficiary.employers) || merged.beneficiary.employers.length === 0)
              merged.beneficiary.employers = [emptyEmployer()];

            return merged;
          });
        }
      } catch {}
    })();
  }, []);

  // basic updates
  function update(section, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value }
    }));
  }
  function updateNested(section, subkey, field, value) {
    setForm(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [subkey]: { ...(prev[section]?.[subkey] || {}), [field]: value } }
    }));
  }
  function updateArray(section, index, field, value) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      arr[index] = { ...(arr[index] || {}), [field]: value };
      return { ...prev, [section]: arr };
    });
  }
  function updateArrayDeep(section, subkey, index, field, value) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]?.[subkey]) ? [...prev[section][subkey]] : [];
      arr[index] = { ...(arr[index] || {}), [field]: value };
      return { ...prev, [section]: { ...(prev[section] || {}), [subkey]: arr } };
    });
  }
  function addRow(section, factory) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      arr.push(factory());
      return { ...prev, [section]: arr };
    });
  }
  function addRowDeep(section, subkey, factory) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]?.[subkey]) ? [...prev[section][subkey]] : [];
      arr.push(factory());
      return { ...prev, [section]: { ...(prev[section] || {}), [subkey]: arr } };
    });
  }
  function removeRow(section, index) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]) ? [...prev[section]] : [];
      if (arr.length > 1) arr.splice(index, 1);
      return { ...prev, [section]: arr };
    });
  }
  function removeRowDeep(section, subkey, index) {
    setForm(prev => {
      const arr = Array.isArray(prev[section]?.[subkey]) ? [...prev[section][subkey]] : [];
      if (arr.length > 1) arr.splice(index, 1);
      return { ...prev, [section]: { ...(prev[section] || {}), [subkey]: arr } };
    });
  }

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
      alert('Save failed. Please make sure you are logged in.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }

  return (
    <div className="card" style={{display:'grid', gap:12}}>
      {/* Step tabs */}
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

      {/* Step 1: Petitioner + Other Names + Mailing stays similar */}
      {step===0 && (
        <section style={{display:'grid', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <Field label="Filing type">
              <select value={form.petitionType} onChange={e=>setForm(p=>({ ...p, petitionType:e.target.value }))}>
                <option value="K1">K-1 (Fiancé(e))</option>
                <option value="K3">K-3 (Spouse)</option>
              </select>
            </Field>
          </div>

          <h3 style={{margin:0}}>Petitioner</h3>
          <Field label="Family name (last)">
            <input value={form.petitioner.lastName || ''} onChange={e=>setForm(p=>({...p, petitioner:{...p.petitioner, lastName:e.target.value}}))} />
          </Field>
          <Field label="Given name (first)">
            <input value={form.petitioner.firstName || ''} onChange={e=>setForm(p=>({...p, petitioner:{...p.petitioner, firstName:e.target.value}}))} />
          </Field>
          <Field label="Middle name">
            <input value={form.petitioner.middleName || ''} onChange={e=>setForm(p=>({...p, petitioner:{...p.petitioner, middleName:e.target.value}}))} />
          </Field>

          <h4 style={{margin:'8px 0 0'}}>Other names used (add if any)</h4>
          {form.petitioner.otherNames.map((n, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                <Field label="Family (last)">
                  <input value={n.lastName || ''} onChange={e=>setForm(p=>{
                    const arr=[...p.petitioner.otherNames]; arr[i]={...arr[i], lastName:e.target.value};
                    return {...p, petitioner:{...p.petitioner, otherNames:arr}};
                  })} />
                </Field>
                <Field label="Given (first)">
                  <input value={n.firstName || ''} onChange={e=>setForm(p=>{
                    const arr=[...p.petitioner.otherNames]; arr[i]={...arr[i], firstName:e.target.value};
                    return {...p, petitioner:{...p.petitioner, otherNames:arr}};
                  })} />
                </Field>
                <Field label="Middle">
                  <input value={n.middleName || ''} onChange={e=>setForm(p=>{
                    const arr=[...p.petitioner.otherNames]; arr[i]={...arr[i], middleName:e.target.value};
                    return {...p, petitioner:{...p.petitioner, otherNames:arr}};
                  })} />
                </Field>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>setForm(p=>{
                  const arr=[...p.petitioner.otherNames]; if(arr.length>1) arr.splice(i,1);
                  return {...p, petitioner:{...p.petitioner, otherNames:arr}};
                })} disabled={form.petitioner.otherNames.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={()=>setForm(p=>({
            ...p, petitioner:{...p.petitioner, otherNames:[...p.petitioner.otherNames, emptyOtherName()]}
          }))}>+ Add other name</button>

          <h3 style={{margin:'12px 0 0'}}>Mailing address</h3>
          <Field label="Street number and name">
            <input value={form.mailing.street || ''} onChange={e=>update('mailing','street',e.target.value)} />
          </Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
            <Field label="Unit type">
              <select value={form.mailing.unitType || 'Apt'} onChange={e=>update('mailing','unitType',e.target.value)}>
                <option>Apt</option><option>Ste</option><option>Flr</option>
              </select>
            </Field>
            <Field label="Unit number">
              <input value={form.mailing.unitNum || ''} onChange={e=>update('mailing','unitNum',e.target.value)} />
            </Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
            <Field label="City"><input value={form.mailing.city || ''} onChange={e=>update('mailing','city',e.target.value)} /></Field>
            <Field label="State"><input value={form.mailing.state || ''} onChange={e=>update('mailing','state',e.target.value)} /></Field>
            <Field label="ZIP"><input value={form.mailing.zip || ''} onChange={e=>update('mailing','zip',e.target.value)} /></Field>
          </div>
        </section>
      )}

      {/* Step 2: Petitioner physical addresses */}
      {step===1 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Physical addresses — last 5 years</h3>
          <div className="small">Add previous addresses until you cover 5 years of residence.</div>
          {form.addresses.map((a, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Address {i+1}</div>
              <Field label="Street number and name">
                <input value={a.street || ''} onChange={e=>updateArray('addresses', i, 'street', e.target.value)} />
              </Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={a.unitType || 'Apt'} onChange={e=>updateArray('addresses', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number">
                  <input value={a.unitNum || ''} onChange={e=>updateArray('addresses', i, 'unitNum', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City"><input value={a.city || ''} onChange={e=>updateArray('addresses', i, 'city', e.target.value)} /></Field>
                <Field label="State/Province"><input value={a.state || ''} onChange={e=>updateArray('addresses', i, 'state', e.target.value)} /></Field>
                <Field label="ZIP/Postal"><input value={a.zip || ''} onChange={e=>updateArray('addresses', i, 'zip', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (YYYY-MM-DD)"><input type="date" value={a.from || ''} onChange={e=>updateArray('addresses', i, 'from', e.target.value)} /></Field>
                <Field label="To (YYYY-MM-DD)"><input type="date" value={a.to || ''} onChange={e=>updateArray('addresses', i, 'to', e.target.value)} /></Field>
              </div>

              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>removeRow('addresses', i)} disabled={form.addresses.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <div>
            <button type="button" className="btn" onClick={()=>addRow('addresses', emptyAddress)}>+ Add another address</button>
          </div>
        </section>
      )}

      {/* Step 3: Petitioner employment */}
      {step===2 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Employment — last 5 years</h3>
          {form.employers.map((eRow, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Employer {i+1}</div>
              <Field label="Employer name"><input value={eRow.name || ''} onChange={e=>updateArray('employers', i, 'name', e.target.value)} /></Field>
              <Field label="Occupation / job title"><input value={eRow.occupation || ''} onChange={e=>updateArray('employers', i, 'occupation', e.target.value)} /></Field>
              <Field label="Street number and name"><input value={eRow.street || ''} onChange={e=>updateArray('employers', i, 'street', e.target.value)} /></Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={eRow.unitType || 'Apt'} onChange={e=>updateArray('employers', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number"><input value={eRow.unitNum || ''} onChange={e=>updateArray('employers', i, 'unitNum', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City"><input value={eRow.city || ''} onChange={e=>updateArray('employers', i, 'city', e.target.value)} /></Field>
                <Field label="State/Province"><input value={eRow.state || ''} onChange={e=>updateArray('employers', i, 'state', e.target.value)} /></Field>
                <Field label="ZIP/Postal"><input value={eRow.zip || ''} onChange={e=>updateArray('employers', i, 'zip', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (YYYY-MM-DD)"><input type="date" value={eRow.from || ''} onChange={e=>updateArray('employers', i, 'from', e.target.value)} /></Field>
                <Field label="To (YYYY-MM-DD)"><input type="date" value={eRow.to || ''} onChange={e=>updateArray('employers', i, 'to', e.target.value)} /></Field>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
                <button type="button" className="btn" onClick={()=>removeRow('employers', i)} disabled={form.employers.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={()=>addRow('employers', emptyEmployer)}>+ Add another employer</button>
        </section>
      )}

      {/* Step 4: Beneficiary names/birth/IDs + addresses/employers basic */}
      {step===3 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Beneficiary (Part 2)</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            <Field label="Relationship shown on form">
              <select
                value={form.beneficiary.relationship}
                onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, relationship:e.target.value}}))}
              >
                <option>Fiancé(e)</option>
                <option>Spouse</option>
              </select>
            </Field>
          </div>

          <Field label="Family name (last)">
            <input value={form.beneficiary.lastName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, lastName:e.target.value}}))} />
          </Field>
          <Field label="Given name (first)">
            <input value={form.beneficiary.firstName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, firstName:e.target.value}}))} />
          </Field>
          <Field label="Middle name">
            <input value={form.beneficiary.middleName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, middleName:e.target.value}}))} />
          </Field>

          <h4 style={{margin:'8px 0 0'}}>Other names used (beneficiary)</h4>
          {form.beneficiary.otherNames.map((n, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                <Field label="Family (last)">
                  <input value={n.lastName || ''} onChange={e=>updateArrayDeep('beneficiary','otherNames', i, 'lastName', e.target.value)} />
                </Field>
                <Field label="Given (first)">
                  <input value={n.firstName || ''} onChange={e=>updateArrayDeep('beneficiary','otherNames', i, 'firstName', e.target.value)} />
                </Field>
                <Field label="Middle">
                  <input value={n.middleName || ''} onChange={e=>updateArrayDeep('beneficiary','otherNames', i, 'middleName', e.target.value)} />
                </Field>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>removeRowDeep('beneficiary','otherNames', i)} disabled={form.beneficiary.otherNames.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={()=>addRowDeep('beneficiary','otherNames', emptyOtherName)}>+ Add other name</button>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            <Field label="A-Number (if any)"><input value={form.beneficiary.alienNumber || ''} onChange={e=>updateNested('beneficiary','', 'alienNumber', e.target.value)} /></Field>
            <Field label="SSN (if any)"><input value={form.beneficiary.ssn || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, ssn:e.target.value}}))} /></Field>
            <Field label="Date of birth"><input type="date" value={form.beneficiary.dob || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, dob:e.target.value}}))} /></Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            <Field label="City/Town of birth"><input value={form.beneficiary.birthCity || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, birthCity:e.target.value}}))} /></Field>
            <Field label="Country of birth"><input value={form.beneficiary.birthCountry || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, birthCountry:e.target.value}}))} /></Field>
            <Field label="Citizenship/Nationality"><input value={form.beneficiary.citizenship || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, citizenship:e.target.value}}))} /></Field>
          </div>

          <h4 style={{margin:'8px 0 0'}}>Beneficiary mailing address</h4>
          <Field label="Street number and name"><input value={form.beneficiary.mailing.street || ''} onChange={e=>updateNested('beneficiary','mailing','street',e.target.value)} /></Field>
          <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
            <Field label="Unit type">
              <select value={form.beneficiary.mailing.unitType || 'Apt'} onChange={e=>updateNested('beneficiary','mailing','unitType',e.target.value)}>
                <option>Apt</option><option>Ste</option><option>Flr</option>
              </select>
            </Field>
            <Field label="Unit number"><input value={form.beneficiary.mailing.unitNum || ''} onChange={e=>updateNested('beneficiary','mailing','unitNum',e.target.value)} /></Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
            <Field label="City"><input value={form.beneficiary.mailing.city || ''} onChange={e=>updateNested('beneficiary','mailing','city',e.target.value)} /></Field>
            <Field label="State"><input value={form.beneficiary.mailing.state || ''} onChange={e=>updateNested('beneficiary','mailing','state',e.target.value)} /></Field>
            <Field label="ZIP"><input value={form.beneficiary.mailing.zip || ''} onChange={e=>updateNested('beneficiary','mailing','zip',e.target.value)} /></Field>
          </div>

          <h4 style={{margin:'8px 0 0'}}>Beneficiary physical addresses — last 5 years</h4>
          {form.beneficiary.addresses.map((a, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Address {i+1}</div>
              <Field label="Street number and name"><input value={a.street || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'street', e.target.value)} /></Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={a.unitType || 'Apt'} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number"><input value={a.unitNum || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'unitNum', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City"><input value={a.city || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'city', e.target.value)} /></Field>
                <Field label="State/Province"><input value={a.state || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'state', e.target.value)} /></Field>
                <Field label="ZIP/Postal"><input value={a.zip || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'zip', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (YYYY-MM-DD)"><input type="date" value={a.from || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'from', e.target.value)} /></Field>
                <Field label="To (YYYY-MM-DD)"><input type="date" value={a.to || ''} onChange={e=>updateArrayDeep('beneficiary','addresses', i, 'to', e.target.value)} /></Field>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>removeRowDeep('beneficiary','addresses', i)} disabled={form.beneficiary.addresses.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={()=>addRowDeep('beneficiary','addresses', emptyAddress)}>+ Add another address</button>

          <h4 style={{margin:'8px 0 0'}}>Beneficiary employment — last 5 years</h4>
          {form.beneficiary.employers.map((eRow, i) => (
            <div key={i} className="card" style={{display:'grid', gap:10}}>
              <div style={{fontWeight:600}}>Employer {i+1}</div>
              <Field label="Employer name"><input value={eRow.name || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'name', e.target.value)} /></Field>
              <Field label="Occupation / job title"><input value={eRow.occupation || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'occupation', e.target.value)} /></Field>
              <Field label="Street number and name"><input value={eRow.street || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'street', e.target.value)} /></Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
                <Field label="Unit type">
                  <select value={eRow.unitType || 'Apt'} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'unitType', e.target.value)}>
                    <option>Apt</option><option>Ste</option><option>Flr</option>
                  </select>
                </Field>
                <Field label="Unit number"><input value={eRow.unitNum || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'unitNum', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr 0.8fr', gap:10}}>
                <Field label="City"><input value={eRow.city || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'city', e.target.value)} /></Field>
                <Field label="State/Province"><input value={eRow.state || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'state', e.target.value)} /></Field>
                <Field label="ZIP/Postal"><input value={eRow.zip || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'zip', e.target.value)} /></Field>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <Field label="From (YYYY-MM-DD)"><input type="date" value={eRow.from || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'from', e.target.value)} /></Field>
                <Field label="To (YYYY-MM-DD)"><input type="date" value={eRow.to || ''} onChange={e=>updateArrayDeep('beneficiary','employers', i, 'to', e.target.value)} /></Field>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>removeRowDeep('beneficiary','employers', i)} disabled={form.beneficiary.employers.length<=1}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn" onClick={()=>addRowDeep('beneficiary','employers', emptyEmployer)}>+ Add another employer</button>
        </section>
      )}

      {/* Step 5: Travel & Parents */}
      {step===4 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Beneficiary travel & parents (Part 2)</h3>
          <div className="card" style={{display:'grid', gap:10}}>
            <div style={{fontWeight:600}}>Most recent U.S. entry (if any)</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Last arrived as (status/class)"><input value={form.beneficiary.travel.lastArrivedAs || ''} onChange={e=>updateNested('beneficiary','travel','lastArrivedAs',e.target.value)} /></Field>
              <Field label="I-94 number"><input value={form.beneficiary.travel.i94 || ''} onChange={e=>updateNested('beneficiary','travel','i94',e.target.value)} /></Field>
              <Field label="Date of arrival"><input type="date" value={form.beneficiary.travel.arrivalDate || ''} onChange={e=>updateNested('beneficiary','travel','arrivalDate',e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Date authorized stay expired"><input type="date" value={form.beneficiary.travel.expiredDate || ''} onChange={e=>updateNested('beneficiary','travel','expiredDate',e.target.value)} /></Field>
              <Field label="Passport #"><input value={form.beneficiary.travel.passport || ''} onChange={e=>updateNested('beneficiary','travel','passport',e.target.value)} /></Field>
              <Field label="Travel doc #"><input value={form.beneficiary.travel.travelDoc || ''} onChange={e=>updateNested('beneficiary','travel','travelDoc',e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="Country of issuance"><input value={form.beneficiary.travel.countryOfIssuance || ''} onChange={e=>updateNested('beneficiary','travel','countryOfIssuance',e.target.value)} /></Field>
              <Field label="Passport/doc exp date"><input type="date" value={form.beneficiary.travel.passportExpDate || ''} onChange={e=>updateNested('beneficiary','travel','passportExpDate',e.target.value)} /></Field>
            </div>
          </div>

          <div className="card" style={{display:'grid', gap:10}}>
            <div style={{fontWeight:600}}>Parents</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Parent 1 — Family"><input value={form.beneficiary.parents.parent1.lastName || ''} onChange={e=>updateNested('beneficiary','parents',{ }.toString(), e.target.value)} /></Field>
              <Field label="Parent 1 — Given"><input value={form.beneficiary.parents.parent1.firstName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent1:{...p.beneficiary.parents.parent1, firstName:e.target.value}}}}))} /></Field>
              <Field label="Parent 1 — Middle"><input value={form.beneficiary.parents.parent1.middleName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent1:{...p.beneficiary.parents.parent1, middleName:e.target.value}}}}))} /></Field>
              <Field label="Parent 1 — Country"><input value={form.beneficiary.parents.parent1.country || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent1:{...p.beneficiary.parents.parent1, country:e.target.value}}}}))} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Parent 2 — Family"><input value={form.beneficiary.parents.parent2.lastName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent2:{...p.beneficiary.parents.parent2, lastName:e.target.value}}}}))} /></Field>
              <Field label="Parent 2 — Given"><input value={form.beneficiary.parents.parent2.firstName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent2:{...p.beneficiary.parents.parent2, firstName:e.target.value}}}}))} /></Field>
              <Field label="Parent 2 — Middle"><input value={form.beneficiary.parents.parent2.middleName || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent2:{...p.beneficiary.parents.parent2, middleName:e.target.value}}}}))} /></Field>
              <Field label="Parent 2 — Country"><input value={form.beneficiary.parents.parent2.country || ''} onChange={e=>setForm(p=>({...p, beneficiary:{...p.beneficiary, parents:{...p.beneficiary.parents, parent2:{...p.beneficiary.parents.parent2, country:e.target.value}}}}))} /></Field>
            </div>
          </div>
        </section>
      )}

      {/* Step 6: Biographic (Parts 3–4) */}
      {step===5 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Biographic (Parts 3–4)</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            <Field label="Height — feet"><input value={form.bio.heightFeet || ''} onChange={e=>setForm(p=>({...p, bio:{...p.bio, heightFeet:e.target.value}}))} /></Field>
            <Field label="Height — inches"><input value={form.bio.heightInches || ''} onChange={e=>setForm(p=>({...p, bio:{...p.bio, heightInches:e.target.value}}))} /></Field>
            <Field label="Hair color"><input value={form.bio.hairColor || ''} onChange={e=>setForm(p=>({...p, bio:{...p.bio, hairColor:e.target.value}}))} /></Field>
          </div>
          <Field label="Race/ethnicity notes (optional)">
            <input value={form.bio.raceNotes || ''} onChange={e=>setForm(p=>({...p, bio:{...p.bio, raceNotes:e.target.value}}))} />
          </Field>
        </section>
      )}

      {/* Step 7: Contact & Signatures (Parts 5–7) */}
      {step===6 && (
        <section style={{display:'grid', gap:12}}>
          <h3 style={{margin:0}}>Petitioner contact (Part 5)</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
            <Field label="Daytime phone"><input value={form.contact.petitionerDayPhone || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, petitionerDayPhone:e.target.value}}))} /></Field>
            <Field label="Mobile phone"><input value={form.contact.petitionerMobile || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, petitionerMobile:e.target.value}}))} /></Field>
            <Field label="Email"><input value={form.contact.petitionerEmail || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, petitionerEmail:e.target.value}}))} /></Field>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:10}}>
            <Field label="Date of signature"><input type="date" value={form.contact.petitionerSignDate || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, petitionerSignDate:e.target.value}}))} /></Field>
          </div>

          <h3 style={{margin:'12px 0 0'}}>Interpreter (Part 6)</h3>
          <div className="card" style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Family name"><input value={form.contact.interpreter.lastName || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, lastName:e.target.value}}}))} /></Field>
              <Field label="Given name"><input value={form.contact.interpreter.firstName || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, firstName:e.target.value}}}))} /></Field>
              <Field label="Business/Org"><input value={form.contact.interpreter.business || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, business:e.target.value}}}))} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Daytime phone 1"><input value={form.contact.interpreter.daytimePhone1 || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, daytimePhone1:e.target.value}}}))} /></Field>
              <Field label="Daytime phone 2"><input value={form.contact.interpreter.daytimePhone2 || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, daytimePhone2:e.target.value}}}))} /></Field>
              <Field label="Email"><input value={form.contact.interpreter.email || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, email:e.target.value}}}))} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="Language"><input value={form.contact.interpreter.language || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, language:e.target.value}}}))} /></Field>
              <Field label="Date of signature"><input type="date" value={form.contact.interpreter.signDate || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, interpreter:{...p.contact.interpreter, signDate:e.target.value}}}))} /></Field>
            </div>
          </div>

          <h3 style={{margin:'12px 0 0'}}>Preparer (Part 7)</h3>
          <div className="card" style={{display:'grid', gap:10}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Family name"><input value={form.contact.preparer.lastName || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, lastName:e.target.value}}}))} /></Field>
              <Field label="Given name"><input value={form.contact.preparer.firstName || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, firstName:e.target.value}}}))} /></Field>
              <Field label="Business/Org"><input value={form.contact.preparer.business || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, business:e.target.value}}}))} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Daytime phone"><input value={form.contact.preparer.dayPhone || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, dayPhone:e.target.value}}}))} /></Field>
              <Field label="Mobile phone"><input value={form.contact.preparer.mobile || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, mobile:e.target.value}}}))} /></Field>
              <Field label="Email"><input value={form.contact.preparer.email || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, email:e.target.value}}}))} /></Field>
            </div>
            <Field label="Date of signature"><input type="date" value={form.contact.preparer.signDate || ''} onChange={e=>setForm(p=>({...p, contact:{...p.contact, preparer:{...p.contact.preparer, signDate:e.target.value}}}))} /></Field>
          </div>
        </section>
      )}

      {/* Step 8: Review & download */}
      {step===7 && (
        <section style={{display:'grid', gap:10}}>
          <h3 style={{margin:0}}>Review & download</h3>
          <div className="small">When you’re ready, download a draft of your I-129F. Extra items will flow to Part 8 automatically.</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            <a className="btn" href="/api/i129f/pdf-debug">Debug: show field IDs</a>
          </div>
        </section>
      )}

      {/* Nav + Save */}
      <div style={{display:'flex', gap:8, justifyContent:'space-between'}}>
        <div style={{display:'flex', gap:8}}>
          <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
          <button type="button" onClick={next} className="btn" disabled={step===STEPS.length-1}>Next</button>
        </div>
        <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save progress'}
        </button>
      </div>
    </div>
  );
}

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

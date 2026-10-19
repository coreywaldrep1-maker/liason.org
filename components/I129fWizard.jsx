'use client';

import { useEffect, useMemo, useState } from 'react';

const SECTIONS = [
  { key: 'p1_identity', label: 'Part 1 — Petitioner' },
  { key: 'p1_address', label: 'Part 1 — Addresses' },
  { key: 'p1_employment', label: 'Part 1 — Employment' },
  { key: 'p1_parents', label: 'Part 1 — Parents' },
  { key: 'p1_history', label: 'Part 1 — History & Citizenship' },
  { key: 'p2_identity', label: 'Part 2 — Beneficiary' },
  { key: 'p2_address', label: 'Part 2 — Addresses' },
  { key: 'p2_employment', label: 'Part 2 — Employment' },
  { key: 'p2_parents', label: 'Part 2 — Parents' },
  { key: 'p2_history', label: 'Part 2 — Family & Relationship' },
  { key: 'p2_immigration', label: 'Part 2 — Immigration' },
  { key: 'p3_criminal', label: 'Part 3 — Criminal' },
  { key: 'p4_bio', label: 'Part 4 — Biographic' },
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

    hasOtherNames: '',
    otherNamesUsed: [],
    uscisOnlineAccount: '',
    maritalStatus: '',
    provinceBirth: '',
    ethnicityHispanic: '',
    race: [],
    heightFeet: '', heightInches: '', weight: '', eyeColor: '', hairColor: '',
    employment: [{ employer:'', occupation:'', street:'', unitType:'', unitNumber:'', city:'', state:'', zip:'', province:'', postal:'', country:'', from:'', to:'' }],
    previouslyMarried: '', previousSpouses: [],
    filedForOtherBeneficiary: '', previousBeneficiaries: [],
    childrenUnder18: '', childrenAges: [], residencesSince18: [],

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
    hasOtherNames: '',
    otherNames: [],
    sex: '', maritalStatus: '', previouslyMarried: '', previousSpouses: [],
    everInUS: '', hasChildren: '', children: [],
    relatedToPetitioner: '', relationshipDetails: '', metInPerson: '', meetingDetails: '',
    metThroughIMB: '', imb: {},
    consulateCity: '', consulateCountry: '',
    intendedUSAddress: {}, usDaytimePhone: '', addressAbroad: {}, abroadPhone: '', nativeAlphabet: {},

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
  interpreter: { used: '', lastName: '', firstName: '', business: '', phone: '', mobile: '', email: '', language: '', signDate: '' },
  preparer: { used: '', isAttorney: '', lastName: '', firstName: '', business: '', phone: '', mobile: '', email: '', signDate: '' },

  // Direct PDF field overrides (advanced / completeness)
  // Keys are PDF field names (including dots), values are strings or booleans.
  pdf: {},

  additionalInfo: '',
  continuation: [],
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
    setMsg('Unsaved changes');
    setForm(prev => {
      const next = deepClone(prev);
      setPath(next, path, value);
      return next;
    });
  };

  const add = (path, factory) => {
    setMsg('Unsaved changes');
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
    setMsg('Unsaved changes');
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
          merged.petitioner.parents = ensureArrayLen(merged.petitioner.parents,2,()=>({})).slice(0,2).map(v=>{
            const x={...v};
            if (x.currentCityCountry && !x.residenceCity && !x.residenceCountry) {
              const [city,...country]=String(x.currentCityCountry).split(',');
              x.residenceCity=city.trim();x.residenceCountry=country.join(',').trim();
            }
            return x;
          });
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
          merged.petitioner.employment = Array.isArray(j.data?.petitioner?.employment) && j.data.petitioner.employment.length ? j.data.petitioner.employment : deepClone(EMPTY.petitioner.employment);
          // Migrate older wizard records that stored Part 4 answers under beneficiary.
          for (const key of ['ethnicityHispanic','race','heightFeet','heightInches','weight','eyeColor','hairColor']) {
            if ((!merged.petitioner[key] || (Array.isArray(merged.petitioner[key]) && !merged.petitioner[key].length)) && j.data?.beneficiary?.[key]) {
              merged.petitioner[key]=j.data.beneficiary[key];
            }
          }
          merged.petitioner.race = Array.isArray(merged.petitioner.race) ? merged.petitioner.race : (merged.petitioner.race ? [merged.petitioner.race] : []);
          merged.petitioner.hasOtherNames=merged.petitioner.hasOtherNames|| (merged.petitioner.otherNamesUsed?.some(n=>n.lastName||n.firstName||n.middleName)?'yes':'');
          merged.beneficiary.hasOtherNames=merged.beneficiary.hasOtherNames|| (merged.beneficiary.otherNames?.some(n=>n.lastName||n.firstName||n.middleName)?'yes':'');
          merged.continuation = Array.isArray(j.data.continuation) ? j.data.continuation : [];
          merged.contact = { ...EMPTY.contact, ...(j.data.contact || {}) };
          merged.interpreter = { ...EMPTY.interpreter, ...(j.data.interpreter || {}) };
          if (!merged.interpreter.used && (merged.interpreter.lastName || merged.interpreter.firstName || merged.interpreter.phone)) merged.interpreter.used='yes';
          merged.preparer = { ...EMPTY.preparer, ...(j.data.preparer || {}) };
          if (!merged.preparer.used && (merged.preparer.lastName || merged.preparer.firstName || merged.preparer.phone)) merged.preparer.used='yes';
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
      for (const person of ['petitioner','beneficiary']) {
        const node=normalized[person]||{};
        const names=person==='petitioner'?'otherNamesUsed':'otherNames';
        if(node.hasOtherNames==='no') node[names]=[];
      }
      if(normalized.interpreter?.used==='no') normalized.interpreter={used:'no'};
      if(normalized.preparer?.used==='no') normalized.preparer={used:'no'};
      if(normalized.petitioner?.previouslyMarried==='no') normalized.petitioner.previousSpouses=[];
      if(normalized.beneficiary?.previouslyMarried==='no') normalized.beneficiary.previousSpouses=[];
      if(normalized.beneficiary?.hasChildren==='no') normalized.beneficiary.children=[];
      if(normalized.petitioner?.childrenUnder18==='no') normalized.petitioner.childrenAges=[];
      if(normalized.beneficiary?.metThroughIMB==='no') normalized.beneficiary.imb={};
      if(normalized.petitioner?.classification==='k1') normalized.petitioner.filedI130='';
      if(normalized.petitioner?.filedForOtherBeneficiary==='no') normalized.petitioner.previousBeneficiaries=[];
      if(normalized.petitioner?.citizenship?.certificateObtained==='no') {
        normalized.petitioner.citizenship.certificateNumber='';
        normalized.petitioner.citizenship.certificateDate='';
        normalized.petitioner.citizenship.certificatePlace='';
      }
      if(normalized.beneficiary?.everInUS==='no') {
        for(const k of ['i94','classOfAdmission','arrivalDate','statusExpires','passportNumber','travelDocNumber','passportCountry','passportExpiration']) normalized.beneficiary[k]='';
      }
      if(normalized.beneficiary?.relatedToPetitioner!=='yes') normalized.beneficiary.relationshipDetails='';
      if(!['yes','no'].includes(normalized.beneficiary?.metInPerson)) normalized.beneficiary.meetingDetails='';
      if(normalized.petitioner?.criminal?.everArrestedCitedCharged==='no') normalized.petitioner.criminal.everArrestedDetails='';
      if(!['yes'].some(v=>['arrestedOrConvicted2a','arrestedOrConvicted2b','arrestedOrConvicted2c'].some(k=>normalized.petitioner?.criminal?.[k]===v))) {
        for(const k of ['reasonSelfDefense','reasonViolatedProtectionOrder','reasonBatteredCruelty']) normalized.petitioner.criminal[k]=false;
      }

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
      case 'p1_employment': return <EmploymentHistory form={form} update={update} add={add} remove={remove} person="petitioner" />;
      case 'p1_parents': return <Part1Parents form={form} update={update} />;
      case 'p1_history': return <Part1History form={form} update={update} add={add} remove={remove} />;
      case 'p2_identity': return <Part2Identity form={form} update={update} add={add} remove={remove} />;
      case 'p2_address': return <Part2Addresses form={form} update={update} add={add} remove={remove} />;
      case 'p2_employment': return <EmploymentHistory form={form} update={update} add={add} remove={remove} person="beneficiary" />;
      case 'p2_parents': return <Part2Parents form={form} update={update} />;
      case 'p2_history': return <Part2History form={form} update={update} add={add} remove={remove} />;
      case 'p2_immigration': return <Part2Immigration form={form} update={update} />;
      case 'p3_criminal': return <Part3Criminal form={form} update={update} />;
      case 'p4_bio': return <Part4Biographic form={form} update={update} />;
      case 'p5_7': return <Parts5to7 form={form} update={update} />;
      case 'p8_additional': return <Part8Additional form={form} update={update} add={add} remove={remove} />;
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
          {msg || `Section ${step+1} of ${SECTIONS.length}`}
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:12}}>
        {content}
      </div>

      <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
        <button type="button" className="btn" disabled={step===0} onClick={()=>setStep(n=>Math.max(0,n-1))}>← Previous</button>
        <span className="small">Section {step+1} of {SECTIONS.length}</span>
        <button type="button" className="btn primary" disabled={step===SECTIONS.length-1} onClick={()=>setStep(n=>Math.min(SECTIONS.length-1,n+1))}>Continue →</button>
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



/** =========================
 *  Part 1 — Identity
 *  ========================= */
/** Shared address controls preserve the existing card and three-column grid layout. */
function AddressInputs({address={},path,update,mailing=false,history=false}) {
  const A=address||{};
  return <div style={{display:'grid',gap:10}}>
    {mailing && <Field label="In care of (if any)"><input value={A.inCareOf||''} onChange={e=>update(`${path}.inCareOf`,e.target.value)}/></Field>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      <Field label="Street number and name"><input value={A.street||''} onChange={e=>update(`${path}.street`,e.target.value)}/></Field>
      <Field label="Apartment, suite or floor (if any)">
        <div style={{display:'grid',gridTemplateColumns:'110px minmax(0,1fr)',gap:8}}>
          <select value={A.unitType||''} onChange={e=>update(`${path}.unitType`,e.target.value)}><option value="">None</option><option value="apt">Apt</option><option value="ste">Suite</option><option value="flr">Floor</option></select>
          <input placeholder="Number" value={A.unitNumber||''} onChange={e=>update(`${path}.unitNumber`,e.target.value)}/>
        </div>
      </Field>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
      <Field label="City or town"><input value={A.city||''} onChange={e=>update(`${path}.city`,e.target.value)}/></Field>
      <Field label="State (if U.S.)"><input value={A.state||''} onChange={e=>update(`${path}.state`,e.target.value)}/></Field>
      <Field label="ZIP code (if U.S.)"><input value={A.zip||''} onChange={e=>update(`${path}.zip`,e.target.value)}/></Field>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
      <Field label="Province (if applicable)"><input value={A.province||''} onChange={e=>update(`${path}.province`,e.target.value)}/></Field>
      <Field label="Postal code (if applicable)"><input value={A.postal||''} onChange={e=>update(`${path}.postal`,e.target.value)}/></Field>
      <Field label="Country"><input value={A.country||''} onChange={e=>update(`${path}.country`,e.target.value)}/></Field>
    </div>
    {history && <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
      <Field label="Date from"><DateInput value={A.from||''} onChange={v=>update(`${path}.from`,v)}/></Field>
      <Field label="Date to (leave blank if current)"><DateInput value={A.to||''} onChange={v=>update(`${path}.to`,v)}/></Field>
    </div>}
  </div>;
}

const emptyAddress=()=>({street:'',unitType:'',unitNumber:'',city:'',state:'',zip:'',province:'',postal:'',country:'',from:'',to:''});
const emptyJob=()=>({employer:'',occupation:'',...emptyAddress()});
const emptyName=()=>({lastName:'',firstName:'',middleName:''});

function EmploymentHistory({form,update,add,remove,person}) {
  const arr=Array.isArray(form?.[person]?.employment)?form[person].employment:[];
  const jobs=arr.length?arr:[emptyJob()];
  const who=person==='petitioner'?'Your':'Beneficiary’s';
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part {person==='petitioner'?'1':'2'} — {who} Employment History</h3>
    <p className="hint">List employment during the last five years, most recent first. Add more employers if needed; entries beyond the two PDF spaces are referenced in Part 8.</p>
    {jobs.map((job,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>Employer {i+1}</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <Field label="Employer's full name"><input value={job.employer||''} onChange={e=>update(`${person}.employment.${i}.employer`,e.target.value)}/></Field>
        <Field label="Occupation or job title"><input value={job.occupation||''} onChange={e=>update(`${person}.employment.${i}.occupation`,e.target.value)}/></Field>
      </div>
      <AddressInputs address={job} path={`${person}.employment.${i}`} update={update} history/>
      {i>0 && <div><button type="button" className="btn" onClick={()=>remove(`${person}.employment`,i)}>Remove employer</button></div>}
    </div>)}
    <div><button type="button" className="btn" onClick={()=>add(`${person}.employment`,emptyJob)}>Add another employer</button></div>
  </section>;
}

function PersonNames({entries=[],path,update,add,remove,label='Previous spouse'}) {
  return <div style={{display:'grid',gap:12}}>
    {entries.map((p,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>{label} {i+1}</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        <Field label="Last name"><input value={p.lastName||''} onChange={e=>update(`${path}.${i}.lastName`,e.target.value)}/></Field>
        <Field label="First name"><input value={p.firstName||''} onChange={e=>update(`${path}.${i}.firstName`,e.target.value)}/></Field>
        <Field label="Middle name"><input value={p.middleName||''} onChange={e=>update(`${path}.${i}.middleName`,e.target.value)}/></Field>
      </div>
      <Field label="Date the marriage ended"><DateInput value={p.ended||''} onChange={v=>update(`${path}.${i}.ended`,v)}/></Field>
      <div><button type="button" className="btn" onClick={()=>remove(path,i)}>Remove</button></div>
    </div>)}
    <div><button type="button" className="btn" onClick={()=>add(path,()=>({...emptyName(),ended:''}))}>Add {label.toLowerCase()}</button></div>
  </div>;
}


/** Part 1 — Personal details and conditional aliases */
function Part1Identity({ form, update, add, remove }) {
  const P = form.petitioner || {};
  return (
    <section style={{display:'grid',gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Information About You (Petitioner)</h3>
      <div className="card" style={{display:'grid',gap:10}}>
        <div className="small"><strong>Your full legal name</strong></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Last name"><input value={P.lastName||''} onChange={e=>update('petitioner.lastName',e.target.value)}/></Field>
          <Field label="First name"><input value={P.firstName||''} onChange={e=>update('petitioner.firstName',e.target.value)}/></Field>
          <Field label="Middle name (if any)"><input value={P.middleName||''} onChange={e=>update('petitioner.middleName',e.target.value)}/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Alien registration number (A-Number), if any"><input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber',e.target.value)}/></Field>
          <Field label="USCIS online account number, if any"><input value={P.uscisOnlineAccount||''} onChange={e=>update('petitioner.uscisOnlineAccount',e.target.value)}/></Field>
          <Field label="Social Security number, if any"><input value={P.ssn||''} onChange={e=>update('petitioner.ssn',e.target.value)}/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Date of birth"><DateInput value={P.dob||''} onChange={v=>update('petitioner.dob',v)}/></Field>
          <Field label="Sex"><select value={P.sex||''} onChange={e=>update('petitioner.sex',e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
          <Field label="Marital status"><select value={P.maritalStatus||''} onChange={e=>update('petitioner.maritalStatus',e.target.value)}><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="City or town of birth"><input value={P.cityBirth||''} onChange={e=>update('petitioner.cityBirth',e.target.value)}/></Field>
          <Field label="State or province of birth"><input value={P.provinceBirth||''} onChange={e=>update('petitioner.provinceBirth',e.target.value)}/></Field>
          <Field label="Country of birth"><input value={P.countryBirth||''} onChange={e=>update('petitioner.countryBirth',e.target.value)}/></Field>
        </div>
      </div>
      <div className="card" style={{display:'grid',gap:10}}>
        <strong>Who are you petitioning for?</strong>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
          <Field label="Visa classification"><select value={P.classification||'k1'} onChange={e=>update('petitioner.classification',e.target.value)}><option value="k1">Fiancé(e) — K-1</option><option value="k3">Spouse — K-3</option></select></Field>
          {P.classification==='k3' && <Field label="Have you filed Form I-130 for your spouse?"><YesNoSelect value={P.filedI130} onChange={v=>update('petitioner.filedI130',v)}/></Field>}
        </div>
      </div>
      <OtherNames form={form} update={update} add={add} remove={remove} person="petitioner" />
    </section>
  );
}

function OtherNames({form,update,add,remove,person}) {
  const isPetitioner=person==='petitioner';
  const p=form[person]||{};
  const path=isPetitioner?'petitioner.otherNamesUsed':'beneficiary.otherNames';
  const names=Array.isArray(isPetitioner?p.otherNamesUsed:p.otherNames)?(isPetitioner?p.otherNamesUsed:p.otherNames):[];
  const hasExisting=names.some(x=>x&&(x.lastName||x.firstName||x.middleName));
  const answered=p.hasOtherNames|| (hasExisting?'yes':'');
  const change=(v)=>{
    update(`${person}.hasOtherNames`,v);
    if(v==='no') update(path,[]);
    if(v==='yes' && names.length===0) add(path,()=>({lastName:'',firstName:'',middleName:''}));
  };
  return (
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label={`Has the ${isPetitioner?'petitioner':'beneficiary'} ever used another name (including maiden names, nicknames or aliases)?`}>
        <YesNoSelect value={answered} onChange={change}/>
      </Field>
      {answered==='yes' && <>
        <div className="small">Enter the other name exactly as it was used. Add more if needed.</div>
        {names.map((n,i)=><div key={i} style={{display:'grid',gap:8}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            <Field label="Other last name"><input value={n.lastName||''} onChange={e=>update(`${path}.${i}.lastName`,e.target.value)}/></Field>
            <Field label="Other first name"><input value={n.firstName||''} onChange={e=>update(`${path}.${i}.firstName`,e.target.value)}/></Field>
            <Field label="Other middle name"><input value={n.middleName||''} onChange={e=>update(`${path}.${i}.middleName`,e.target.value)}/></Field>
          </div>
          <div><button type="button" className="btn" onClick={()=>remove(path,i)}>Remove name</button></div>
        </div>)}
        <div><button type="button" className="btn" onClick={()=>add(path,()=>({lastName:'',firstName:'',middleName:''}))}>Add another name</button></div>
        <div className="small">Names beyond the first are transferred as referenced continuation entries in Part 8.</div>
      </>}
    </div>
  );
}

/** =========================
 *  Part 1 — Addresses
 *  ========================= */
function Part1Addresses({form,update,add,remove}) {
  const P=form.petitioner||{};
  const a=Array.isArray(P.physicalAddresses)?P.physicalAddresses:[];
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 1 — Addresses</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Your mailing address</strong>
      <AddressInputs address={P.mailing||{}} path="petitioner.mailing" update={update} mailing/>
      <Field label="Is your mailing address the same as your current physical address?">
        <YesNoSelect value={P.mailing?.sameAsPhysical} onChange={v=>update('petitioner.mailing.sameAsPhysical',v==='yes')}/>
      </Field>
    </div>
    <div className="small">Physical addresses for the past five years (most recent first). Include the current address if different from your mailing address.</div>
    {a.map((x,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>Physical address {i+1}</strong>
      <AddressInputs address={x} path={`petitioner.physicalAddresses.${i}`} update={update} history/>
      {i>0 && <div><button type="button" className="btn" onClick={()=>remove('petitioner.physicalAddresses',i)}>Remove address</button></div>}
    </div>)}
    <div><button type="button" className="btn" onClick={()=>add('petitioner.physicalAddresses',emptyAddress)}>Add another physical address</button></div>
  </section>;
}

/** =========================
 *  Part 1 — Parents
 *  ========================= */
function Part1Parents({form,update}) {
  const parents=ensureArrayLen(form?.petitioner?.parents,2,()=>({...emptyName(),dob:'',sex:'',countryBirth:'',residenceCity:'',residenceCountry:''}));
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 1 — Your Parents</h3>
    {parents.slice(0,2).map((parent,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>Parent {i+1}</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        {['lastName','firstName','middleName'].map(k=><Field key={k} label={k==='lastName'?'Last name':k==='firstName'?'First name':'Middle name'}><input value={parent[k]||''} onChange={e=>update(`petitioner.parents.${i}.${k}`,e.target.value)}/></Field>)}
        <Field label="Date of birth"><DateInput value={parent.dob||''} onChange={v=>update(`petitioner.parents.${i}.dob`,v)}/></Field>
        <Field label="Sex"><select value={parent.sex||''} onChange={e=>update(`petitioner.parents.${i}.sex`,e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
        <Field label="Country of birth"><input value={parent.countryBirth||''} onChange={e=>update(`petitioner.parents.${i}.countryBirth`,e.target.value)}/></Field>
        <Field label="City or town of residence"><input value={parent.residenceCity||''} onChange={e=>update(`petitioner.parents.${i}.residenceCity`,e.target.value)}/></Field>
        <Field label="Country of residence"><input value={parent.residenceCountry||''} onChange={e=>update(`petitioner.parents.${i}.residenceCountry`,e.target.value)}/></Field>
      </div>
    </div>)}
  </section>;
}

/** =========================
 *  Part 2 — Beneficiary
 *  ========================= */
/** Part 2 — Beneficiary identification */
function Part2Identity({form,update,add,remove}) {
  const B=form.beneficiary||{};
  return (
    <section style={{display:'grid',gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Information About Your Beneficiary</h3>
      <div className="card" style={{display:'grid',gap:10}}>
        <div className="small"><strong>Beneficiary's full legal name</strong></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Last name"><input value={B.lastName||''} onChange={e=>update('beneficiary.lastName',e.target.value)}/></Field>
          <Field label="First name"><input value={B.firstName||''} onChange={e=>update('beneficiary.firstName',e.target.value)}/></Field>
          <Field label="Middle name (if any)"><input value={B.middleName||''} onChange={e=>update('beneficiary.middleName',e.target.value)}/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="A-Number, if any"><input value={B.aNumber||''} onChange={e=>update('beneficiary.aNumber',e.target.value)}/></Field>
          <Field label="U.S. Social Security number, if any"><input value={B.ssn||''} onChange={e=>update('beneficiary.ssn',e.target.value)}/></Field>
          <Field label="Date of birth"><DateInput value={B.dob||''} onChange={v=>update('beneficiary.dob',v)}/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Sex"><select value={B.sex||''} onChange={e=>update('beneficiary.sex',e.target.value)}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></Field>
          <Field label="Marital status"><select value={B.maritalStatus||''} onChange={e=>update('beneficiary.maritalStatus',e.target.value)}><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="City or town of birth"><input value={B.cityBirth||''} onChange={e=>update('beneficiary.cityBirth',e.target.value)}/></Field>
          <Field label="Country of birth"><input value={B.countryBirth||''} onChange={e=>update('beneficiary.countryBirth',e.target.value)}/></Field>
          <Field label="Country of citizenship or nationality"><input value={B.nationality||''} onChange={e=>update('beneficiary.nationality',e.target.value)}/></Field>
        </div>
      </div>
      <OtherNames form={form} update={update} add={add} remove={remove} person="beneficiary" />
    </section>
  );
}

/** =========================
 *  Part 2 — Beneficiary Addresses
 *  ========================= */
function Part2Addresses({form,update,add,remove}) {
  const B=form.beneficiary||{};
  const a=Array.isArray(B.physicalAddresses)?B.physicalAddresses:[];
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 2 — Beneficiary Addresses</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Beneficiary mailing address</strong>
      <AddressInputs address={B.mailing||{}} path="beneficiary.mailing" update={update} mailing/>
    </div>
    <div className="small">Enter the beneficiary's physical addresses for the past five years, starting with the most recent.</div>
    {a.map((x,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>Physical address {i+1}</strong>
      <AddressInputs address={x} path={`beneficiary.physicalAddresses.${i}`} update={update} history/>
      {i>0 && <div><button type="button" className="btn" onClick={()=>remove('beneficiary.physicalAddresses',i)}>Remove address</button></div>}
    </div>)}
    <div><button type="button" className="btn" onClick={()=>add('beneficiary.physicalAddresses',emptyAddress)}>Add another physical address</button></div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Address where the beneficiary intends to live in the United States</strong>
      <AddressInputs address={B.intendedUSAddress||{}} path="beneficiary.intendedUSAddress" update={update}/>
      <Field label="Daytime phone number at that address"><input value={B.usDaytimePhone||''} onChange={e=>update('beneficiary.usDaytimePhone',e.target.value)}/></Field>
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Beneficiary's physical address abroad</strong>
      <AddressInputs address={B.addressAbroad||{}} path="beneficiary.addressAbroad" update={update}/>
      <Field label="Daytime phone number abroad"><input value={B.abroadPhone||''} onChange={e=>update('beneficiary.abroadPhone',e.target.value)}/></Field>
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Beneficiary's name and address in their native alphabet (if different)</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        {['lastName','firstName','middleName'].map((key)=><Field key={key} label={key==='lastName'?'Last name':key==='firstName'?'First name':'Middle name'}><input value={B.nativeAlphabet?.[key]||''} onChange={e=>update(`beneficiary.nativeAlphabet.${key}`,e.target.value)}/></Field>)}
      </div>
      <AddressInputs address={B.nativeAlphabet||{}} path="beneficiary.nativeAlphabet" update={update}/>
    </div>
  </section>;
}

/** =========================
 *  Part 2 — Employment
 *  ========================= */


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
function Part3Criminal({form,update}) {
  const C=form?.petitioner?.criminal||{};
  const convictions=['arrestedOrConvicted2a','arrestedOrConvicted2b','arrestedOrConvicted2c'].some(k=>C[k]==='yes');
  const crimes=[
    ['arrestedOrConvicted2a','Have you ever been arrested or convicted of domestic violence, sexual assault, child abuse or neglect, dating violence, elder abuse, stalking, or an attempt to commit those crimes?'],
    ['arrestedOrConvicted2b','Have you ever been arrested or convicted of homicide, rape, sexual exploitation, trafficking, kidnapping, unlawful restraint, or any other crime listed in Part 3, Item 2.b?'],
    ['arrestedOrConvicted2c','Have you had three or more arrests or convictions, not from a single act, for crimes relating to drugs or alcohol?'],
  ];
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 3 — Criminal Information (Petitioner)</h3>
    <p className="hint">Answer each question carefully, including incidents with sealed or expunged records where required by the USCIS instructions. Review the full wording in Form I-129F before filing.</p>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Have you ever been subject to a temporary or permanent protection or restraining order, civil or criminal? (Item 1)"><YesNoSelect value={C.restrainingOrder} onChange={v=>update('petitioner.criminal.restrainingOrder',v)}/></Field>
      {crimes.map(([key,label],i)=><Field key={key} label={`Item 2.${'abc'[i]} — ${label}`}><YesNoSelect value={C[key]} onChange={v=>update(`petitioner.criminal.${key}`,v)}/></Field>)}
    </div>
    {convictions && <div className="card" style={{display:'grid',gap:10}}>
      <strong>Item 3 — If you were battered or subjected to extreme cruelty at the time of a conviction listed above, select each applicable statement.</strong>
      {[
        ['reasonSelfDefense','I was acting in self-defense.'],
        ['reasonViolatedProtectionOrder','I violated a protection order issued for my own protection.'],
        ['reasonBatteredCruelty','The crime did not result in serious bodily injury and was connected to being battered or subjected to extreme cruelty.'],
      ].map(([key,label])=><label key={key} style={{display:'flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={!!C[key]} onChange={e=>update(`petitioner.criminal.${key}`,e.target.checked)}/><span className="small">{label}</span></label>)}
    </div>}
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Have you ever been arrested, cited, charged, indicted, convicted, fined or imprisoned for violating any law, excluding certain minor traffic violations? (Item 4.a)"><YesNoSelect value={C.everArrestedCitedCharged} onChange={v=>update('petitioner.criminal.everArrestedCitedCharged',v)}/></Field>
      {C.everArrestedCitedCharged==='yes' && <Field label="Explain the dates, circumstances and outcomes (Item 4.b)"><textarea rows={6} value={C.everArrestedDetails||''} onChange={e=>update('petitioner.criminal.everArrestedDetails',e.target.value)}/></Field>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Which multiple-filer waiver category applies? (Item 5)">
        <select value={C.waiverType||''} onChange={e=>update('petitioner.criminal.waiverType',e.target.value)}>
          <option value="">Select</option>
          <option value="general">General waiver</option>
          <option value="extraordinary">Extraordinary circumstances waiver</option>
          <option value="mandatory">Mandatory waiver</option>
          <option value="not applicable">Not applicable — spouse or not a multiple filer</option>
        </select>
      </Field>
    </div>
  </section>;
}

/** =========================
 *  Part 4 — Other
 *  ========================= */
function Part1History({form,update,add,remove}) {
  const P=form.petitioner||{}, C=P.citizenship||{};
  const prior=Array.isArray(P.previousBeneficiaries)?P.previousBeneficiaries:[];
  const residences=Array.isArray(P.residencesSince18)?P.residencesSince18:[];
  const ages=Array.isArray(P.childrenAges)?P.childrenAges:[];
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 1 — Previous Marriages, Citizenship and Filing History</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Have you ever been married before?"><YesNoSelect value={P.previouslyMarried} onChange={v=>update('petitioner.previouslyMarried',v)}/></Field>
      {P.previouslyMarried==='yes' && <PersonNames entries={P.previousSpouses||[]} path="petitioner.previousSpouses" update={update} add={add} remove={remove} label="Previous spouse"/>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>How did you become a U.S. citizen?</strong>
      <Field label="U.S. citizenship"><select value={C.acquisition||''} onChange={e=>update('petitioner.citizenship.acquisition',e.target.value)}>
        <option value="">Select</option><option value="birth">Birth in the United States</option><option value="naturalization">Naturalization</option><option value="parents">U.S. citizen parents</option>
      </select></Field>
      <Field label="Have you obtained a Certificate of Naturalization or Certificate of Citizenship in your name?"><YesNoSelect value={C.certificateObtained} onChange={v=>update('petitioner.citizenship.certificateObtained',v)}/></Field>
      {C.certificateObtained==='yes' && <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        <Field label="Certificate number"><input value={C.certificateNumber||''} onChange={e=>update('petitioner.citizenship.certificateNumber',e.target.value)}/></Field>
        <Field label="Place of issuance"><input value={C.certificatePlace||''} onChange={e=>update('petitioner.citizenship.certificatePlace',e.target.value)}/></Field>
        <Field label="Date of issuance"><DateInput value={C.certificateDate||''} onChange={v=>update('petitioner.citizenship.certificateDate',v)}/></Field>
      </div>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Have you ever filed Form I-129F for another beneficiary?"><YesNoSelect value={P.filedForOtherBeneficiary} onChange={v=>update('petitioner.filedForOtherBeneficiary',v)}/></Field>
      {P.filedForOtherBeneficiary==='yes' && <>
        <div className="small">List each previous beneficiary, most recent first.</div>
        {prior.map((x,i)=><div className="card" key={i} style={{display:'grid',gap:10}}>
          <strong>Previous beneficiary {i+1}</strong>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            {['lastName','firstName','middleName'].map(key=><Field key={key} label={key==='lastName'?'Last name':key==='firstName'?'First name':'Middle name'}><input value={x[key]||''} onChange={e=>update(`petitioner.previousBeneficiaries.${i}.${key}`,e.target.value)}/></Field>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            <Field label="A-Number (if any)"><input value={x.aNumber||''} onChange={e=>update(`petitioner.previousBeneficiaries.${i}.aNumber`,e.target.value)}/></Field>
            <Field label="Date petition was filed"><DateInput value={x.filedDate||''} onChange={v=>update(`petitioner.previousBeneficiaries.${i}.filedDate`,v)}/></Field>
            <Field label="USCIS decision or action"><input value={x.result||''} onChange={e=>update(`petitioner.previousBeneficiaries.${i}.result`,e.target.value)}/></Field>
          </div>
          <div><button type="button" className="btn" onClick={()=>remove('petitioner.previousBeneficiaries',i)}>Remove</button></div>
        </div>)}
        <div><button type="button" className="btn" onClick={()=>add('petitioner.previousBeneficiaries',()=>({...emptyName(),aNumber:'',filedDate:'',result:''}))}>Add previous beneficiary</button></div>
      </>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Do you have children under 18?"><YesNoSelect value={P.childrenUnder18} onChange={v=>update('petitioner.childrenUnder18',v)}/></Field>
      {P.childrenUnder18==='yes' && <>
        {ages.map((a,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'end'}}>
          <Field label={`Child ${i+1} — Age`}><input type="number" min="0" max="17" className="measure-sm" value={a||''} onChange={e=>update(`petitioner.childrenAges.${i}`,e.target.value)}/></Field>
          <button type="button" className="btn" onClick={()=>remove('petitioner.childrenAges',i)}>Remove</button>
        </div>)}
        <button type="button" className="btn" onClick={()=>add('petitioner.childrenAges',()=> '')}>Add child's age</button>
      </>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Places you have lived since age 18</strong>
      <p className="hint">List U.S. states and foreign countries. The first two can be entered on the form; additional entries are referenced in Part 8.</p>
      {residences.map((r,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'end'}}>
        <Field label={`Residence ${i+1} — State (if applicable)`}><input value={r.state||''} onChange={e=>update(`petitioner.residencesSince18.${i}.state`,e.target.value)}/></Field>
        <Field label="Country"><input value={r.country||''} onChange={e=>update(`petitioner.residencesSince18.${i}.country`,e.target.value)}/></Field>
        <button type="button" className="btn" onClick={()=>remove('petitioner.residencesSince18',i)}>Remove</button>
      </div>)}
      <button type="button" className="btn" onClick={()=>add('petitioner.residencesSince18',()=>({state:'',country:''}))}>Add residence</button>
    </div>
  </section>;
}

/** Part 2 — Previous spouses, children and relationship questions. */
function Part2History({form,update,add,remove}) {
  const B=form.beneficiary||{}, kids=Array.isArray(B.children)?B.children:[], IM=B.imb||{};
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 2 — Beneficiary Family and Relationship</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Has your beneficiary ever been married before?"><YesNoSelect value={B.previouslyMarried} onChange={v=>update('beneficiary.previouslyMarried',v)}/></Field>
      {B.previouslyMarried==='yes' && <PersonNames entries={B.previousSpouses||[]} path="beneficiary.previousSpouses" update={update} add={add} remove={remove} label="Previous spouse"/>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Does your beneficiary have any children?"><YesNoSelect value={B.hasChildren} onChange={v=>update('beneficiary.hasChildren',v)}/></Field>
      {B.hasChildren==='yes' && <>
        <p className="hint">Add each child. Additional children will appear in Part 8 continuation information.</p>
        {kids.map((kid,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
          <strong>Child {i+1}</strong>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            {['lastName','firstName','middleName'].map(k=><Field key={k} label={k==='lastName'?'Last name':k==='firstName'?'First name':'Middle name'}><input value={kid[k]||''} onChange={e=>update(`beneficiary.children.${i}.${k}`,e.target.value)}/></Field>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
            <Field label="Date of birth"><DateInput value={kid.dob||''} onChange={v=>update(`beneficiary.children.${i}.dob`,v)}/></Field>
            <Field label="Country of birth"><input value={kid.countryBirth||''} onChange={e=>update(`beneficiary.children.${i}.countryBirth`,e.target.value)}/></Field>
            <Field label="Does this child live with the beneficiary?"><YesNoSelect value={kid.livesWithBeneficiary} onChange={v=>update(`beneficiary.children.${i}.livesWithBeneficiary`,v)}/></Field>
          </div>
          {kid.livesWithBeneficiary==='no' && <><strong>Child's physical residence</strong><AddressInputs address={kid.address||{}} path={`beneficiary.children.${i}.address`} update={update}/></>}
          <button type="button" className="btn" onClick={()=>remove('beneficiary.children',i)}>Remove child</button>
        </div>)}
        <button type="button" className="btn" onClick={()=>add('beneficiary.children',()=>({...emptyName(),dob:'',countryBirth:'',livesWithBeneficiary:'',address:emptyAddress()}))}>Add another child</button>
      </>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Are you and your fiancé(e) related to each other?"><YesNoNaSelect value={B.relatedToPetitioner} onChange={v=>update('beneficiary.relatedToPetitioner',v)}/></Field>
      {B.relatedToPetitioner==='yes' && <Field label="Describe how you are related"><textarea rows={3} value={B.relationshipDetails||''} onChange={e=>update('beneficiary.relationshipDetails',e.target.value)}/></Field>}
      <Field label="Have you met your fiancé(e) in person within the last two years?"><YesNoNaSelect value={B.metInPerson} onChange={v=>update('beneficiary.metInPerson',v)}/></Field>
      {(B.metInPerson==='yes'||B.metInPerson==='no') && <Field label={B.metInPerson==='yes'?'Describe when and where you met in person':'Explain why you qualify for an exemption from the in-person meeting requirement'}>
        <textarea rows={5} value={B.meetingDetails||''} onChange={e=>update('beneficiary.meetingDetails',e.target.value)}/>
      </Field>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Did you meet your beneficiary through an international marriage broker?"><YesNoSelect value={B.metThroughIMB} onChange={v=>update('beneficiary.metThroughIMB',v)}/></Field>
      {B.metThroughIMB==='yes' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Marriage broker name"><input value={IM.name||''} onChange={e=>update('beneficiary.imb.name',e.target.value)}/></Field>
          <Field label="Broker contact last name"><input value={IM.lastName||''} onChange={e=>update('beneficiary.imb.lastName',e.target.value)}/></Field>
          <Field label="Broker contact first name"><input value={IM.firstName||''} onChange={e=>update('beneficiary.imb.firstName',e.target.value)}/></Field>
          <Field label="Organization name"><input value={IM.organization||''} onChange={e=>update('beneficiary.imb.organization',e.target.value)}/></Field>
          <Field label="Website"><input value={IM.website||''} onChange={e=>update('beneficiary.imb.website',e.target.value)}/></Field>
          <Field label="Daytime phone"><input value={IM.phone||''} onChange={e=>update('beneficiary.imb.phone',e.target.value)}/></Field>
        </div>
        <strong>Broker's address</strong><AddressInputs address={IM.address||{}} path="beneficiary.imb.address" update={update}/>
      </>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Consular processing</strong>
      <p className="hint">Where will your beneficiary apply for a visa abroad?</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
        <Field label="U.S. Embassy/Consulate city"><input value={B.consulateCity||''} onChange={e=>update('beneficiary.consulateCity',e.target.value)}/></Field>
        <Field label="Country"><input value={B.consulateCountry||''} onChange={e=>update('beneficiary.consulateCountry',e.target.value)}/></Field>
      </div>
    </div>
  </section>;
}

function YesNoNaSelect({value,onChange}) {
  const normalized=String(value??'').toLowerCase();
  return <select value={normalized} onChange={e=>onChange(e.target.value)}><option value="">Select</option><option value="yes">Yes</option><option value="no">No</option><option value="na">N/A — beneficiary is my spouse</option></select>;
}

/** Part 2 — The beneficiary's previous U.S. visits / entry details. */
function Part2Immigration({form,update}) {
  const B=form.beneficiary||{};
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 2 — Previous Travel to the United States</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Has your beneficiary ever been in the United States?"><YesNoSelect value={B.everInUS||B.inUS} onChange={v=>{update('beneficiary.everInUS',v);update('beneficiary.inUS',v);}}/></Field>
      {(B.everInUS==='yes'||B.inUS==='yes') && <>
        <p className="hint">Provide arrival and status details where applicable. If the beneficiary is currently in the U.S., complete all relevant items.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Class of admission (visitor, student, etc.)"><input value={B.classOfAdmission||''} onChange={e=>update('beneficiary.classOfAdmission',e.target.value)}/></Field>
          <Field label="I-94 arrival/departure record number"><input value={B.i94||''} onChange={e=>update('beneficiary.i94',e.target.value)}/></Field>
          <Field label="Date of arrival"><DateInput value={B.arrivalDate||''} onChange={v=>update('beneficiary.arrivalDate',v)}/></Field>
          <Field label="Expiration of authorized stay"><DateInput value={B.statusExpires||''} onChange={v=>update('beneficiary.statusExpires',v)}/></Field>
          <Field label="Passport number"><input value={B.passportNumber||''} onChange={e=>update('beneficiary.passportNumber',e.target.value)}/></Field>
          <Field label="Travel document number (if any)"><input value={B.travelDocNumber||''} onChange={e=>update('beneficiary.travelDocNumber',e.target.value)}/></Field>
          <Field label="Passport/travel document country of issuance"><input value={B.passportCountry||''} onChange={e=>update('beneficiary.passportCountry',e.target.value)}/></Field>
          <Field label="Passport/travel document expiration"><DateInput value={B.passportExpiration||''} onChange={v=>update('beneficiary.passportExpiration',v)}/></Field>
        </div>
      </>}
    </div>
  </section>;
}

/** Part 4 on this USCIS form belongs to the petitioner. */
function Part4Biographic({form,update}) {
  const P=form.petitioner||{};
  const race=Array.isArray(P.race)?P.race:(P.race?[P.race]:[]);
  const raceValues=[['white','White'],['black','Black or African American'],['asian','Asian'],['aian','American Indian or Alaska Native'],['nhopi','Native Hawaiian or Other Pacific Islander']];
  const setRace=(value,checked)=>update('petitioner.race',checked?[...new Set([...race,value])]:race.filter(x=>x!==value));
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 4 — Petitioner's Biographic Information</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Ethnicity"><select value={P.ethnicityHispanic||''} onChange={e=>update('petitioner.ethnicityHispanic',e.target.value)}>
        <option value="">Select</option><option value="yes">Hispanic or Latino</option><option value="no">Not Hispanic or Latino</option>
      </select></Field>
      <strong>Race</strong>
      <p className="hint">USCIS permits selecting all applicable categories.</p>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8}}>
        {raceValues.map(([v,label])=><label key={v} style={{display:'flex',gap:8,alignItems:'center'}}>
          <input type="checkbox" checked={race.includes(v)} onChange={e=>setRace(v,e.target.checked)}/><span className="small">{label}</span>
        </label>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        <Field label="Height — feet"><input type="number" className="measure-sm" min="0" max="8" value={P.heightFeet||''} onChange={e=>update('petitioner.heightFeet',e.target.value)}/></Field>
        <Field label="Height — inches"><input type="number" className="measure-sm" min="0" max="11" value={P.heightInches||''} onChange={e=>update('petitioner.heightInches',e.target.value)}/></Field>
        <Field label="Weight — pounds"><input type="number" className="measure-sm" min="0" max="999" value={P.weight||''} onChange={e=>update('petitioner.weight',e.target.value)}/></Field>
        <Field label="Eye color"><select value={P.eyeColor||''} onChange={e=>update('petitioner.eyeColor',e.target.value)}>
          <option value="">Select</option>{['Black','Blue','Brown','Gray','Green','Hazel','Maroon','Pink','Unknown/Other'].map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}
        </select></Field>
        <Field label="Hair color"><select value={P.hairColor||''} onChange={e=>update('petitioner.hairColor',e.target.value)}>
          <option value="">Select</option>{['Black','Blond','Brown','Gray','Red','Sandy','White','Bald','Unknown/Other'].map(v=><option value={v.toLowerCase()} key={v}>{v}</option>)}
        </select></Field>
      </div>
    </div>
  </section>;
}

function Parts5to7({form,update}) {
  const C=form.contact||{},I=form.interpreter||{},P=form.preparer||{};
  const useInterpreter=I.used||(I.lastName||I.firstName||I.business?'yes':'');
  const usePreparer=P.used||(P.lastName||P.firstName||P.business?'yes':'');
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Parts 5–7 — Contact, Interpreter and Preparer</h3>
    <div className="card" style={{display:'grid',gap:10}}>
      <strong>Your contact information (Part 5)</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        <Field label="Daytime phone"><input value={C.daytimePhone||''} onChange={e=>update('contact.daytimePhone',e.target.value)}/></Field>
        <Field label="Mobile phone (if any)"><input value={C.mobile||''} onChange={e=>update('contact.mobile',e.target.value)}/></Field>
        <Field label="Email (if any)"><input type="email" value={C.email||''} onChange={e=>update('contact.email',e.target.value)}/></Field>
      </div>
      <p className="hint">Signature fields may need to be completed after downloading the PDF. Review the USCIS signing instructions before filing.</p>
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Did someone interpret this petition for you? (Part 6)"><YesNoSelect value={useInterpreter} onChange={v=>update('interpreter.used',v)}/></Field>
      {useInterpreter==='yes' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Interpreter last name"><input value={I.lastName||''} onChange={e=>update('interpreter.lastName',e.target.value)}/></Field>
          <Field label="Interpreter first name"><input value={I.firstName||''} onChange={e=>update('interpreter.firstName',e.target.value)}/></Field>
          <Field label="Company/organization (if any)"><input value={I.business||''} onChange={e=>update('interpreter.business',e.target.value)}/></Field>
          <Field label="Daytime phone"><input value={I.phone||''} onChange={e=>update('interpreter.phone',e.target.value)}/></Field>
          <Field label="Mobile (if any)"><input value={I.mobile||''} onChange={e=>update('interpreter.mobile',e.target.value)}/></Field>
          <Field label="Email (if any)"><input type="email" value={I.email||''} onChange={e=>update('interpreter.email',e.target.value)}/></Field>
          <Field label="Language used to interpret"><input value={I.language||''} onChange={e=>update('interpreter.language',e.target.value)}/></Field>
          <Field label="Date of signature"><DateInput value={I.signDate||''} onChange={v=>update('interpreter.signDate',v)}/></Field>
        </div>
      </>}
    </div>
    <div className="card" style={{display:'grid',gap:10}}>
      <Field label="Did someone other than the petitioner prepare this petition? (Part 7)"><YesNoSelect value={usePreparer} onChange={v=>update('preparer.used',v)}/></Field>
      {usePreparer==='yes' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
          <Field label="Preparer last name"><input value={P.lastName||''} onChange={e=>update('preparer.lastName',e.target.value)}/></Field>
          <Field label="Preparer first name"><input value={P.firstName||''} onChange={e=>update('preparer.firstName',e.target.value)}/></Field>
          <Field label="Company/organization (if any)"><input value={P.business||''} onChange={e=>update('preparer.business',e.target.value)}/></Field>
          <Field label="Daytime phone"><input value={P.phone||''} onChange={e=>update('preparer.phone',e.target.value)}/></Field>
          <Field label="Mobile (if any)"><input value={P.mobile||''} onChange={e=>update('preparer.mobile',e.target.value)}/></Field>
          <Field label="Email (if any)"><input type="email" value={P.email||''} onChange={e=>update('preparer.email',e.target.value)}/></Field>
          <Field label="Date of signature"><DateInput value={P.signDate||''} onChange={v=>update('preparer.signDate',v)}/></Field>
        </div>
      </>}
    </div>
  </section>;
}

/** Part 8 needs page/part/item references; free text is not silently placed here. */
function Part8Additional({form,update,add,remove}) {
  const entries=Array.isArray(form.continuation)?form.continuation:[];
  return <section style={{display:'grid',gap:12}}>
    <h3 style={{margin:0}}>Part 8 — Additional Information</h3>
    <p className="hint">Use this section only if you need more space to answer a specific USCIS question. Select the original page, part and item number so it can be referenced correctly in your downloaded form. Extra names, addresses and employers are added automatically where applicable.</p>
    {entries.map((x,i)=><div key={i} className="card" style={{display:'grid',gap:10}}>
      <strong>Additional response {i+1}</strong>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10}}>
        <Field label="PDF page number"><input type="number" min="1" max="12" value={x.page||''} onChange={e=>update(`continuation.${i}.page`,e.target.value)}/></Field>
        <Field label="Part number"><input type="number" min="1" max="8" value={x.part||''} onChange={e=>update(`continuation.${i}.part`,e.target.value)}/></Field>
        <Field label="Item number (for example 14.a)"><input value={x.item||''} onChange={e=>update(`continuation.${i}.item`,e.target.value)}/></Field>
      </div>
      <Field label="Your additional information"><textarea rows={5} value={x.text||''} onChange={e=>update(`continuation.${i}.text`,e.target.value)}/></Field>
      <button type="button" className="btn" onClick={()=>remove('continuation',i)}>Remove response</button>
    </div>)}
    <button type="button" className="btn" onClick={()=>add('continuation',()=>({page:'',part:'',item:'',text:''}))}>Add additional response</button>
    <p className="hint">The PDF has five continuation slots. If you need more than five total entries (including automatic continuations), attach additional Part 8 sheets when filing.</p>
  </section>;
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


    </section>
  );
}

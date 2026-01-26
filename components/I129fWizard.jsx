// components/I129fWizard.jsx
'use client';

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react';

/* ---------- Sections ---------- */
const SECTIONS = [
  { key: 'p1_ident', label: 'Part 1 — Petitioner (Identity)' },
  { key: 'p1_addr',  label: 'Part 1 — Addresses' },
  { key: 'p1_emp',   label: 'Part 1 — Employment' },
  { key: 'p1_par',   label: 'Part 1 — Parents & Naturalization' },
  { key: 'p2_ident', label: 'Part 2 — Beneficiary (Identity)' },
  { key: 'p2_addr',  label: 'Part 2 — Addresses' },
  { key: 'p2_emp',   label: 'Part 2 — Employment' },
  { key: 'p2_par',   label: 'Part 2 — Parents' },
  { key: 'p5_7',     label: 'Parts 5–7 — Contact / Interpreter / Preparer' },
  { key: 'p8',       label: 'Part 8 — Additional Info' },
  { key: 'review',   label: 'Review & Download' },
];

/* ---------- Empty ---------- */
const EMPTY = {
  petitioner: {
    aNumber:'', uscisOnlineAccount:'', ssn:'',
    lastName:'', firstName:'', middleName:'',
    otherNames:[{ lastName:'', firstName:'', middleName:'' }],
    phone:'', mobile:'', email:'',
    parents:[
      {
        lastName:'', firstName:'', middleName:'',
        maidenName:'', otherNames:'',
        dob:'', cityBirth:'', countryBirth:'',
        nationality:'', sex:'',
        currentCityCountry:'',
        isDeceased:false, deathDate:''
      },
      {
        lastName:'', firstName:'', middleName:'',
        maidenName:'', otherNames:'',
        dob:'', cityBirth:'', countryBirth:'',
        nationality:'', sex:'',
        currentCityCountry:'',
        isDeceased:false, deathDate:''
      },
    ],
    natzNumber:'', natzPlace:'', natzDate:'',
    sex:'', maritalStatus:'', provinceBirth:'', dob:'', cityBirth:'', countryBirth:'',
  },

  mailing:{
    inCareOf:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', isUS:true,
    sameAsPhysical:false,
  },

  physicalAddresses:[
    { street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', from:'', to:'' },
  ],

  employment:[
    { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
  ],

  beneficiary:{
    lastName:'', firstName:'', middleName:'',
    aNumber:'', ssn:'', dob:'', cityBirth:'', countryBirth:'', nationality:'',
    otherNames:[{ lastName:'', firstName:'', middleName:'' }],
    mailing:{ inCareOf:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
    physicalAddress:{ street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'' },
    employment:[
      { employer:'', street:'', unitType:'', unitNum:'', city:'', state:'', zip:'', province:'', postal:'', country:'', occupation:'', from:'', to:'' },
    ],
    parents:[
      {
        lastName:'', firstName:'', middleName:'',
        maidenName:'', otherNames:'',
        dob:'', cityBirth:'', countryBirth:'',
        nationality:'', sex:'',
        currentCityCountry:'',
        isDeceased:false, deathDate:''
      },
      {
        lastName:'', firstName:'', middleName:'',
        maidenName:'', otherNames:'',
        dob:'', cityBirth:'', countryBirth:'',
        nationality:'', sex:'',
        currentCityCountry:'',
        isDeceased:false, deathDate:''
      },
    ],
    inUS:'', i94:'', classOfAdmission:'', statusExpires:'', arrivalDate:'',
    passportNumber:'', travelDocNumber:'', passportCountry:'', passportExpiration:'',
  },

  interpreter:{ used:false, language:'', email:'', signDate:'', lastName:'', firstName:'', business:'', phone1:'', phone2:'' },
  preparer:{ used:false, lastName:'', firstName:'', business:'', phone:'', mobile:'', email:'', signDate:'' },

  part8:{ line3d:'', line4d:'', line5d:'', line6d:'' },

  other:{},

  classification:{ type:'', i130Filed:'' },
};

/* ---------- Path helpers ---------- */
const splitPath = (p)=>Array.isArray(p)?p:String(p).split('.');
function getPath(obj, path){ const parts=splitPath(path); let cur=obj; for(const k of parts){ if(cur==null) return undefined; cur=cur[k]; } return cur; }
function setPath(obj, path, value){ const parts=splitPath(path); const last=parts.pop(); let cur=obj; for(const k of parts){ if(cur[k]==null||typeof cur[k]!=='object') cur[k]={}; cur=cur[k]; } cur[last]=value; }

/* ---------- Dates ---------- */
function isoToUs(iso){ if(!iso) return ''; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim()); if(!m) return ''; return `${m[2]}/${m[3]}/${m[1]}`; }
function usToIso(us){ if(!us) return ''; const m=/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(us.trim()); if(!m) return ''; const mm=String(m[1]).padStart(2,'0'); const dd=String(m[2]).padStart(2,'0'); let yyyy=m[3]; if(yyyy.length===2) yyyy = Number(yyyy)>=70 ? '19'+yyyy : '20'+yyyy; return `${yyyy}-${mm}-${dd}`; }
function normalizeUs(s){ if(!s) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoToUs(s); if(/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(s)) return s;
  const d=new Date(s); if(!isNaN(d.getTime())){ const mm=String(d.getMonth()+1).padStart(2,'0'); const dd=String(d.getDate()).padStart(2,'0'); const yyyy=String(d.getFullYear()); return `${mm}/${dd}/${yyyy}`; }
  return s; }
function DateInput({ value, onChange }) {
  const isoValue = useMemo(() => { const us = normalizeUs(value||''); return us ? usToIso(us) : ''; }, [value]);
  return <input type="date" value={isoValue} onChange={e=>onChange(isoToUs(e.target.value))} />;
}

/* ---------- UI helpers ---------- */
function UnitTypeSelect({ value, onChange }) {
  return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value=""></option>
      <option value="Apt">Apt</option>
      <option value="Ste">Ste</option>
      <option value="Flr">Flr</option>
    </select>
  );
}
const NumCtx = createContext({ show:false, next:()=>null });

/* ---------- Wizard ---------- */
export default function I129fWizard() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saveNotice, setSaveNotice] = useState(null); // { type: 'info'|'success'|'error', message: string, time: string }
  const noticeTimerRef = useRef(null);
  const showNotice = (type, message) => {
    try { if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current); } catch {}
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSaveNotice({ type, message, time });
    noticeTimerRef.current = setTimeout(() => setSaveNotice(null), 4500);
  };
  useEffect(() => {
    return () => { try { if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current); } catch {} };
  }, []);
  const [form, setForm] = useState(EMPTY);

  // compact numbers with ?num=1
  const [showNumbers, setShowNumbers] = useState(false);
  useEffect(() => {
    try { const qs=new URLSearchParams(window.location.search); const raw=(qs.get('num')||'').toLowerCase(); setShowNumbers(raw==='1'||raw==='true'||raw==='yes'); } catch {}
  }, []);
  const counterRef = useRef(0);
  useEffect(()=>{ counterRef.current=0; },[step,showNumbers]);
  const numApi = useMemo(()=>({show:showNumbers,next:()=>++counterRef.current}),[showNumbers]);

  // load draft
  useEffect(() => { (async()=>{
    try {
      const r = await fetch('/api/i129f/load',{cache:'no-store',credentials:'include'});
      if(!r.ok) return;
      const j = await r.json();
      if(j?.ok && j.data){
        const merged = structuredClone(EMPTY);
        Object.assign(merged, j.data);
        merged.petitioner  = { ...EMPTY.petitioner,  ...(j.data.petitioner||{}) };
        merged.mailing     = { ...EMPTY.mailing,     ...(j.data.mailing||{}) };
        merged.beneficiary = { ...EMPTY.beneficiary, ...(j.data.beneficiary||{}) };
        merged.part8       = { ...EMPTY.part8,       ...(j.data.part8||{}) };
        merged.other       = {                        ...(j.data.other||{}) };
        merged.classification = { ...EMPTY.classification, ...(j.data.classification||{}) };
        merged.physicalAddresses = (Array.isArray(j.data.physicalAddresses) && j.data.physicalAddresses.length) ? j.data.physicalAddresses : EMPTY.physicalAddresses;
        merged.employment        = (Array.isArray(j.data.employment) && j.data.employment.length) ? j.data.employment : EMPTY.employment;
        setForm(merged);
      }
    } catch {}
  })(); }, []);

  function update(path, value){ setForm(prev=>{ const next=structuredClone(prev); setPath(next,path,value); return next; }); }
  function add(path, factory){ setForm(prev=>{ const next=structuredClone(prev); const arr=getPath(next,path); if(!Array.isArray(arr)) setPath(next,path,[]); getPath(next,path).push(factory()); return next; }); }
  function remove(path, idx){ setForm(prev=>{ const next=structuredClone(prev); const arr=getPath(next,path); if(Array.isArray(arr)) arr.splice(idx,1); return next; }); }

  function spillExtrasIntoPart8(n){
    const extras=[];
    const petOther=(n.petitioner?.otherNames||[]).slice(2);
    if(petOther.length){ const lines=petOther.map((x,i)=>`Petitioner Other Name #${i+3}: ${x.lastName||''}, ${x.firstName||''} ${x.middleName||''}`.trim()); extras.push(lines.join(' | ')); }
    const addrExtra=(n.physicalAddresses||[]).slice(2);
    if(addrExtra.length){ const lines=addrExtra.map((a,i)=>`Address #${i+3}: ${a.street||''} ${a.unitType||''} ${a.unitNum||''}, ${a.city||''} ${a.state||''} ${a.zip||a.postal||''}, ${a.country||''} (${a.from||''}–${a.to||''})`); extras.push(lines.join(' | ')); }
    const benOther=(n.beneficiary?.otherNames||[]).slice(2);
    if(benOther.length){ const lines=benOther.map((x,i)=>`Beneficiary Other Name #${i+3}: ${x.lastName||''}, ${x.firstName||''} ${x.middleName||''}`.trim()); extras.push(lines.join(' | ')); }
    const joined=extras.join(' || ');
    if(joined){ const cur=(n.part8?.line3d||'').trim(); const sep=cur?'\n':''; n.part8=n.part8||{}; n.part8.line3d = `${cur}${sep}${joined}`; }
  }

  async function save(){
    setBusy(true);
    showNotice('info', 'Saving...');
    try{
      const normalized=structuredClone(form);
      const datePaths=[
        'petitioner.dob',
        'petitioner.natzDate',
        'beneficiary.dob',
        'beneficiary.arrivalDate',
        'beneficiary.statusExpires',
        'beneficiary.passportExpiration',
        'preparer.signDate',
        'interpreter.signDate',
      ];
      datePaths.forEach(p=>{ const v=getPath(normalized,p); if(v) setPath(normalized,p,normalizeUs(v)); });
      (normalized.petitioner?.parents||[]).forEach((p,i)=>{ 
        if(p?.dob) setPath(normalized,`petitioner.parents.${i}.dob`,normalizeUs(p.dob));
        if(p?.deathDate) setPath(normalized,`petitioner.parents.${i}.deathDate`,normalizeUs(p.deathDate));
      });
      (normalized.beneficiary?.parents||[]).forEach((p,i)=>{ 
        if(p?.dob) setPath(normalized,`beneficiary.parents.${i}.dob`,normalizeUs(p.dob));
        if(p?.deathDate) setPath(normalized,`beneficiary.parents.${i}.deathDate`,normalizeUs(p.deathDate));
      });
      (normalized.physicalAddresses||[]).forEach((a,i)=>{ if(a?.from) setPath(normalized,`physicalAddresses.${i}.from`,normalizeUs(a.from)); if(a?.to) setPath(normalized,`physicalAddresses.${i}.to`,normalizeUs(a.to)); });
      (normalized.employment||[]).forEach((e,i)=>{ if(e?.from) setPath(normalized,`employment.${i}.from`,normalizeUs(e.from)); if(e?.to) setPath(normalized,`employment.${i}.to`,normalizeUs(e.to)); });
      (normalized.beneficiary?.employment||[]).forEach((e,i)=>{ if(e?.from) setPath(normalized,`beneficiary.employment.${i}.from`,normalizeUs(e.from)); if(e?.to) setPath(normalized,`beneficiary.employment.${i}.to`,normalizeUs(e.to)); });
      spillExtrasIntoPart8(normalized);

      const resp = await fetch('/api/i129f/save',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({data:normalized})});
      const j = await resp.json();
      if(!j?.ok) throw new Error(j?.error||'Save failed');
      showNotice('success', 'Progress saved');
    } catch(e){
      showNotice('error', 'Save failed. Make sure you are logged in.');
      console.error(e);
    }
    finally{ setBusy(false); }
  }

  function next(){ setStep(s=>Math.min(s+1,SECTIONS.length-1)); }
  function back(){ setStep(s=>Math.max(s-1,0)); }

  const Tabs = (
    <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:12}}>
      {SECTIONS.map((s,i)=>(
        <button key={s.key} type="button" onClick={()=>setStep(i)} className="small"
          style={{padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:i===step?'#eef2ff':'#fff', cursor:'pointer'}}
          title={s.label}>
          {i+1}. {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <NumCtx.Provider value={numApi}>
      {/* single-column container: easier to scan */}
      <div className="card" style={{display:'grid', gap:12, maxWidth:880, margin:'0 auto'}}>
        {Tabs}

        {saveNotice && (
          <div
            className="card"
            style={{
              borderColor:
                saveNotice.type === 'success'
                  ? '#86efac'
                  : saveNotice.type === 'error'
                  ? '#fca5a5'
                  : '#e2e8f0',
              background:
                saveNotice.type === 'success'
                  ? '#f0fdf4'
                  : saveNotice.type === 'error'
                  ? '#fef2f2'
                  : '#f8fafc',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div className="small" style={{ color: '#0f172a' }}>
                <strong>
                  {saveNotice.type === 'success'
                    ? 'Saved'
                    : saveNotice.type === 'error'
                    ? 'Error'
                    : 'Saving'}
                </strong>
                {': '}{saveNotice.message}
                <span className="muted" style={{ marginLeft: 8 }}>({saveNotice.time})</span>
              </div>
              <button type="button" className="btn" onClick={() => setSaveNotice(null)}>Close</button>
            </div>
          </div>
        )}

        {step===0 && <Part1Identity form={form} update={update} add={add} remove={remove} />}
        {step===1 && <Part1Addresses form={form} update={update} add={add} remove={remove} onCopyMailing={()=>{
          const m=form.mailing||{}; const copy={street:m.street, unitType:m.unitType, unitNum:m.unitNum, city:m.city, state:m.state, zip:m.zip, province:m.province, postal:m.postal, country:m.country, from:'', to:''};
          setForm(prev=>{ const next=structuredClone(prev); if(!Array.isArray(next.physicalAddresses)) next.physicalAddresses=[]; next.physicalAddresses[0]=next.physicalAddresses[0]||{}; Object.assign(next.physicalAddresses[0],copy); return next; });
        }} />}
        {step===2 && <Part1Employment form={form} update={update} add={add} remove={remove} />}
        {step===3 && <Part1ParentsNatz form={form} update={update} />}

        {step===4 && <Part2Identity form={form} update={update} add={add} remove={remove} />}
        {step===5 && <Part2Addresses form={form} update={update} />}
        {step===6 && <Part2Employment form={form} update={update} add={add} remove={remove} />}
        {step===7 && <Part2Parents form={form} update={update} />}

        {step===8 && <Parts5to7 form={form} update={update} />}
        {step===9 && <Part8Additional form={form} update={update} add={add} remove={remove} />}

        {step===10 && (
          <section style={{display:'grid', gap:10}}>
            <h3 style={{margin:0}}>Review & download</h3>
            <p className="small">
              Use <a href="/api/i129f/pdf-debug" target="_blank" rel="noreferrer">PDF debug overlay</a>.
            </p>
            <div>
              <a className="btn btn-primary" href="/api/i129f/pdf">Download I-129F (PDF)</a>
            </div>
          </section>
        )}

        <div style={{display:'flex', gap:8, justifyContent:'space-between', marginTop:8}}>
          <div style={{display:'flex', gap:8}}>
            <button type="button" onClick={back} className="btn" disabled={step===0}>Back</button>
            <button type="button" onClick={next} className="btn" disabled={step===SECTIONS.length-1}>Next</button>
          </div>
          <button type="button" onClick={save} className="btn btn-primary" disabled={busy}>{busy?'Saving…':'Save progress'}</button>
        </div>
      </div>
    </NumCtx.Provider>
  );
}

/* ---------- Sections (compact layout) ---------- */
function Part1Identity({ form, update, add, remove }){
  const onAddOther = () => add('petitioner.otherNames', ()=>({lastName:'', firstName:'', middleName:''}));
  const other = Array.isArray(form.petitioner?.otherNames)?form.petitioner.otherNames:[];
  const P = form.petitioner||{};
  return (
    <section style={{display:'grid', gap:10}}>
      <h3 style={{margin:0}}>Part 1 — Petitioner (Identity)</h3>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
        <Field label="A-Number"><input value={P.aNumber||''} onChange={e=>update('petitioner.aNumber', e.target.value)} /></Field>
        <Field label="USCIS Online Account #"><input value={P.uscisOnlineAccount||''} onChange={e=>update('petitioner.uscisOnlineAccount', e.target.value)} /></Field>
        <Field label="SSN"><input value={P.ssn||''} onChange={e=>update('petitioner.ssn', e.target.value)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
        <Field label="Family name (last)"><input value={P.lastName||''} onChange={e=>update('petitioner.lastName', e.target.value)} /></Field>
        <Field label="Given name (first)"><input value={P.firstName||''} onChange={e=>update('petitioner.firstName', e.target.value)} /></Field>
        <Field label="Middle name"><input value={P.middleName||''} onChange={e=>update('petitioner.middleName', e.target.value)} /></Field>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Classification</strong></div>
        <div style={{display:'flex', gap:20, alignItems:'center'}}>
          <label className="small" style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="radio" name="classification" checked={(form.classification?.type||'')==='k1'} onChange={()=>update('classification.type','k1')} />K-1 (Fiancé(e))
          </label>
          <label className="small" style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="radio" name="classification" checked={(form.classification?.type||'')==='k3'} onChange={()=>update('classification.type','k3')} />K-3 (Spouse)
          </label>
          {(form.classification?.type||'')==='k3' && (
            <span className="small" style={{display:'flex', gap:10, alignItems:'center', marginLeft:10}}>
              <span>Have you filed Form I-130?</span>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>
                <input type="radio" name="i130" checked={(form.classification?.i130Filed||'')==='yes'} onChange={()=>update('classification.i130Filed','yes')} />Yes
              </label>
              <label style={{display:'flex', gap:6, alignItems:'center'}}>
                <input type="radio" name="i130" checked={(form.classification?.i130Filed||'')==='no'} onChange={()=>update('classification.i130Filed','no')} />No
              </label>
            </span>
          )}
        </div>
      </div>

      <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Other Names Used</strong>
        <button type="button" className="btn" onClick={onAddOther}>+ Add other name</button>
      </div>
      {other.map((n,i)=>(
        <div key={i} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end'}}>
          <Field label={`Other name #${i+1} — Family`}><input value={n?.lastName||''} onChange={e=>update(`petitioner.otherNames.${i}.lastName`, e.target.value)} /></Field>
          <Field label="Given"><input value={n?.firstName||''} onChange={e=>update(`petitioner.otherNames.${i}.firstName`, e.target.value)} /></Field>
          <Field label="Middle"><input value={n?.middleName||''} onChange={e=>update(`petitioner.otherNames.${i}.middleName`, e.target.value)} /></Field>
          {i>0 && <button type="button" className="btn" onClick={()=>remove('petitioner.otherNames', i)}>Remove</button>}
        </div>
      ))}
    </section>
  );
}

function Part1Addresses({ form, update, add, remove, onCopyMailing }){
  const m=form.mailing||{};
  const list=Array.isArray(form.physicalAddresses)?form.physicalAddresses:[];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Addresses</h3>

      <div className="small"><strong>Mailing Address (Line 8)</strong></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
        <Field label="In care of (c/o)"><input value={m.inCareOf||''} onChange={e=>update('mailing.inCareOf', e.target.value)} /></Field>
        <Field label="Street number & name"><input value={m.street||''} onChange={e=>update('mailing.street', e.target.value)} /></Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="Unit type"><UnitTypeSelect value={m.unitType||''} onChange={v=>update('mailing.unitType', v)} /></Field>
        <Field label="Unit #"><input value={m.unitNum||''} onChange={e=>update('mailing.unitNum', e.target.value)} /></Field>
        <Field label="City"><input value={m.city||''} onChange={e=>update('mailing.city', e.target.value)} /></Field>
        <Field label="State"><input value={m.state||''} onChange={e=>update('mailing.state', e.target.value)} /></Field>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        <Field label="ZIP"><input value={m.zip||''} onChange={e=>update('mailing.zip', e.target.value)} /></Field>
        <Field label="Province"><input value={m.province||''} onChange={e=>update('mailing.province', e.target.value)} /></Field>
        <Field label="Postal Code"><input value={m.postal||''} onChange={e=>update('mailing.postal', e.target.value)} /></Field>
        <Field label="Country"><input value={m.country||''} onChange={e=>update('mailing.country', e.target.value)} /></Field>
      </div>

      <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
        <input type="checkbox" checked={!!m.sameAsPhysical} onChange={e=>{ update('mailing.sameAsPhysical',e.target.checked); if(e.target.checked) onCopyMailing(); }} />
        Mailing address is the same as current physical address
      </label>

      <div className="small" style={{marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>Physical Address History</strong>
        <button type="button" className="btn" onClick={()=>add('physicalAddresses',()=>({street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',from:'',to:''}))}>+ Add another address</button>
      </div>
      {list.map((a,i)=>{
        const ai=a||{};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Address #{i+1}</strong></div>
            <Field label="Street number & name"><input value={ai.street||''} onChange={e=>update(`physicalAddresses.${i}.street`, e.target.value)} /></Field>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="Unit type"><UnitTypeSelect value={ai.unitType||''} onChange={v=>update(`physicalAddresses.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={ai.unitNum||''} onChange={e=>update(`physicalAddresses.${i}.unitNum`, e.target.value)} /></Field>
              <Field label="City"><input value={ai.city||''} onChange={e=>update(`physicalAddresses.${i}.city`, e.target.value)} /></Field>
              <Field label="State"><input value={ai.state||''} onChange={e=>update(`physicalAddresses.${i}.state`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="ZIP"><input value={ai.zip||''} onChange={e=>update(`physicalAddresses.${i}.zip`, e.target.value)} /></Field>
              <Field label="Province"><input value={ai.province||''} onChange={e=>update(`physicalAddresses.${i}.province`, e.target.value)} /></Field>
              <Field label="Postal Code"><input value={ai.postal||''} onChange={e=>update(`physicalAddresses.${i}.postal`, e.target.value)} /></Field>
              <Field label="Country"><input value={ai.country||''} onChange={e=>update(`physicalAddresses.${i}.country`, e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="From"><DateInput value={ai.from||''} onChange={v=>update(`physicalAddresses.${i}.from`, v)} /></Field>
              <Field label="To"><DateInput value={ai.to||''} onChange={v=>update(`physicalAddresses.${i}.to`, v)} /></Field>
            </div>
            {i>0 && <button type="button" className="btn" onClick={()=>remove('physicalAddresses',i)}>Remove</button>}
          </div>
        );
      })}
    </section>
  );
}

function Part1Employment({ form, update, add, remove }){
  const list=Array.isArray(form.employment)?form.employment:[];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Employment (last 5 years)</h3>
      <div className="small" style={{display:'flex', justifyContent:'flex-end'}}>
        <button type="button" className="btn" onClick={()=>add('employment',()=>({employer:'',street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',occupation:'',from:'',to:''}))}>+ Add another employer</button>
      </div>
      {list.map((e,i)=>{
        const ei=e||{};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <Field label="Employer name"><input value={ei.employer||''} onChange={ev=>update(`employment.${i}.employer`, ev.target.value)} /></Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
              <Field label="Street"><input value={ei.street||''} onChange={ev=>update(`employment.${i}.street`, ev.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={ei.unitType||''} onChange={v=>update(`employment.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={ei.unitNum||''} onChange={ev=>update(`employment.${i}.unitNum`, ev.target.value)} /></Field>
              <Field label="City"><input value={ei.city||''} onChange={ev=>update(`employment.${i}.city`, ev.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="State"><input value={ei.state||''} onChange={ev=>update(`employment.${i}.state`, ev.target.value)} /></Field>
              <Field label="ZIP"><input value={ei.zip||''} onChange={ev=>update(`employment.${i}.zip`, ev.target.value)} /></Field>
              <Field label="Province"><input value={ei.province||''} onChange={ev=>update(`employment.${i}.province`, ev.target.value)} /></Field>
              <Field label="Postal Code"><input value={ei.postal||''} onChange={ev=>update(`employment.${i}.postal`, ev.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country"><input value={ei.country||''} onChange={ev=>update(`employment.${i}.country`, ev.target.value)} /></Field>
              <Field label="Occupation"><input value={ei.occupation||''} onChange={ev=>update(`employment.${i}.occupation`, ev.target.value)} /></Field>
              <Field label="From"><DateInput value={ei.from||''} onChange={v=>update(`employment.${i}.from`, v)} /></Field>
            </div>
            <Field label="To"><DateInput value={ei.to||''} onChange={v=>update(`employment.${i}.to`, v)} /></Field>
            {i>0 && <button type="button" className="btn" onClick={()=>remove('employment',i)}>Remove</button>}
          </div>
        );
      })}
    </section>
  );
}

function Part1ParentsNatz({ form, update }) {
  const parents = Array.isArray(form.petitioner?.parents) ? form.petitioner.parents : [];
  const ensureParent = (i) => parents[i] || {};

  const ParentCard = ({ idx, title }) => {
    const p = ensureParent(idx);
    const base = `petitioner.parents.${idx}`;
    return (
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>{title}</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name (last)"><input value={p.lastName||''} onChange={e=>update(`${base}.lastName`, e.target.value)} /></Field>
          <Field label="Given name (first)"><input value={p.firstName||''} onChange={e=>update(`${base}.firstName`, e.target.value)} /></Field>
          <Field label="Middle name"><input value={p.middleName||''} onChange={e=>update(`${base}.middleName`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Maiden/other last name(s)"><input value={p.maidenName||''} onChange={e=>update(`${base}.maidenName`, e.target.value)} /></Field>
          <Field label="Other names used"><input value={p.otherNames||''} onChange={e=>update(`${base}.otherNames`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          <Field label="Date of birth"><DateInput value={p.dob||''} onChange={v=>update(`${base}.dob`, v)} /></Field>
          <Field label="Sex"><input value={p.sex||''} onChange={e=>update(`${base}.sex`, e.target.value)} placeholder="M / F / X" /></Field>
          <Field label="Country of citizenship"><input value={p.nationality||''} onChange={e=>update(`${base}.nationality`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="City of birth"><input value={p.cityBirth||''} onChange={e=>update(`${base}.cityBirth`, e.target.value)} /></Field>
          <Field label="Country of birth"><input value={p.countryBirth||''} onChange={e=>update(`${base}.countryBirth`, e.target.value)} /></Field>
        </div>

        <Field label="Current city/country"><input value={p.currentCityCountry||''} onChange={e=>update(`${base}.currentCityCountry`, e.target.value)} placeholder="City, Country" /></Field>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, alignItems:'end'}}>
          <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!p.isDeceased} onChange={e=>update(`${base}.isDeceased`, e.target.checked)} />
            Deceased?
          </label>
          {p.isDeceased && (
            <Field label="Date of death">
              <DateInput value={p.deathDate||''} onChange={v=>update(`${base}.deathDate`, v)} />
            </Field>
          )}
        </div>
      </div>
    );
  };

  const P = form.petitioner || {};

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 1 — Parents & Naturalization</h3>

      <ParentCard idx={0} title="Parent 1 — Mother" />
      <ParentCard idx={1} title="Parent 2 — Father" />

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Petitioner Naturalization / Citizenship</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          <Field label="Certificate #"><input value={P.natzNumber||''} onChange={e=>update('petitioner.natzNumber', e.target.value)} /></Field>
          <Field label="Place of issuance"><input value={P.natzPlace||''} onChange={e=>update('petitioner.natzPlace', e.target.value)} /></Field>
          <Field label="Date of issuance"><DateInput value={P.natzDate||''} onChange={v=>update('petitioner.natzDate', v)} /></Field>
        </div>
      </div>
    </section>
  );
}

function Part2Identity({ form, update, add, remove }) {
  const B = form.beneficiary || {};
  const other = Array.isArray(B.otherNames) ? B.otherNames : [];
  const onAddOther = () => add('beneficiary.otherNames', ()=>({lastName:'', firstName:'', middleName:''}));

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Beneficiary (Identity)</h3>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
        <Field label="Family name (last)"><input value={B.lastName||''} onChange={e=>update('beneficiary.lastName', e.target.value)} /></Field>
        <Field label="Given name (first)"><input value={B.firstName||''} onChange={e=>update('beneficiary.firstName', e.target.value)} /></Field>
        <Field label="Middle name"><input value={B.middleName||''} onChange={e=>update('beneficiary.middleName', e.target.value)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
        <Field label="A-Number"><input value={B.aNumber||''} onChange={e=>update('beneficiary.aNumber', e.target.value)} /></Field>
        <Field label="SSN"><input value={B.ssn||''} onChange={e=>update('beneficiary.ssn', e.target.value)} /></Field>
        <Field label="Date of birth"><DateInput value={B.dob||''} onChange={v=>update('beneficiary.dob', v)} /></Field>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
        <Field label="City of birth"><input value={B.cityBirth||''} onChange={e=>update('beneficiary.cityBirth', e.target.value)} /></Field>
        <Field label="Country of birth"><input value={B.countryBirth||''} onChange={e=>update('beneficiary.countryBirth', e.target.value)} /></Field>
        <Field label="Nationality"><input value={B.nationality||''} onChange={e=>update('beneficiary.nationality', e.target.value)} /></Field>
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
        <div className="small"><strong>Beneficiary in the U.S. (if applicable)</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Is the beneficiary currently in the U.S.?"><input value={B.inUS||''} onChange={e=>update('beneficiary.inUS', e.target.value)} placeholder="Yes / No" /></Field>
          <Field label="I-94 number"><input value={B.i94||''} onChange={e=>update('beneficiary.i94', e.target.value)} /></Field>
          <Field label="Class of admission"><input value={B.classOfAdmission||''} onChange={e=>update('beneficiary.classOfAdmission', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          <Field label="Arrival date"><DateInput value={B.arrivalDate||''} onChange={v=>update('beneficiary.arrivalDate', v)} /></Field>
          <Field label="Status expires"><DateInput value={B.statusExpires||''} onChange={v=>update('beneficiary.statusExpires', v)} /></Field>
          <Field label="Passport #"><input value={B.passportNumber||''} onChange={e=>update('beneficiary.passportNumber', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Passport issuing country"><input value={B.passportCountry||''} onChange={e=>update('beneficiary.passportCountry', e.target.value)} /></Field>
          <Field label="Passport expiration"><DateInput value={B.passportExpiration||''} onChange={v=>update('beneficiary.passportExpiration', v)} /></Field>
          <Field label="Travel document #"><input value={B.travelDocNumber||''} onChange={e=>update('beneficiary.travelDocNumber', e.target.value)} /></Field>
        </div>
      </div>
    </section>
  );
}

function Part2Addresses({ form, update }) {
  const B = form.beneficiary || {};
  const mail = B.mailing || {};
  const phys = B.physicalAddress || {};

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Addresses</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Beneficiary Mailing Address</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:10}}>
          <Field label="In care of (c/o)"><input value={mail.inCareOf||''} onChange={e=>update('beneficiary.mailing.inCareOf', e.target.value)} /></Field>
          <Field label="Street"><input value={mail.street||''} onChange={e=>update('beneficiary.mailing.street', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="Unit type"><UnitTypeSelect value={mail.unitType||''} onChange={v=>update('beneficiary.mailing.unitType', v)} /></Field>
          <Field label="Unit #"><input value={mail.unitNum||''} onChange={e=>update('beneficiary.mailing.unitNum', e.target.value)} /></Field>
          <Field label="City"><input value={mail.city||''} onChange={e=>update('beneficiary.mailing.city', e.target.value)} /></Field>
          <Field label="State"><input value={mail.state||''} onChange={e=>update('beneficiary.mailing.state', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="ZIP"><input value={mail.zip||''} onChange={e=>update('beneficiary.mailing.zip', e.target.value)} /></Field>
          <Field label="Province"><input value={mail.province||''} onChange={e=>update('beneficiary.mailing.province', e.target.value)} /></Field>
          <Field label="Postal"><input value={mail.postal||''} onChange={e=>update('beneficiary.mailing.postal', e.target.value)} /></Field>
          <Field label="Country"><input value={mail.country||''} onChange={e=>update('beneficiary.mailing.country', e.target.value)} /></Field>
        </div>
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>Beneficiary Physical Address</strong></div>
        <Field label="Street"><input value={phys.street||''} onChange={e=>update('beneficiary.physicalAddress.street', e.target.value)} /></Field>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="Unit type"><UnitTypeSelect value={phys.unitType||''} onChange={v=>update('beneficiary.physicalAddress.unitType', v)} /></Field>
          <Field label="Unit #"><input value={phys.unitNum||''} onChange={e=>update('beneficiary.physicalAddress.unitNum', e.target.value)} /></Field>
          <Field label="City"><input value={phys.city||''} onChange={e=>update('beneficiary.physicalAddress.city', e.target.value)} /></Field>
          <Field label="State"><input value={phys.state||''} onChange={e=>update('beneficiary.physicalAddress.state', e.target.value)} /></Field>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
          <Field label="ZIP"><input value={phys.zip||''} onChange={e=>update('beneficiary.physicalAddress.zip', e.target.value)} /></Field>
          <Field label="Province"><input value={phys.province||''} onChange={e=>update('beneficiary.physicalAddress.province', e.target.value)} /></Field>
          <Field label="Postal"><input value={phys.postal||''} onChange={e=>update('beneficiary.physicalAddress.postal', e.target.value)} /></Field>
          <Field label="Country"><input value={phys.country||''} onChange={e=>update('beneficiary.physicalAddress.country', e.target.value)} /></Field>
        </div>
      </div>
    </section>
  );
}

function Part2Employment({ form, update, add, remove }){
  const list = Array.isArray(form.beneficiary?.employment) ? form.beneficiary.employment : [];
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Employment (last 5 years)</h3>
      <div className="small" style={{display:'flex', justifyContent:'flex-end'}}>
        <button
          type="button"
          className="btn"
          onClick={()=>add('beneficiary.employment',()=>({employer:'',street:'',unitType:'',unitNum:'',city:'',state:'',zip:'',province:'',postal:'',country:'',occupation:'',from:'',to:''}))}
        >
          + Add another employer
        </button>
      </div>

      {list.map((e,i)=>{
        const ei = e || {};
        return (
          <div key={i} className="card" style={{display:'grid', gap:10}}>
            <div className="small"><strong>Employer #{i+1}</strong></div>
            <Field label="Employer name"><input value={ei.employer||''} onChange={ev=>update(`beneficiary.employment.${i}.employer`, ev.target.value)} /></Field>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="Street"><input value={ei.street||''} onChange={ev=>update(`beneficiary.employment.${i}.street`, ev.target.value)} /></Field>
              <Field label="Unit type"><UnitTypeSelect value={ei.unitType||''} onChange={v=>update(`beneficiary.employment.${i}.unitType`, v)} /></Field>
              <Field label="Unit #"><input value={ei.unitNum||''} onChange={ev=>update(`beneficiary.employment.${i}.unitNum`, ev.target.value)} /></Field>
              <Field label="City"><input value={ei.city||''} onChange={ev=>update(`beneficiary.employment.${i}.city`, ev.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
              <Field label="State"><input value={ei.state||''} onChange={ev=>update(`beneficiary.employment.${i}.state`, ev.target.value)} /></Field>
              <Field label="ZIP"><input value={ei.zip||''} onChange={ev=>update(`beneficiary.employment.${i}.zip`, ev.target.value)} /></Field>
              <Field label="Province"><input value={ei.province||''} onChange={ev=>update(`beneficiary.employment.${i}.province`, ev.target.value)} /></Field>
              <Field label="Postal"><input value={ei.postal||''} onChange={ev=>update(`beneficiary.employment.${i}.postal`, ev.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Country"><input value={ei.country||''} onChange={ev=>update(`beneficiary.employment.${i}.country`, ev.target.value)} /></Field>
              <Field label="Occupation"><input value={ei.occupation||''} onChange={ev=>update(`beneficiary.employment.${i}.occupation`, ev.target.value)} /></Field>
              <Field label="From"><DateInput value={ei.from||''} onChange={v=>update(`beneficiary.employment.${i}.from`, v)} /></Field>
            </div>
            <Field label="To"><DateInput value={ei.to||''} onChange={v=>update(`beneficiary.employment.${i}.to`, v)} /></Field>
            {i>0 && <button type="button" className="btn" onClick={()=>remove('beneficiary.employment',i)}>Remove</button>}
          </div>
        );
      })}
    </section>
  );
}

function Part2Parents({ form, update }) {
  const parents = Array.isArray(form.beneficiary?.parents) ? form.beneficiary.parents : [];
  const ensureParent = (i) => parents[i] || {};

  const ParentCard = ({ idx, title }) => {
    const p = ensureParent(idx);
    const base = `beneficiary.parents.${idx}`;
    return (
      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small"><strong>{title}</strong></div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          <Field label="Family name (last)"><input value={p.lastName||''} onChange={e=>update(`${base}.lastName`, e.target.value)} /></Field>
          <Field label="Given name (first)"><input value={p.firstName||''} onChange={e=>update(`${base}.firstName`, e.target.value)} /></Field>
          <Field label="Middle name"><input value={p.middleName||''} onChange={e=>update(`${base}.middleName`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="Maiden/other last name(s)"><input value={p.maidenName||''} onChange={e=>update(`${base}.maidenName`, e.target.value)} /></Field>
          <Field label="Other names used"><input value={p.otherNames||''} onChange={e=>update(`${base}.otherNames`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          <Field label="Date of birth"><DateInput value={p.dob||''} onChange={v=>update(`${base}.dob`, v)} /></Field>
          <Field label="Sex"><input value={p.sex||''} onChange={e=>update(`${base}.sex`, e.target.value)} placeholder="M / F / X" /></Field>
          <Field label="Country of citizenship"><input value={p.nationality||''} onChange={e=>update(`${base}.nationality`, e.target.value)} /></Field>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <Field label="City of birth"><input value={p.cityBirth||''} onChange={e=>update(`${base}.cityBirth`, e.target.value)} /></Field>
          <Field label="Country of birth"><input value={p.countryBirth||''} onChange={e=>update(`${base}.countryBirth`, e.target.value)} /></Field>
        </div>

        <Field label="Current city/country"><input value={p.currentCityCountry||''} onChange={e=>update(`${base}.currentCityCountry`, e.target.value)} placeholder="City, Country" /></Field>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, alignItems:'end'}}>
          <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!p.isDeceased} onChange={e=>update(`${base}.isDeceased`, e.target.checked)} />
            Deceased?
          </label>
          {p.isDeceased && (
            <Field label="Date of death">
              <DateInput value={p.deathDate||''} onChange={v=>update(`${base}.deathDate`, v)} />
            </Field>
          )}
        </div>
      </div>
    );
  };

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 2 — Parents</h3>
      <ParentCard idx={0} title="Parent 1" />
      <ParentCard idx={1} title="Parent 2" />
    </section>
  );
}

function Parts5to7({ form, update }) {
  const I = form.interpreter || {};
  const P = form.preparer || {};

  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Parts 5–7 — Contact / Interpreter / Preparer</h3>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <strong>Interpreter</strong>
          <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!I.used} onChange={e=>update('interpreter.used', e.target.checked)} />
            Used an interpreter
          </label>
        </div>

        {I.used && (
          <>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
              <Field label="Language"><input value={I.language||''} onChange={e=>update('interpreter.language', e.target.value)} /></Field>
              <Field label="Email"><input value={I.email||''} onChange={e=>update('interpreter.email', e.target.value)} /></Field>
              <Field label="Signature date"><DateInput value={I.signDate||''} onChange={v=>update('interpreter.signDate', v)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Family name (last)"><input value={I.lastName||''} onChange={e=>update('interpreter.lastName', e.target.value)} /></Field>
              <Field label="Given name (first)"><input value={I.firstName||''} onChange={e=>update('interpreter.firstName', e.target.value)} /></Field>
              <Field label="Business/Org"><input value={I.business||''} onChange={e=>update('interpreter.business', e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <Field label="Phone"><input value={I.phone1||''} onChange={e=>update('interpreter.phone1', e.target.value)} /></Field>
              <Field label="Mobile"><input value={I.phone2||''} onChange={e=>update('interpreter.phone2', e.target.value)} /></Field>
            </div>
          </>
        )}
      </div>

      <div className="card" style={{display:'grid', gap:10}}>
        <div className="small" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <strong>Preparer</strong>
          <label className="small" style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="checkbox" checked={!!P.used} onChange={e=>update('preparer.used', e.target.checked)} />
            Someone prepared this form for you
          </label>
        </div>

        {P.used && (
          <>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Family name (last)"><input value={P.lastName||''} onChange={e=>update('preparer.lastName', e.target.value)} /></Field>
              <Field label="Given name (first)"><input value={P.firstName||''} onChange={e=>update('preparer.firstName', e.target.value)} /></Field>
              <Field label="Business/Org"><input value={P.business||''} onChange={e=>update('preparer.business', e.target.value)} /></Field>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
              <Field label="Phone"><input value={P.phone||''} onChange={e=>update('preparer.phone', e.target.value)} /></Field>
              <Field label="Mobile"><input value={P.mobile||''} onChange={e=>update('preparer.mobile', e.target.value)} /></Field>
              <Field label="Email"><input value={P.email||''} onChange={e=>update('preparer.email', e.target.value)} /></Field>
            </div>
            <Field label="Signature date"><DateInput value={P.signDate||''} onChange={v=>update('preparer.signDate', v)} /></Field>
          </>
        )}
      </div>
    </section>
  );
}

function Part8Additional({ form, update }) {
  const A = form.part8 || {};
  return (
    <section style={{display:'grid', gap:12}}>
      <h3 style={{margin:0}}>Part 8 — Additional Info</h3>
      <Field label="Line 3d"><textarea value={A.line3d||''} onChange={e=>update('part8.line3d', e.target.value)} /></Field>
      <Field label="Line 4d"><textarea value={A.line4d||''} onChange={e=>update('part8.line4d', e.target.value)} /></Field>
      <Field label="Line 5d"><textarea value={A.line5d||''} onChange={e=>update('part8.line5d', e.target.value)} /></Field>
      <Field label="Line 6d"><textarea value={A.line6d||''} onChange={e=>update('part8.line6d', e.target.value)} /></Field>
    </section>
  );
}

function Field({ label, children }){
  const { show, next } = useContext(NumCtx);
  const n = show ? next() : null;
  return (
    <label className="small" style={{display:'grid', gap:6}}>
      <span>{label} {show && <code style={{opacity:.6}}>#{n}</code>}</span>
      {children}
    </label>
  );
}

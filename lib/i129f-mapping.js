
/**
 * Liaison wizard -> I-129F PDF, October 2026 named template.
 * Matches PDF part / USCIS item numbers and actual field types; no renamed PDF IDs.
 * Use only with the named public/i-129f.pdf supplied with this update.
 */
const clean = (s) => String(s ?? '').toLowerCase().replace(/#([0-9a-f]{2})/gi,(_,n)=>String.fromCharCode(parseInt(n,16)))
  .replace(/[^a-z0-9]+/g,' ').trim();
const filled = (v) => v !== null && v !== undefined && String(v).trim() !== '';
const truth = (v) => v === true || ['yes','true','1','y'].includes(clean(v));
const no = (v) => v === false || ['no','false','0','n'].includes(clean(v));
const date = (v) => {const s=String(v??''); const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[2]}/${m[3]}/${m[1]}`:s;};
const itemKey = (name) => {
  // USCIS item immediately following the first part/page designator.
  const s = String(name);
  const m = s.match(/(?:part\s*(\d+)\s*[_ -]*page\s*(\d+)|page\s*(\d+)\s*[_ -]*part\s*(\d+))\s*[_ -]*#\s*(\d+)(?:\s*\.\s*([a-z]))?/i);
  if (!m) return null;
  return `${+(m[1] || m[4])}:${+(m[2] || m[3])}:${+m[5]}${m[6]?'.'+m[6].toLowerCase():''}`;
};

export function applyI129fMapping(data, form) {
  if (!form || typeof form.getFields !== 'function') throw new Error('applyI129fMapping requires a pdf-lib form');
  const index = new Map();
  const touched = new Set();
  const missing = [];
  const warnings = [];
  const radioSelections = [];
  for (const f of form.getFields()) {
    const k = itemKey(f.getName());
    if (k) { if (!index.has(k)) index.set(k,[]); index.get(k).push(f); }
  }
  const field = (part,page,item,type='Text',contains='') => {
    const key = `${part}:${page}:${item}`;
    const candidates = index.get(key) || [];
    const arr = candidates.filter(f => f.constructor.name === (type==='RadioGroup'?'PDFRadioGroup':type==='CheckBox'?'PDFCheckBox':'PDFTextField')
      && (!contains || clean(f.getName()).includes(clean(contains))));
    if (!arr.length) missing.push(`${key} ${type} ${contains}`);
    return arr[0] || null;
  };
  const put = (part,page,item,value,contains='') => {
    if (!filled(value)) return;
    const f=field(part,page,item,'Text',contains); if (!f) return;
    f.setText(date(value)); touched.add(f.getName());
  };
  const option = (f, want) => {
    if (!f || !filled(want)) return;
    const choices = f.getOptions();
    if (!choices.length) return;
    const raw = clean(want);
    const alias = {
      'k1':'k 1', 'k3':'k 3',
      'apt':'apartment', 'ste':'suite', 'flr':'floor',
      'single':'single', 'never married':'single',
      'nhopi':'native hawaiian', 'aian':'american indian',
      'unknown':'unknown other', 'unknown other':'unknown other',
      'na':'n a', 'n/a':'n a', 'not applicable':'n a',
      'general':'general waiver', 'extraordinary':'extraordinary circumstances',
      'mandatory':'mandatory waiver',
    };
    const wanted = alias[raw] || raw;
    const texts = choices.map(o => ({ original:o, text:clean(o) }));
    const isNo = /^(no|not|n a|na|none|never)/.test(wanted);
    const isYes = wanted === 'yes';
    const isMale = wanted === 'male';
    const isNotHispanic = wanted.startsWith('not hispanic');
    const isHispanic = wanted.startsWith('hispanic');
    const match = (t) => {
      if (isYes) return /(?:^| )yes(?: checkbox| check box)?$/.test(t);
      if (wanted==='no') return /(?:^| )no(?: checkbox| check box)?$/.test(t);
      if (isMale) return /(?:^| )male(?: checkbox| check box)?$/.test(t) && !/(?:^| )female(?: checkbox| check box)?$/.test(t);
      if (wanted==='female') return /(?:^| )female(?: checkbox| check box)?$/.test(t);
      if (isNotHispanic) return /not hispanic or latino/.test(t);
      if (isHispanic) return /hispanic or latino/.test(t) && !/not hispanic or latino/.test(t);
      if (wanted === 'n a') return /(?:n a|not applicable|beneficiary is my spouse|not applicable beneficiary)/.test(t);
      if (wanted === 'general waiver') return (/general waiver/.test(t) || /no permanent restraining orders or conviction/.test(t)) && !/extraordinary|mandatory/.test(t);
      if (wanted === 'extraordinary circumstances') return /extraordinary circumstances|prior permanent restraining orders or criminal conviction/.test(t) && !/resulting from domestic violence/.test(t);
      if (wanted === 'mandatory waiver') return /mandatory waiver|resulting from domestic violence/.test(t);
      if (wanted === 'k 1') return /k 1 visa/.test(t);
      if (wanted === 'k 3') return /k 3 visa/.test(t);
      if (wanted === 'unknown other') return /unkown|unknown ?(?:or )?other/.test(t);
      if (['black','brown','gray','red','green','blue','hazel','pink','maroon','blond','sandy','white','bald'].includes(wanted)) return new RegExp('(?:^| )'+wanted+'(?: eyes?| hair| checkbox| check box)?$').test(t);
      return (t.endsWith(wanted) || t.endsWith(`${wanted} checkbox`) || t.endsWith(`${wanted} check box`) ||
        t.endsWith(`${wanted} eyes`) || t.endsWith(`${wanted} hair`) || t.includes(` ${wanted} checkbox`) ||
        (t.includes(wanted) && !isNo && !/^(?:black|brown|gray|red|green)$/.test(wanted)));
    };
    const found = texts.find(({text}) => match(text));
    if (found) {
      f.select(found.original);
      touched.add(f.getName());
      radioSelections.push([f.getName(), found.original]);
    } else {
      missing.push(`Option '${want}' in ${f.getName().slice(0,100)}. Available: ${texts.map(t=>t.text.slice(-45)).join(' | ')}`);
    }
  };
  const radio = (part,page,item,value,contains='') => {
    if (!filled(value)) return;
    const f=field(part,page,item,'RadioGroup',contains);
    if (!f) return;
    const normalized=truth(value)?'yes':no(value)?'no':String(value).trim().toLowerCase();
    option(f,normalized);
  };
  const choose = (part,page,item,value) => {
    if (!filled(value)) return;
    option(field(part,page,item,'RadioGroup'),value);
  };
  const independent = (part,page,item,value) => {
    if (!truth(value)) return;
    const f=field(part,page,item,'RadioGroup');
    if (f && f.getOptions().length) {f.select(f.getOptions()[0]); touched.add(f.getName());}
  };
  const unit = (part,page,item,a) => {
    if (!a) return;
    put(part,page,item,a.unitNumber,'number');
    if (filled(a.unitType)) choose(part,page,item,({apt:'apartment',ste:'suite',flr:'floor'})[String(a.unitType).toLowerCase()]||a.unitType);
  };
  const addr = (part,page,n,a,fromItem,toItem) => {
    if (!a) return;
    const x = ['street','unit','city','state','zip','province','postal','country'];
    const letters = ['a','b','c','d','e','f','g','h'];
    for(let i=0;i<x.length;i++) {
      const it=`${n}.${letters[i]}`;
      if(i===1) unit(part,page,it,a);
      else put(part,page,it,a[x[i]]);
    }
    if(fromItem)put(part,page,fromItem,a.from);
    if(toItem)put(part,page,toItem,a.to);
  };
  const mailing = (part,page,n,a) => {
    if(!a)return;
    const attrs=['inCareOf','street',null,'city','state','zip','province','postal','country'];
    for(let i=0;i<attrs.length;i++) {const it=`${n}.${'abcdefghi'[i]}`;if(i===2)unit(part,page,it,a);else put(part,page,it,a[attrs[i]]);}
  };
  const jobs = (part,entries,layout) => {
    (entries||[]).slice(0,2).forEach((j,i)=>{
      if(!j)return;const l=layout[i];if(!l)return;
      put(part,l.page,l.employer,j.employer);put(part,l.page,l.occupation,j.occupation);
      addr(part,l.page,l.addr,j,l.nextPage?null:l.from,l.nextPage?null:l.to);
      if(l.nextPage) {put(part,l.nextPage,l.from,j.from);put(part,l.nextPage,l.to,j.to);}
    });
  };
  const p=data?.petitioner||{}, b=data?.beneficiary||{}, c=p.criminal||{};
  // Part 1, page 1
  put(1,1,'1',p.aNumber);put(1,1,'2',p.uscisOnlineAccount || p.uscisOnlineAccountNumber);put(1,1,'3',p.ssn);
  choose(1,1,'4.a',p.classification==='k3'?'k 3':p.classification==='k1'?'k 1':'');
  radio(1,1,'5',p.filedI130);
  ['lastName','firstName','middleName'].forEach((x,i)=>put(1,1,`6.${'abc'[i]}`,p[x]));
  const po=(p.otherNamesUsed||[]).filter(o=>o && (o.lastName||o.firstName||o.middleName));
  ['lastName','firstName','middleName'].forEach((x,i)=>put(1,1,`7.${'abc'[i]}`,po[0]?.[x]));
  mailing(1,1,'8',p.mailing);radio(1,1,'8.j',p.mailing?.sameAsPhysical);
  // Part 1 addresses + employment history
  (p.physicalAddresses||[]).slice(0,2).forEach((a,i)=>addr(1,2,i?'11':'9',a,i?'12.a':'10.a',i?'12.b':'10.b'));
  jobs(1,p.employment,[
    {page:2,employer:'13',addr:'14',occupation:'15',from:'16.a',to:'16.b'},
    {page:2,employer:'17',addr:'18',occupation:'19',from:'20.a',to:'20.b',nextPage:3}
  ]);
  radio(1,3,'21',p.sex);put(1,3,'22',p.dob);radio(1,3,'23',p.maritalStatus);
  put(1,3,'24',p.cityBirth);put(1,3,'25',p.provinceBirth);put(1,3,'26',p.countryBirth);
  (p.parents||[]).slice(0,2).forEach((a,i)=>{
    const l=i?{name:32,dob:33,sex:34,birth:35,res:36}:{name:27,dob:28,sex:29,birth:30,res:31};
    ['lastName','firstName','middleName'].forEach((x,j)=>put(1,3,`${l.name}.${'abc'[j]}`,a?.[x]));
    put(1,3,String(l.dob),a?.dob);radio(1,3,String(l.sex),a?.sex);
    put(1,3,String(l.birth),a?.countryBirth);
    const parts=String(a?.currentCityCountry||'').split(',');
    put(1,3,`${l.res}.a`,a?.residenceCity||parts[0]);put(1,3,`${l.res}.b`,a?.residenceCountry||parts.slice(1).join(',').trim());
  });
  radio(1,3,'37',p.previouslyMarried);
  const sp=(p.previousSpouses||[])[0]||{};
  ['lastName','firstName','middleName'].forEach((x,i)=>put(1,3,`38.${'abc'[i]}`,sp[x]));put(1,3,'39',sp.ended);
  const citizen=clean(p.citizenship?.acquisition);
  choose(1,3,'40',citizen.includes('natural')?'naturalization':citizen.includes('parent')?'citizen parents':citizen.includes('birth')?'birth in the united states':'');
  radio(1,3,'41',p.citizenship?.certificateObtained);
  put(1,4,'42.a',p.citizenship?.certificateNumber);put(1,4,'42.b',p.citizenship?.certificatePlace);put(1,4,'42.c',p.citizenship?.certificateDate);
  radio(1,4,'43',p.filedForOtherBeneficiary);
  const old=(p.previousBeneficiaries||[])[0]||{};
  put(1,4,'44',old.aNumber);['lastName','firstName','middleName'].forEach((x,i)=>put(1,4,`45.${'abc'[i]}`,old[x]));
  put(1,4,'46',old.filedDate);put(1,4,'47',old.result);
  radio(1,4,'48',p.childrenUnder18);
  (p.childrenAges||[]).slice(0,2).forEach((age,i)=>put(1,4,`49.${'ab'[i]}`,age));
  (p.residencesSince18||[]).slice(0,2).forEach((r,i)=>{const n=i?51:50;put(1,4,`${n}.a`,r.state);put(1,4,`${n}.b`,r.country);});
  // Part 2
  ['lastName','firstName','middleName'].forEach((x,i)=>put(2,4,`1.${'abc'[i]}`,b[x]));
  put(2,4,'2',b.aNumber);put(2,4,'3',b.ssn);put(2,4,'4',b.dob);radio(2,4,'5',b.sex);radio(2,4,'6',b.maritalStatus);
  put(2,4,'7',b.cityBirth);put(2,4,'8',b.countryBirth);put(2,4,'9',b.nationality);
  const bo=(b.otherNames||[]).filter(o=>o && (o.lastName||o.firstName||o.middleName));
  ['lastName','firstName','middleName'].forEach((x,i)=>put(2,4,`10.${'abc'[i]}`,bo[0]?.[x]));
  mailing(2,5,'11',b.mailing);
  (b.physicalAddresses||[]).slice(0,2).forEach((a,i)=>addr(2,5,i?'14':'12',a,i?'15.a':'13.a',i?'15.b':'13.b'));
  jobs(2,b.employment,[
    {page:5,employer:'16',addr:'17',occupation:'18',from:'19.a',to:'19.b'},
    {page:6,employer:'20',addr:'21',occupation:'22',from:'23.a',to:'23.b'}
  ]);
  (b.parents||[]).slice(0,2).forEach((a,i)=>{
    const l=i?{name:29,dob:30,sex:31,birth:32,res:33}:{name:24,dob:25,sex:26,birth:27,res:28};
    ['lastName','firstName','middleName'].forEach((x,j)=>put(2,6,`${l.name}.${'abc'[j]}`,a?.[x]));
    put(2,6,String(l.dob),a?.dob);radio(2,6,String(l.sex),a?.sex);
    put(2,6,String(l.birth),a?.countryBirth);put(2,6,`${l.res}.a`,a?.residenceCity);put(2,6,`${l.res}.b`,a?.residenceCountry);
  });
  radio(2,6,'34',b.previouslyMarried);
  const bsp=(b.previousSpouses||[])[0]||{};
  ['lastName','firstName','middleName'].forEach((x,i)=>put(2,6,`35.${'abc'[i]}`,bsp[x]));put(2,6,'36',bsp.ended);
  radio(2,6,'37',b.everInUS||b.inUS);
  put(2,6,'38.a',b.classOfAdmission);put(2,6,'38.b',b.i94);put(2,6,'38.c',b.arrivalDate);
  put(2,7,'38.d',b.statusExpires);put(2,7,'38.e',b.passportNumber);put(2,7,'38.f',b.travelDocNumber);
  put(2,7,'38.g',b.passportCountry);put(2,7,'38.h',b.passportExpiration);
  radio(2,7,'39',b.hasChildren);
  const kid=(b.children||[])[0]||{};
  ['lastName','firstName','middleName'].forEach((x,i)=>put(2,7,`40.${'abc'[i]}`,kid[x]));
  put(2,7,'41',kid.countryBirth);put(2,7,'42',kid.dob);radio(2,7,'43',kid.livesWithBeneficiary);
  const childAddr=kid.address||{};
  addr(2,7,'44',childAddr);
  addr(2,7,'45',b.intendedUSAddress);
  put(2,7,'46',b.usDaytimePhone);
  const abroad=b.addressAbroad||{};
  for(const [item,key] of Object.entries({'47.a':'street','47.c':'city','47.d':'province','47.e':'postal','47.f':'country'}))put(2,7,item,abroad[key]);
  unit(2,7,'47.b',abroad);put(2,7,'48',b.abroadPhone);
  const native=b.nativeAlphabet||{};
  ['lastName','firstName','middleName'].forEach((x,i)=>put(2,7,`49.${'abc'[i]}`,native[x]));
  for(const [item,key] of Object.entries({'50.a':'street','50.c':'city','50.d':'province','50.e':'postal','50.f':'country'}))put(2,7,item,native);
  unit(2,7,'50.b',native);
  radio(2,8,'51',b.relatedToPetitioner);put(2,8,'52',b.relationshipDetails);
  radio(2,8,'53',b.metInPerson);put(2,8,'54',b.meetingDetails);
  radio(2,8,'55',b.metThroughIMB);
  const imb=b.imb||{};
  put(2,8,'56',imb.name);put(2,8,'57.a',imb.lastName);put(2,8,'57.b',imb.firstName);put(2,8,'58',imb.organization);
  put(2,8,'59',imb.website);
  const imba=imb.address||{};
  for (const [it,key] of Object.entries({'60.a':'street','60.c':'city','60.d':'province','60.e':'postal','60.f':'country'}))put(2,8,it,imba[key]);
  unit(2,8,'60.b',imba);put(2,8,'61',imb.phone);
  put(2,8,'62.a',b.consulateCity);put(2,8,'62.b',b.consulateCountry);
  // Part 3
  radio(3,8,'1',c.restrainingOrder);radio(3,8,'2.a',c.arrestedOrConvicted2a);
  radio(3,9,'2.b',c.arrestedOrConvicted2b);radio(3,9,'2.c',c.arrestedOrConvicted2c);
  independent(3,9,'3.a',c.reasonSelfDefense);independent(3,9,'3.b',c.reasonViolatedProtectionOrder);independent(3,9,'3.c',c.reasonBatteredCruelty);
  radio(3,9,'4.a',c.everArrestedCitedCharged);put(3,9,'4.b',c.everArrestedDetails);
  const waiver=String(c.waiverType||'').toLowerCase().trim();
  choose(3,9,'5.a',waiver);
  // Part 4, petitioner biographic
  const eth=p.ethnicityHispanic ?? b.ethnicityHispanic;
  radio(4,9,'1',truth(eth)?'hispanic or latino':no(eth)?'not hispanic or latino':eth);
  const pvRace=p.race ?? b.race;
  const races=Array.isArray(pvRace)?pvRace:(pvRace?[pvRace]:[]);
  for(const race of races){
    const all=[...form.getFields()].filter(f=>itemKey(f.getName())==='4:9:2'&&f.constructor.name==='PDFCheckBox');
    const match=all.find(f=>{const r=clean(race);const n=clean(f.getName());return n.endsWith(r+' checkbox') || (r==='black'&&n.includes('black or african'))||(r==='nhopi'&&n.includes('native hawaiian'))||(r==='aian'&&n.includes('american indian'));});
    if(match){match.check();touched.add(match.getName());}
  }
  put(4,9,'3',p.heightFeet ?? b.heightFeet,'feet');put(4,9,'3',p.heightInches ?? b.heightInches,'inches');
  if(filled(p.weight ?? b.weight)) {
    const w=String(p.weight ?? b.weight).replace(/\D/g,'').padStart(3,'0').slice(-3);
    put(4,9,'4',w[0],'hundreds');put(4,9,'4',w[1],"10 s");put(4,9,'4',w[2],'ones');
  }
  choose(4,9,'5',p.eyeColor ?? b.eyeColor);choose(4,9,'6',p.hairColor ?? b.hairColor);
  // Parts 5-7
  const contact=data?.contact||{};
  put(5,10,'1',contact.daytimePhone);put(5,10,'2',contact.mobile);put(5,10,'3',contact.email);
  put(5,10,'4',contact.signDate);
  const interp=data?.interpreter||{};
  put(6,10,'1',interp.lastName,'family name');put(6,10,'1',interp.firstName,'given name');
  put(6,10,'2',interp.business);put(6,10,'3',interp.phone);put(6,10,'4',interp.mobile);put(6,10,'5',interp.email,'email');
  // This unnumbered fluency field follows item 5 in this custom PDF.
  if (filled(interp.language)) {
    const fluencyField=form.getFields().find(f => f.constructor.name==='PDFTextField' && /part\s*6.*page\s*10/i.test(f.getName()) && /certification.*fluent/i.test(f.getName()));
    if(fluencyField){fluencyField.setText(String(interp.language));touched.add(fluencyField.getName());}
    else missing.push('Interpreter certification language field (unnumbered)');
  }
  put(6,10,'6',interp.signDate);
  const prep=data?.preparer||{};
  put(7,10,'1',prep.lastName,'family name');put(7,10,'1',prep.firstName,'given name');
  put(7,10,'2',prep.business);put(7,10,'3',prep.phone);put(7,10,'4',prep.mobile);put(7,10,'5',prep.email);
  put(7,11,'6',prep.signDate);
  // Part 8 header always repeats petitioner's name and A-number, not additional aliases.
  ['lastName','firstName','middleName'].forEach((x,i)=>put(8,12,`1.${'abc'[i]}`,p[x]));put(8,12,'2',p.aNumber);
  const continuation = Array.isArray(data?.continuation)? [...data.continuation] : [];
  const makeName=(a)=>[a.lastName,a.firstName,a.middleName].filter(filled).join(', ');
  const makeAddress=(a)=>[a.street,[a.unitType,a.unitNumber].filter(filled).join(' '),a.city,a.state,a.zip,a.province,a.postal,a.country,
    (filled(a.from)||filled(a.to))?`From ${date(a.from||'')} to ${date(a.to||'')}`:''].filter(filled).join(', ');
  const makeJob=(a)=>[a.employer,a.occupation,makeAddress(a)].filter(filled).join(' — ');
  const extra=(arr,start,part,page,item,formatter)=>{
    (Array.isArray(arr)?arr:[]).slice(start).forEach(v=>{const text=formatter(v||{});if(filled(text)) continuation.push({part,page,item,text});});
  };
  extra(p.otherNamesUsed,1,1,1,'7.a–7.c',makeName);
  extra(p.physicalAddresses,2,1,2,'9.a–12.b',makeAddress);
  extra(p.employment,2,1,2,'13–20.b',makeJob);
  extra(p.previousSpouses,1,1,3,'38.a–39',v=>`${makeName(v)}, ended ${date(v.ended||'')}`);
  extra(p.previousBeneficiaries,1,1,4,'44–47',v=>[makeName(v),v.aNumber,v.filedDate,v.result].filter(filled).join(', '));
  extra(p.residencesSince18,2,1,4,'50–51',v=>[v.state,v.country].filter(filled).join(', '));
  extra(b.otherNames,1,2,4,'10.a–10.c',makeName);
  extra(b.physicalAddresses,2,2,5,'12.a–15.b',makeAddress);
  extra(b.employment,2,2,5,'16–23.b',makeJob);
  extra(b.previousSpouses,1,2,6,'35.a–36',v=>`${makeName(v)}, ended ${date(v.ended||'')}`);
  extra(b.children,1,2,7,'40–44',v=>[makeName(v),v.dob,v.countryBirth,makeAddress(v.address||{})].filter(filled).join(', '));
  if(filled(data?.additionalInfo) && !continuation.some(x=>String(x.text||'')===String(data.additionalInfo))) {
    warnings.push('Unreferenced additionalInfo text was not sent to Part 8. Enter the correct part, page and item in the continuation section.');
  }
  const entries=continuation.filter(e=>e && filled(e.text) && filled(e.part) && filled(e.page) && filled(e.item));
  if(continuation.length>entries.length) warnings.push(`${continuation.length-entries.length} continuation notes lack Part/Page/Item and were omitted.`);

  // The first printed items 3.a-7.d are five continuation slots.
  entries.slice(0,5).forEach((e,i)=>{
    const n=i+3;put(8,12,`${n}.a`,e.page);put(8,12,`${n}.b`,e.part);put(8,12,`${n}.c`,e.item);put(8,12,`${n}.d`,e.text);
  });
  if(entries.length>5) warnings.push(`${entries.length-5} continuation entries exceed the five available PDF slots; attach additional Part 8 sheets.`);
  return {mappedFields:touched.size,missing:[...new Set(missing)],warnings,continuationOverflow:Math.max(0,entries.length-5),radioSelections:radioSelections.length};
}

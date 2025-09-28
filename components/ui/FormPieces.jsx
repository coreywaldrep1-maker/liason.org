// components/ui/FormPieces.jsx
'use client';
import AutoTranslate from '@/components/AutoTranslate';

export function Card({title, subtitle, children}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold"><AutoTranslate text={title} /></h2>
        {subtitle && <p className="text-sm text-gray-500"><AutoTranslate text={subtitle} /></p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export function Row({label, children}) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-gray-500 mb-1">
        {typeof label === 'string' ? <AutoTranslate text={label} /> : label}
      </span>
      {children}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`border rounded px-3 py-2 w-full ${props.className||''}`} />;
}

export function Select({options=[], ...props}) {
  return (
    <select {...props} className={`border rounded px-3 py-2 w-full ${props.className||''}`}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function YesNo({value, onChange}) {
  const yes = String(value).toLowerCase()==='yes' || value===true;
  const no  = String(value).toLowerCase()==='no'  || value===false;
  return (
    <div className="flex gap-4 items-center">
      <label className="flex items-center gap-2 text-sm">
        <input type="radio" checked={yes} onChange={()=>onChange('yes')} />
        <AutoTranslate text="Yes" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="radio" checked={no} onChange={()=>onChange('no')} />
        <AutoTranslate text="No" />
      </label>
    </div>
  );
}

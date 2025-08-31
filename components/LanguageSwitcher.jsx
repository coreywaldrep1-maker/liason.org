'use client';

export default function LanguageSwitcher() {
  // read cookie if present
  const current = (typeof document !== 'undefined' && document.cookie.match(/(?:^|; )liason_lang=([^;]+)/))
    ? decodeURIComponent(RegExp.$1)
    : 'en';

  const onChange = (e) => {
    const val = e.target.value;
    document.cookie = `liason_lang=${encodeURIComponent(val)}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <select
      aria-label="Language"
      defaultValue={current}
      onChange={onChange}
      style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="fr">FR</option>
    </select>
  );
}

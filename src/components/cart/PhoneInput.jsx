import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown, AlertCircle, Check, Search } from 'lucide-react';

/**
 * Selector de país + input de teléfono — estándar mundial (Stripe / WhatsApp / Twilio).
 *
 * UX:
 *  - Botón izquierdo con bandera 🇨🇱 + código (+56) → abre dropdown
 *  - Dropdown con buscador, países priorizados (Chile, LatAm, USA/España)
 *  - Input limpio a la derecha — el usuario solo escribe los dígitos locales
 *  - Internamente almacena `+<code><number>` (E.164) — compatible con validarTelefonoChile
 *
 * Props:
 *  - value: string completo (ej "+56979471933") — controlado
 *  - onChange(value): retorna el string E.164
 *  - onBlur, error, isValid, hint
 */

// Países priorizados — Chile primero, luego LatAm + USA/España (mercados de PEYU)
const COUNTRIES = [
  { code: 'CL', name: 'Chile',         dial: '+56', flag: '🇨🇱', length: 9, placeholder: '9 1234 5678' },
  { code: 'AR', name: 'Argentina',     dial: '+54', flag: '🇦🇷', length: 10, placeholder: '11 2345 6789' },
  { code: 'PE', name: 'Perú',          dial: '+51', flag: '🇵🇪', length: 9, placeholder: '912 345 678' },
  { code: 'CO', name: 'Colombia',      dial: '+57', flag: '🇨🇴', length: 10, placeholder: '321 234 5678' },
  { code: 'MX', name: 'México',        dial: '+52', flag: '🇲🇽', length: 10, placeholder: '55 1234 5678' },
  { code: 'BR', name: 'Brasil',        dial: '+55', flag: '🇧🇷', length: 11, placeholder: '11 91234 5678' },
  { code: 'UY', name: 'Uruguay',       dial: '+598', flag: '🇺🇾', length: 8, placeholder: '9123 4567' },
  { code: 'PY', name: 'Paraguay',      dial: '+595', flag: '🇵🇾', length: 9, placeholder: '981 234 567' },
  { code: 'BO', name: 'Bolivia',       dial: '+591', flag: '🇧🇴', length: 8, placeholder: '7123 4567' },
  { code: 'EC', name: 'Ecuador',       dial: '+593', flag: '🇪🇨', length: 9, placeholder: '99 123 4567' },
  { code: 'VE', name: 'Venezuela',     dial: '+58', flag: '🇻🇪', length: 10, placeholder: '412 1234567' },
  { code: 'US', name: 'Estados Unidos', dial: '+1', flag: '🇺🇸', length: 10, placeholder: '555 123 4567' },
  { code: 'ES', name: 'España',        dial: '+34', flag: '🇪🇸', length: 9, placeholder: '612 34 56 78' },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Chile

// Detecta el país a partir del valor E.164 actual
function detectCountry(value) {
  if (!value) return DEFAULT_COUNTRY;
  const v = String(value).replace(/\s/g, '');
  // Probamos los dial codes más largos primero para evitar colisiones (+1 vs +56)
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find(c => v.startsWith(c.dial)) || DEFAULT_COUNTRY;
}

// Extrae solo los dígitos locales (sin el prefijo de país)
function getLocalDigits(value, country) {
  if (!value) return '';
  const v = String(value).replace(/\s/g, '');
  if (v.startsWith(country.dial)) return v.slice(country.dial.length);
  return v.replace(/^\+/, ''); // si no matchea, quitar solo el +
}

export default function PhoneInput({
  value = '',
  onChange,
  onBlur,
  error,
  isValid,
  hint,
  required,
  label = 'Teléfono · WhatsApp',
  name = 'telefono',
}) {
  const [country, setCountry] = useState(() => detectCountry(value));
  const [localValue, setLocalValue] = useState(() => getLocalDigits(value, detectCountry(value)));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sincronizar cuando cambia el value externo (ej: autofill del navegador)
  useEffect(() => {
    const detected = detectCountry(value);
    const local = getLocalDigits(value, detected);
    if (detected.code !== country.code) setCountry(detected);
    if (local !== localValue) setLocalValue(local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updateValue = (newCountry, newLocal) => {
    // Solo dígitos en local
    const digits = String(newLocal).replace(/\D/g, '');
    const full = digits ? `${newCountry.dial}${digits}` : '';
    onChange?.({ target: { value: full } });
  };

  const handleLocalChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setLocalValue(digits);
    updateValue(country, digits);
  };

  const selectCountry = (c) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
    updateValue(c, localValue);
  };

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const showError = !!error;
  const showValid = !showError && isValid && localValue;

  return (
    <div className="w-full min-w-0" ref={wrapperRef}>
      <label
        htmlFor={name}
        className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className={[
        'flex w-full box-border rounded-xl bg-gray-50 border transition-all overflow-hidden',
        showError
          ? 'border-red-300 bg-red-50/40 focus-within:ring-2 focus-within:ring-red-200'
          : showValid
            ? 'border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-200'
            : 'border-gray-200 focus-within:border-gray-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-200',
      ].join(' ')}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 pl-3.5 pr-2.5 h-12 hover:bg-gray-100/60 transition-colors border-r border-gray-200/70 flex-shrink-0"
          aria-label="Seleccionar país"
          aria-expanded={open}
        >
          <span className="text-xl leading-none">{country.flag}</span>
          <span className="text-sm font-semibold text-gray-700 tabular-nums">{country.dial}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Phone digits input */}
        <Input
          id={name}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={localValue}
          onChange={handleLocalChange}
          onBlur={onBlur}
          placeholder={country.placeholder}
          className="flex-1 min-w-0 h-12 text-[15px] border-0 bg-transparent rounded-none focus-visible:ring-0 focus:ring-0 px-3.5 shadow-none"
        />

        {showValid && (
          <div className="flex items-center pr-3.5">
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="relative">
          <div className="absolute z-50 mt-2 w-full sm:w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar país..."
                  className="w-full h-9 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">Sin resultados</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      c.code === country.code ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span className="text-xl leading-none flex-shrink-0">{c.flag}</span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{c.name}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{c.dial}</span>
                    {c.code === country.code && (
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showError ? (
        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}
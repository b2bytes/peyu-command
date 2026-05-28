// ============================================================================
// PhoneCountryInput · Campo de teléfono con selector de país LATAM emergente.
// El prefijo (+56 Chile por defecto) es fijo y visible; al hacer clic se abre
// una pestaña emergente compacta para elegir otro país. El valor final que se
// guarda en el form incluye el prefijo: "+56 9 1234 5678".
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { LATAM_COUNTRIES, DEFAULT_COUNTRY, findCountryByDial } from '@/lib/latam-phones';

export default function PhoneCountryInput({ value = '', onChange, placeholder = '9 1234 5678' }) {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const ref = useRef(null);

  // Parsear valor entrante: separar prefijo del número
  useEffect(() => {
    if (!value) return;
    const match = LATAM_COUNTRIES
      .slice()
      .sort((a, b) => b.dial.length - a.dial.length)
      .find(c => value.startsWith(c.dial));
    if (match) setCountry(match);
  }, []); // solo al montar

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const numberPart = value.replace(country.dial, '').trim();

  const emit = (dial, num) => onChange(`${dial} ${num}`.trim());

  const selectCountry = (c) => {
    setCountry(c);
    setOpen(false);
    emit(c.dial, numberPart);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-stretch gap-2">
        {/* Selector de país */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-12 rounded-xl bg-white/[0.06] border border-white/15 text-white hover:bg-white/[0.10] hover:border-teal-400/40 transition-all flex-shrink-0"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-sm font-bold tabular-nums">{country.dial}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Número */}
        <input
          type="tel"
          value={numberPart}
          onChange={e => emit(country.dial, e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 px-3.5 focus:outline-none focus:border-teal-400/60 focus:bg-white/[0.10] transition-all"
        />
      </div>

      {/* Pestaña emergente de países */}
      {open && (
        <div className="absolute z-50 mt-2 left-0 w-64 max-h-72 overflow-y-auto rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2.5 py-1.5">Selecciona país</p>
          {LATAM_COUNTRIES.map(c => {
            const active = c.code === country.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                  active ? 'bg-teal-500/20 text-white' : 'text-white/75 hover:bg-white/[0.07]'
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                <span className="text-xs font-bold tabular-nums text-white/50">{c.dial}</span>
                {active && <Check className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
import GiftCardVisual from '@/components/giftcard/GiftCardVisual';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

const PRESET_MONTOS = [
  { v: 10000, label: '$10.000', tag: 'Detalle', sub: 'Cumpleaños o agradecimiento' },
  { v: 20000, label: '$20.000', tag: 'Más popular', sub: 'Día de la madre / regalo amigo', popular: true },
  { v: 50000, label: '$50.000', tag: 'Premium', sub: 'Fechas importantes' },
  { v: 100000, label: '$100.000', tag: 'Corporativo', sub: 'Reconocimiento ejecutivo' },
];

const MIN_CUSTOM = 5000;
const MAX_CUSTOM = 500000;

export default function AmountSelector({ monto, onChange }) {
  const isPreset = PRESET_MONTOS.some(m => m.v === monto.v);
  const [custom, setCustom] = useState(isPreset ? '' : String(monto.v));
  const [showCustom, setShowCustom] = useState(!isPreset);

  const handleCustomChange = (raw) => {
    const num = parseInt(raw.replace(/[^\d]/g, '')) || 0;
    setCustom(num ? String(num) : '');
    if (num >= MIN_CUSTOM && num <= MAX_CUSTOM) {
      onChange({ v: num, label: `$${num.toLocaleString('es-CL')}`, tag: 'Personalizado' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRESET_MONTOS.map(m => {
          const sel = !showCustom && monto.v === m.v;
          return (
            <button
              key={m.v}
              type="button"
              onClick={() => { setShowCustom(false); onChange(m); }}
              className={`group relative text-left rounded-2xl transition-all overflow-hidden ${
                sel
                  ? 'ring-2 ring-emerald-400 ring-offset-4 ring-offset-slate-900 scale-[1.02] shadow-2xl shadow-emerald-500/20'
                  : 'opacity-80 hover:opacity-100 hover:scale-[1.01] hover:shadow-xl'
              }`}
            >
              <GiftCardVisual monto={m.v} />
              {m.popular && !sel && (
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full shadow">
                  <Sparkles className="w-2.5 h-2.5" /> Popular
                </span>
              )}
              {sel && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-slate-900" strokeWidth={3} />
                </div>
              )}
              <div className="bg-slate-900/85 backdrop-blur px-3 py-2 text-xs">
                <p className="text-white/90 font-semibold leading-tight">{m.tag}</p>
                <p className="text-white/45 text-[10px] truncate">{m.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Monto personalizado */}
      <div className={`rounded-2xl border-2 transition-all ${
        showCustom
          ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
          : 'border-white/15 bg-white/5'
      }`}>
        <button
          type="button"
          onClick={() => setShowCustom(s => !s)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${showCustom ? 'text-emerald-400' : 'text-white/40'}`} />
            <span className={`font-semibold text-sm ${showCustom ? 'text-emerald-200' : 'text-white/80'}`}>
              Otro monto personalizado
            </span>
          </div>
          <span className="text-[11px] text-white/40">${MIN_CUSTOM.toLocaleString('es-CL')} – ${MAX_CUSTOM.toLocaleString('es-CL')}</span>
        </button>
        {showCustom && (
          <div className="px-4 pb-4 pt-1">
            <div className="flex items-center bg-slate-900/40 border border-white/15 rounded-xl overflow-hidden focus-within:border-emerald-400/60">
              <span className="px-3 text-white/50 font-bold text-lg">$</span>
              <input
                type="text"
                inputMode="numeric"
                value={custom ? Number(custom).toLocaleString('es-CL') : ''}
                onChange={e => handleCustomChange(e.target.value)}
                placeholder="35.000"
                className="flex-1 bg-transparent border-0 outline-none py-3 text-white text-xl font-bold tracking-wide"
              />
              <span className="px-3 text-white/40 text-xs">CLP</span>
            </div>
            {custom && parseInt(custom) < MIN_CUSTOM && (
              <p className="text-[11px] text-amber-300 mt-2">Monto mínimo: ${MIN_CUSTOM.toLocaleString('es-CL')}</p>
            )}
            {custom && parseInt(custom) > MAX_CUSTOM && (
              <p className="text-[11px] text-amber-300 mt-2">Monto máximo: ${MAX_CUSTOM.toLocaleString('es-CL')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { MIN_CUSTOM, MAX_CUSTOM };
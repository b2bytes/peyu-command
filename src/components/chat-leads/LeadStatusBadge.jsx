// Badge interactivo de estado con dropdown para cambiar estado del lead
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const ESTADOS = ['Activo', 'Calificado', 'Convertido', 'Abandonado', 'Descartado'];

const ESTADO_STYLES = {
  'Activo':      { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  'Calificado':  { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' },
  'Convertido':  { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
  'Abandonado':  { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' },
  'Descartado':  { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
};

export default function LeadStatusBadge({ estado, onChange, readOnly = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const style = ESTADO_STYLES[estado] || ESTADO_STYLES['Activo'];

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  if (readOnly) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border" style={{ background: style.bg, color: style.color, borderColor: style.border }}>
        {estado}
      </span>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-opacity hover:opacity-80"
        style={{ background: style.bg, color: style.color, borderColor: style.border }}
      >
        {estado}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden min-w-[160px]">
          {ESTADOS.map(e => (
            <button
              key={e}
              onClick={() => { onChange(e); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: ESTADO_STYLES[e]?.color }} />
                {e}
              </span>
              {e === estado && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
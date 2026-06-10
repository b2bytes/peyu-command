import { useState } from 'react';
import { ChevronDown, FileText } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// DescripcionCollapsibleV2 — Descripción del producto en pestaña colapsable.
// Reduce el scroll en la ficha (mobile y desktop): el foco queda en color +
// personalización; quien quiere leer más, despliega.
// ════════════════════════════════════════════════════════════════════════
export default function DescripcionCollapsibleV2({ texto, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!texto) return null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ minHeight: 48 }}
      >
        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: '#C0785C' }} />
        <span className="flex-1 text-sm font-bold" style={{ color: '#2C1810' }}>Descripción</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#A08070' }}
        />
      </button>
      <div style={{ maxHeight: open ? 800 : 0, overflow: 'hidden', transition: 'max-height .3s ease' }}>
        <p className="px-4 pb-4 text-xs sm:text-sm leading-relaxed" style={{ color: '#7A6050' }}>{texto}</p>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CollapsibleSectionV2 — Sección colapsable del checkout Shop v2.
// Reduce el largo del formulario: el cliente abre solo la sección que completa.
// Muestra número de paso, título, un check verde si está "completa" y un
// resumen breve cuando está cerrada. Diseño Warm Dusk.
// ════════════════════════════════════════════════════════════════════════
export default function CollapsibleSectionV2({
  step, title, subtitle, complete = false, summary, defaultOpen = false, children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white rounded-2xl border border-[#EBE3D6] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-[#FAF7F2]/60 transition-colors"
      >
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          complete ? 'bg-[#0F8B6C] text-white' : 'bg-[#0F8B6C]/10 text-[#0F8B6C]'
        }`}>
          {complete ? <Check className="w-4 h-4" /> : step}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-fraunces text-lg leading-tight">{title}</h2>
          {!open && summary ? (
            <p className="text-xs text-[#0F8B6C] font-semibold truncate mt-0.5">{summary}</p>
          ) : subtitle ? (
            <p className="text-xs text-[#A78B6F] mt-0.5">{subtitle}</p>
          ) : null}
        </div>
        <ChevronDown className={`w-5 h-5 text-[#A78B6F] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>}
    </section>
  );
}
import { Check, Package, Building2, ClipboardList } from 'lucide-react';

// Barra de progreso del flujo de cotización B2B — diseño pill premium.
// Cada paso muestra icono, etiqueta y descripción (desktop). Clic para navegar
// a pasos ya alcanzables.
const PASOS = [
  { label: 'Productos', desc: 'Elige del catálogo', Icon: Package },
  { label: 'Tus datos', desc: 'Empresa y contacto', Icon: Building2 },
  { label: 'Revisar', desc: 'Confirma y envía', Icon: ClipboardList },
];

export default function QuoteStepper({ step, onStep, maxStep }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-[#EBE3D6] rounded-2xl sm:rounded-[28px] p-1.5 sm:p-2 flex items-center shadow-sm">
        {PASOS.map((paso, i) => {
          const done = i < step;
          const active = i === step;
          const reachable = i <= maxStep;
          const { Icon } = paso;
          return (
            <div key={paso.label} className="flex items-center flex-1 min-w-0">
              <button
                disabled={!reachable}
                onClick={() => reachable && onStep(i)}
                className={`flex items-center justify-center sm:justify-start gap-2.5 w-full rounded-xl sm:rounded-3xl px-2 sm:px-3.5 py-1.5 sm:py-2 transition-all disabled:cursor-not-allowed ${
                  active ? 'bg-[#0F8B6C]/8' : reachable ? 'hover:bg-[#F8F3ED]' : ''
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    done
                      ? 'bg-[#0F8B6C] text-white'
                      : active
                      ? 'bg-[#0F8B6C] text-white ring-4 ring-[#0F8B6C]/15'
                      : 'bg-[#F8F3ED] border border-[#EBE3D6] text-[#A78B6F]'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </span>
                <span className={`text-left min-w-0 ${active ? '' : 'hidden sm:block'}`}>
                  <span className={`block text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${active ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`}>
                    Paso {i + 1}
                  </span>
                  <span className={`block text-xs sm:text-sm font-bold leading-tight truncate ${done || active ? 'text-[#2A2420]' : 'text-[#A78B6F]'}`}>
                    {paso.label}
                  </span>
                  <span className="hidden lg:block text-[10px] text-[#A78B6F] leading-tight truncate">{paso.desc}</span>
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <div className="w-5 sm:w-8 lg:w-12 h-0.5 mx-1 rounded-full bg-[#EBE3D6] overflow-hidden flex-shrink-0">
                  <div className="h-full bg-[#0F8B6C] transition-all duration-500" style={{ width: done ? '100%' : '0%' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
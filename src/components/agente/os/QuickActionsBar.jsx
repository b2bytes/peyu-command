// ============================================================================
// PEYU OS · Barra de acciones rápidas sobre el chat
// Atajos de 1 clic para acelerar la respuesta al cliente: generar una
// cotización o crear una orden de producción sin escribir el prompt completo.
// Cada botón inyecta una instrucción al stream conversacional existente.
// ============================================================================
import { FileText, Factory, Zap } from 'lucide-react';

const ACCIONES = [
  {
    id: 'cotizacion',
    label: 'Generar cotización',
    icon: FileText,
    prompt: 'Quiero generar una cotización corporativa. Muéstrame las cotizaciones abiertas y guíame para crear una nueva.',
  },
  {
    id: 'produccion',
    label: 'Crear orden de producción',
    icon: Factory,
    prompt: 'Quiero crear una orden de producción. Muéstrame el estado actual de producción y ayúdame a agendar una nueva.',
  },
];

export default function QuickActionsBar({ onAction, disabled }) {
  return (
    <div className="flex-shrink-0 border-b border-[#ece4d8] bg-[#fbfaf7]/80 backdrop-blur-sm">
      <div className="max-w-[880px] mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#9aa6a0] flex-shrink-0 pr-1">
          <Zap className="w-3.5 h-3.5 text-[#0F8B6C]" />
          Acciones rápidas
        </span>
        {ACCIONES.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onAction?.(a.prompt)}
              disabled={disabled}
              className="flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full bg-white border border-[#e7d8c6] text-[#22302c] hover:border-[#0F8B6C]/50 hover:text-[#0F8B6C] transition-colors disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
            >
              <Icon className="w-3.5 h-3.5 text-[#0F8B6C]" />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
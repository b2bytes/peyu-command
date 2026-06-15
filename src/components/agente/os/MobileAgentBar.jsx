// ============================================================================
// PEYU OS · Barra inferior móvil (reemplaza el AgentRail en celular)
// ─────────────────────────────────────────────────────────────────────────────
// El AgentRail lateral está oculto en móvil (hidden md:flex), dejando los
// sub-agentes inaccesibles desde el celular. Esta barra fija abajo expone los
// 4 sub-agentes para activar/desactivar + Memoria/Ajustes, con safe-area iOS.
// Solo visible en móvil (md:hidden). No altera ninguna lógica del agente.
// ============================================================================
import { Brain, Settings } from 'lucide-react';
import { SUB_AGENTES } from './helpers';

export default function MobileAgentBar({ activos = [], onToggle, onOpenMemory }) {
  return (
    <nav className="md:hidden flex-shrink-0 border-t border-[#1f3a31] bg-[#0a1813]/95 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5">
        {SUB_AGENTES.map((a) => {
          const on = activos.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle?.(a.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px]"
              aria-pressed={on}
            >
              <span
                className={`relative w-9 h-9 rounded-2xl flex items-center justify-center text-base transition-all ${
                  on
                    ? 'bg-[#0F8B6C] text-white shadow-sm'
                    : 'bg-[#10231d] border border-[#2a4a40] grayscale-[0.4]'
                }`}
              >
                {a.emoji}
                {on && (
                  <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[#3dd9b0] ring-2 ring-[#0a1813]" />
                )}
              </span>
              <span className={`text-[10px] font-medium ${on ? 'text-[#3dd9b0]' : 'text-[#6f8f83]'}`}>
                {a.label}
              </span>
            </button>
          );
        })}

        <div className="w-px h-8 bg-[#2a4a40] mx-0.5" />

        <button onClick={onOpenMemory} title="Memoria" className="flex flex-col items-center gap-0.5 px-1.5 py-1">
          <span className="w-9 h-9 rounded-2xl bg-[#10231d] border border-[#2a4a40] flex items-center justify-center text-[#7fa295]">
            <Brain className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-medium text-[#6f8f83]">Memoria</span>
        </button>
        <button title="Ajustes" className="flex flex-col items-center gap-0.5 px-1.5 py-1">
          <span className="w-9 h-9 rounded-2xl bg-[#10231d] border border-[#2a4a40] flex items-center justify-center text-[#7fa295]">
            <Settings className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-medium text-[#6f8f83]">Ajustes</span>
        </button>
      </div>
    </nav>
  );
}
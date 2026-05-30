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

export default function MobileAgentBar({ activos = [], onToggle }) {
  return (
    <nav className="md:hidden flex-shrink-0 border-t border-[#ece4d8] bg-[#f6f1ea]/95 backdrop-blur-sm pb-safe">
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
                    : 'bg-white border border-[#ece4d8] grayscale-[0.4]'
                }`}
              >
                {a.emoji}
                {on && (
                  <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[#0F8B6C] ring-2 ring-[#f6f1ea]" />
                )}
              </span>
              <span className={`text-[10px] font-medium ${on ? 'text-[#0F8B6C]' : 'text-[#9aa6a0]'}`}>
                {a.label}
              </span>
            </button>
          );
        })}

        <div className="w-px h-8 bg-[#e7d8c6] mx-0.5" />

        <button title="Memoria" className="flex flex-col items-center gap-0.5 px-1.5 py-1">
          <span className="w-9 h-9 rounded-2xl bg-white border border-[#ece4d8] flex items-center justify-center text-[#6f7d77]">
            <Brain className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-medium text-[#9aa6a0]">Memoria</span>
        </button>
        <button title="Ajustes" className="flex flex-col items-center gap-0.5 px-1.5 py-1">
          <span className="w-9 h-9 rounded-2xl bg-white border border-[#ece4d8] flex items-center justify-center text-[#6f7d77]">
            <Settings className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-medium text-[#9aa6a0]">Ajustes</span>
        </button>
      </div>
    </nav>
  );
}
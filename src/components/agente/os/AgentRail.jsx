// ============================================================================
// PEYU OS · Riel izquierdo angosto (64px)
// Logo tortuga + 4 sub-agentes + Memoria/Ajustes abajo.
// Estética minimal cálida: papel arena, verde tierra para activos.
// ============================================================================
import { Brain, Settings } from 'lucide-react';
import { SUB_AGENTES } from './helpers';

export default function AgentRail({ activos = [], onToggle }) {
  return (
    <aside className="hidden md:flex w-16 flex-shrink-0 flex-col items-center py-4 border-r border-[#ece4d8] bg-[#f6f1ea]">
      {/* Logo tortuga */}
      <div className="w-10 h-10 rounded-2xl bg-white border border-[#e7d8c6] flex items-center justify-center text-lg shadow-sm">
        🐢
      </div>

      <div className="w-6 h-px bg-[#e7d8c6] my-4" />

      {/* Sub-agentes */}
      <nav className="flex flex-col gap-2.5 flex-1">
        {SUB_AGENTES.map((a) => {
          const on = activos.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle?.(a.id)}
              title={a.label}
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center text-lg transition-all ${
                on
                  ? 'bg-[#0F8B6C] text-white shadow-sm shadow-[#0F8B6C]/20'
                  : 'bg-white border border-[#ece4d8] hover:border-[#0F8B6C]/40 grayscale-[0.4] hover:grayscale-0'
              }`}
            >
              <span>{a.emoji}</span>
              {on && (
                <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-[#0F8B6C] ring-2 ring-[#f6f1ea]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Memoria + Ajustes */}
      <div className="flex flex-col gap-2.5 mt-3">
        <button title="Memoria" className="w-11 h-11 rounded-2xl bg-white border border-[#ece4d8] flex items-center justify-center text-[#6f7d77] hover:text-[#22302c] hover:border-[#0F8B6C]/40 transition-colors">
          <Brain className="w-4.5 h-4.5" />
        </button>
        <button title="Ajustes" className="w-11 h-11 rounded-2xl bg-white border border-[#ece4d8] flex items-center justify-center text-[#6f7d77] hover:text-[#22302c] hover:border-[#0F8B6C]/40 transition-colors">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
}
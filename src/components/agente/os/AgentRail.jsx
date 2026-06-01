// ============================================================================
// PEYU OS · Riel izquierdo angosto (64px) — Command Cockpit (sage oscuro)
// Logo tortuga + 4 sub-agentes + Memoria/Ajustes abajo.
// ============================================================================
import { Brain, Settings } from 'lucide-react';
import { SUB_AGENTES } from './helpers';

export default function AgentRail({ activos = [], onToggle, onOpenMemory }) {
  return (
    <aside className="hidden md:flex w-16 flex-shrink-0 flex-col items-center py-4 border-r border-[#1f3a31] bg-[#0c1c17]">
      {/* Logo tortuga */}
      <div className="w-10 h-10 rounded-2xl bg-[#10231d] border border-[#2a4a40] flex items-center justify-center text-lg shadow-sm">
        🐢
      </div>

      <div className="w-6 h-px bg-[#1f3a31] my-4" />

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
                  ? 'bg-[#0F8B6C] text-white shadow-sm shadow-[#0F8B6C]/30'
                  : 'bg-[#10231d] border border-[#2a4a40] hover:border-[#0F8B6C]/50 grayscale-[0.4] hover:grayscale-0'
              }`}
            >
              <span>{a.emoji}</span>
              {on && (
                <span className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 rounded-full bg-[#3dd9b0] ring-2 ring-[#0c1c17]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Memoria + Ajustes */}
      <div className="flex flex-col gap-2.5 mt-3">
        <button onClick={onOpenMemory} title="Memoria" className="w-11 h-11 rounded-2xl bg-[#10231d] border border-[#2a4a40] flex items-center justify-center text-[#9fc7b8] hover:text-[#3dd9b0] hover:border-[#0F8B6C]/50 transition-colors">
          <Brain className="w-4.5 h-4.5" />
        </button>
        <button title="Ajustes" className="w-11 h-11 rounded-2xl bg-[#10231d] border border-[#2a4a40] flex items-center justify-center text-[#9fc7b8] hover:text-white hover:border-[#0F8B6C]/50 transition-colors">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </aside>
  );
}
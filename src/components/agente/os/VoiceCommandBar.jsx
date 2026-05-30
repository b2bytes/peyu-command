// ============================================================================
// PEYU OS · Comandos rápidos por voz
// ─────────────────────────────────────────────────────────────────────────────
// Fila de atajos para los comandos más frecuentes del equipo. Cada botón le
// "dicta" al agente una instrucción lista (resumir última consulta, guardar
// lead, revisar pendientes…) usando el mismo flujo sendMessage. El agente
// responde y, si está en modo voz, lo lee en voz alta.
// ============================================================================
import { Mic, MessageSquareText, UserPlus, AlertCircle, ClipboardList, TrendingUp } from 'lucide-react';

const COMANDOS = [
  { icon: MessageSquareText, label: 'Resumir última consulta', prompt: 'Resume la última consulta que entró y dime qué responder.' },
  { icon: UserPlus, label: 'Guardar lead rápido', prompt: 'Quiero guardar un lead nuevo. Pídeme los datos uno por uno (empresa, contacto, teléfono, producto y cantidad) y créalo.' },
  { icon: AlertCircle, label: 'Qué necesita atención', prompt: '¿Qué necesita mi atención ahora mismo? Prioriza lo urgente.' },
  { icon: ClipboardList, label: 'Pendientes de hoy', prompt: '¿Qué tengo pendiente hoy? Consultas sin responder, propuestas por vencer y envíos con problema.' },
  { icon: TrendingUp, label: 'Cómo vamos esta semana', prompt: '¿Cómo vamos esta semana en ventas y leads comparado con lo habitual?' },
];

export default function VoiceCommandBar({ onCommand }) {
  return (
    <div className="w-full max-w-lg mx-auto mt-5">
      <div className="flex items-center gap-1.5 mb-2.5 justify-center">
        <Mic className="w-3.5 h-3.5 text-[#0F8B6C]" />
        <span className="text-[11px] font-semibold text-[#9aa6a0] uppercase tracking-wide">Comandos rápidos</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {COMANDOS.map((c) => (
          <button
            key={c.label}
            onClick={() => onCommand(c.prompt)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#22302c] bg-white border border-[#e7d8c6] hover:border-[#0F8B6C]/50 hover:bg-[#e9f3ef] px-3 py-1.5 rounded-full transition"
          >
            <c.icon className="w-4 h-4 text-[#0F8B6C]" />
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
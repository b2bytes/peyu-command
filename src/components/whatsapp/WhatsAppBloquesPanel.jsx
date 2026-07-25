import { GraduationCap, CheckCircle2 } from 'lucide-react';
import { PEYU_BLOQUES } from '@/lib/peyu-agent-blocks';

// ════════════════════════════════════════════════════════════════════════
// WhatsAppBloquesPanel — Librería de bloques de entrenamiento del agente
// Peyu (solo lectura). Muestra los 13 bloques con los que está entrenado,
// para que el equipo sepa exactamente cómo se comporta en WhatsApp.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppBloquesPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-none">Entrenamiento de Peyu 🐢</p>
          <p className="text-[10px] text-white/40 mt-0.5">{PEYU_BLOQUES.length} bloques activos · agente principal de WhatsApp</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(37,211,102,.14)', color: '#25D366' }}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Respuestas cortas activas
        </span>
      </div>

      {/* Grilla de bloques */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PEYU_BLOQUES.map((b) => (
            <article
              key={b.n}
              className="rounded-2xl p-3.5 flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: b.color }}>
                  {b.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">{b.titulo}</p>
                  <p className="text-[10px] font-mono truncate" style={{ color: b.color }}>{b.tipo}</p>
                </div>
              </div>
              <p className="text-xs text-white/65 leading-relaxed">{b.resumen}</p>
              <ul className="space-y-1 mt-0.5">
                {b.puntos.map((p, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] text-white/45 leading-snug">
                    <span className="flex-shrink-0" style={{ color: b.color }}>·</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="text-[10px] text-white/30 text-center mt-4 px-4 leading-relaxed">
          Esta es la vista del entrenamiento vigente del agente. Para cambiar una regla, pídelo en el chat de construcción y se actualiza en el agente real.
        </p>
      </div>
    </div>
  );
}
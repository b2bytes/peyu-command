// ============================================================================
// ResponseStrategy · Estrategia sugerida para responder al contrato
// ============================================================================
import { Target, ArrowRight, Lightbulb } from 'lucide-react';

export default function ResponseStrategy({ estrategia }) {
  if (!estrategia) return null;

  return (
    <div className="space-y-5">
      {/* Postura general */}
      <div className="bg-gradient-to-br from-teal-500/15 to-cyan-500/5 border border-teal-400/25 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-teal-300 mb-1 font-jakarta">Postura recomendada</p>
            <p className="text-sm text-white/90 leading-relaxed font-inter">{estrategia.postura_general}</p>
          </div>
        </div>
      </div>

      {/* Pasos */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-white/50 mb-3 font-jakarta">Pasos concretos</h3>
        <div className="space-y-2">
          {estrategia.pasos_concretos.map(p => (
            <div key={p.paso} className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-400/25 flex items-center justify-center flex-shrink-0 text-[12px] font-jakarta font-extrabold text-teal-300">
                {p.paso}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white font-medium leading-snug mb-1 font-inter">{p.accion}</p>
                <div className="flex items-center gap-3 text-[10px] text-white/40">
                  <span><strong className="text-white/60">Responsable:</strong> {p.responsable}</span>
                  <span>·</span>
                  <span><strong className="text-white/60">Plazo:</strong> {p.plazo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Argumentos de negociación */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-white/50 mb-3 font-jakarta">Argumentos de negociación</h3>
        <div className="space-y-2">
          {estrategia.argumentos_negociacion.map((a, i) => (
            <div key={i} className="bg-amber-500/8 border border-amber-400/15 rounded-xl p-3 flex gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-100/90 leading-relaxed font-inter">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
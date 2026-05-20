// ============================================================================
// EvidenceList · Hechos probados con fuente y datos reales del backend
// ============================================================================
import { CheckCircle2, FileText, Database, Layers, Code2 } from 'lucide-react';

export default function EvidenceList({ hechos, data }) {
  const m = data?.metricas_plataforma || {};
  const f = data?.funciones_backend || {};
  const c = data?.cumplimiento_impulsia || {};

  // Para el hecho F3 (PEYU construyó por su cuenta) inyectamos métricas vivas
  const livePoints = {
    F3: [
      { label: 'Funciones backend desplegadas', value: `${f.total || 0}` },
      { label: 'Agentes IA en producción', value: `${c.agentes_desplegados_por_peyu || 0}` },
      { label: 'Pedidos B2C procesados', value: `${m.pedidos_total || 0}` },
      { label: 'Conversaciones IA registradas', value: `${m.conversaciones_chat || 0}` },
      { label: 'Productos sincronizados', value: `${m.productos_activos || 0}` },
      { label: 'Clientes en base de datos', value: `${m.clientes_total || 0}` },
    ],
  };

  return (
    <div className="space-y-3">
      {hechos.map(h => (
        <div key={h.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 font-jakarta">Hecho {h.id} · {h.estado}</span>
              </div>
              <p className="text-[13px] text-white font-jakarta font-bold leading-snug">{h.hecho}</p>
            </div>
          </div>

          <div className="flex items-start gap-2 pl-11">
            <FileText className="w-3 h-3 text-white/30 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-white/55 leading-relaxed font-inter">
              <span className="font-bold text-white/70">Fuente: </span>{h.fuente_evidencia}
            </p>
          </div>

          {livePoints[h.id] && (
            <div className="mt-3 ml-11 grid grid-cols-2 md:grid-cols-3 gap-2">
              {livePoints[h.id].map((p, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/8 rounded-lg p-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/40 mb-0.5 font-jakarta font-bold">{p.label}</p>
                  <p className="text-base font-jakarta font-extrabold text-teal-200 tracking-tight">{p.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
import { Sparkles, AlertTriangle, TrendingUp, Award } from 'lucide-react';

const PRIORIDAD_STYLES = {
  Alta: 'bg-red-50 border-red-200 text-red-700',
  Media: 'bg-amber-50 border-amber-200 text-amber-700',
  Baja: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

/**
 * Panel del agente Logística IA: muestra resumen, patrones y sugerencias.
 */
export default function BluexAnalysisPanel({ analysis }) {
  if (!analysis) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
        <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">Sin análisis aún</p>
        <p className="text-xs text-muted-foreground mt-1">Click en "Analizar con IA" para que el agente revise tu operación logística.</p>
      </div>
    );
  }

  const ai = analysis.analisis_ia || {};
  const stats = analysis.stats || {};

  return (
    <div className="space-y-4">
      {/* Resumen ejecutivo */}
      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-cyan-700">Agente Logística IA</p>
              <p className="font-poppins font-bold text-sm text-foreground">Análisis · últimos {analysis.periodo_dias} días</p>
            </div>
          </div>
          {ai.score_logistico !== undefined && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Score</p>
              <p className={`font-poppins font-extrabold text-3xl ${ai.score_logistico >= 80 ? 'text-emerald-600' : ai.score_logistico >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {ai.score_logistico}
              </p>
            </div>
          )}
        </div>
        {ai.resumen_ejecutivo && (
          <p className="text-sm text-foreground leading-relaxed">{ai.resumen_ejecutivo}</p>
        )}

        {/* Stats inline */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-cyan-200/60">
          <Stat label="Total" val={stats.total} />
          <Stat label="OTIF" val={`${(stats.otif_pct || 0).toFixed(0)}%`} accent="emerald" />
          <Stat label="Excepciones" val={stats.con_excepcion} accent={stats.con_excepcion > 0 ? 'red' : 'slate'} />
          <Stat label="Lead time" val={`${(stats.lead_time_prom || 0).toFixed(1)}d`} />
        </div>
      </div>

      {/* Patrones */}
      {ai.patrones?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-poppins font-bold text-foreground flex items-center gap-2 mb-3 text-sm">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            Patrones detectados
          </h3>
          <ul className="space-y-2">
            {ai.patrones.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-cyan-500 mt-0.5">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sugerencias */}
      {ai.sugerencias?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-poppins font-bold text-foreground flex items-center gap-2 mb-3 text-sm">
            <Award className="w-4 h-4 text-emerald-600" />
            Acciones recomendadas
          </h3>
          <div className="space-y-2.5">
            {ai.sugerencias.map((s, i) => (
              <div key={i} className={`border rounded-xl p-3 ${PRIORIDAD_STYLES[s.prioridad] || PRIORIDAD_STYLES.Media}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-bold text-sm">{s.titulo}</p>
                  <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-white/60">
                    {s.prioridad}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{s.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comunas problemáticas */}
      {analysis.comunas_top_problemas?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-poppins font-bold text-foreground flex items-center gap-2 mb-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Comunas con más incidencias
          </h3>
          <div className="space-y-1.5 text-xs">
            {analysis.comunas_top_problemas.slice(0, 8).map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums w-5">{i + 1}.</span>
                  <span className="font-medium text-foreground">{c.comuna}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-muted-foreground">{c.total} envíos</span>
                  {c.excepciones > 0 && <span className="text-red-600 font-bold">{c.excepciones} excep.</span>}
                  {c.atrasados > 0 && <span className="text-amber-600 font-bold">{c.atrasados} atras.</span>}
                  <span className={`font-bold tabular-nums ${c.problema_pct > 30 ? 'text-red-600' : c.problema_pct > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {c.problema_pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, val, accent = 'slate' }) {
  const colors = {
    slate: 'text-foreground',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  };
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      <p className={`font-poppins font-extrabold text-lg tabular-nums ${colors[accent]}`}>{val ?? '—'}</p>
    </div>
  );
}
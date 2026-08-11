import { AlertTriangle } from 'lucide-react';

// Una fila del embudo: etapa, cuántos clientes hay, qué % del total y cuántos
// se quedaron ahí sin avanzar (estancados = sin actividad hace +3 días).
export default function FunnelStageRow({ stage, total, cuello }) {
  const pct = total ? Math.round((stage.count / total) * 100) : 0;
  const pctEstancados = stage.count ? Math.round((stage.estancados / stage.count) * 100) : 0;

  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--ld-bg-elevated)', border: `1px solid ${cuello ? 'rgba(239,68,68,.45)' : 'var(--ld-border)'}` }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
        <p className="text-[12px] font-bold text-ld-fg">{stage.label}</p>
        {cuello && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(239,68,68,.15)', color: '#EF4444' }}>
            <AlertTriangle className="w-2.5 h-2.5" /> Aquí se traban
          </span>
        )}
        <span className="ml-auto text-[11px] font-bold text-ld-fg">{stage.count}</span>
        <span className="text-[10px] text-ld-fg-muted w-10 text-right">{pct}%</span>
      </div>

      <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ld-bg-soft)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: stage.color }} />
      </div>

      <p className="text-[10px] text-ld-fg-muted mt-1.5">
        {stage.estancados} sin avanzar hace +3 días ({pctEstancados}%)
        {stage.diasProm ? ` · ${stage.diasProm} días promedio sin respuesta` : ''}
      </p>
    </div>
  );
}
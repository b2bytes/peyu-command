import { CheckCircle2, Circle, Clock, AlertTriangle, Eye } from 'lucide-react';

const ESTADO_STYLE = {
  'Completada':   { color: '#0F8B6C', bg: 'rgba(15,139,108,.10)', Icon: CheckCircle2 },
  'En curso':     { color: '#1D4ED8', bg: 'rgba(29,78,216,.08)',  Icon: Clock },
  'En revisión':  { color: '#B45309', bg: 'rgba(180,83,9,.10)',   Icon: Eye },
  'Bloqueada':    { color: '#B91C1C', bg: 'rgba(185,28,28,.08)',  Icon: AlertTriangle },
  'Pendiente':    { color: '#6B7280', bg: 'rgba(107,114,128,.10)', Icon: Circle },
};

const LADO_LABEL = { agencia: 'B2bytes', peyu: 'PEYU', ambos: 'Ambos' };
const LADO_COLOR = { agencia: '#7C3AED', peyu: '#0F8B6C', ambos: '#B45309' };

// Fila del Gantt moderno: info de la tarea a la izquierda + barra temporal a la
// derecha, posicionada proporcionalmente dentro del rango del plan.
export default function TareaGanttRow({ tarea, rangeStart, rangeEnd, onClick }) {
  const est = ESTADO_STYLE[tarea.estado] || ESTADO_STYLE['Pendiente'];
  const { Icon } = est;

  // Posición de la barra en % del rango total del plan.
  const total = Math.max(1, rangeEnd - rangeStart);
  const t0 = tarea.fecha_inicio ? new Date(tarea.fecha_inicio).getTime() : rangeStart;
  const t1 = tarea.fecha_objetivo ? new Date(tarea.fecha_objetivo).getTime() : t0 + 86400000;
  const left = Math.max(0, Math.min(96, ((t0 - rangeStart) / total) * 100));
  const width = Math.max(4, Math.min(100 - left, ((t1 - t0) / total) * 100));

  return (
    <button
      onClick={onClick}
      className="w-full text-left grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-2 lg:gap-4 items-center px-4 py-3 rounded-2xl transition-colors hover:bg-white"
      style={{ border: '1px solid var(--ld-border)' }}
    >
      {/* Info */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: est.color }} />
          <p className="text-sm font-bold truncate" style={{ color: 'var(--ld-fg)' }}>{tarea.titulo}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.color }}>
            {tarea.estado}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${LADO_COLOR[tarea.lado_responsable] || '#6B7280'}14`, color: LADO_COLOR[tarea.lado_responsable] || '#6B7280' }}>
            {LADO_LABEL[tarea.lado_responsable] || tarea.lado_responsable}
          </span>
          {tarea.prioridad === 'Alta' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(185,28,28,.08)', color: '#B91C1C' }}>
              Alta
            </span>
          )}
        </div>
      </div>

      {/* Barra Gantt */}
      <div className="w-full">
        <div className="relative h-7 rounded-lg" style={{ background: 'var(--ld-bg-soft)' }}>
          <div
            className="absolute top-1 bottom-1 rounded-md overflow-hidden"
            style={{ left: `${left}%`, width: `${width}%`, background: `${est.color}22`, border: `1px solid ${est.color}55` }}
          >
            <div className="h-full rounded-md" style={{ width: `${tarea.avance_pct || 0}%`, background: est.color, opacity: 0.85 }} />
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--ld-fg-muted)' }}>
            {tarea.fecha_inicio || '—'} → {tarea.fecha_objetivo || '—'}
          </span>
          <span className="text-[10px] font-bold" style={{ color: est.color }}>{tarea.avance_pct || 0}%</span>
        </div>
      </div>
    </button>
  );
}
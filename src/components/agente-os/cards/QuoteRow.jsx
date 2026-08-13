import { Clock } from 'lucide-react';
import { fmtRelativo } from '@/lib/fecha-relativa';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Estado con semántica de negocio: verde = plata en camino, terracota = riesgo.
const STATUS_STYLE = {
  'Aceptada':  'bg-ld-action-soft text-ld-action',
  'Enviada':   'bg-ld-action-soft text-ld-action',
  'Borrador':  'bg-ld-bg-soft text-ld-fg-muted',
  'Rechazada': 'bg-ld-highlight-soft text-ld-highlight',
  'Vencida':   'bg-ld-highlight-soft text-ld-highlight',
};

// Fila de cotización: densa y alineada como tabla, para comparar montos de un
// barrido vertical en vez de leer párrafos.
export default function QuoteRow({ cotizacion: c }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 bg-ld-bg-soft/50 border border-ld-border">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-ld-fg truncate leading-tight">{c.empresa || 'Sin empresa'}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-ld-fg-muted">
          {c.numero && <span className="font-mono">{c.numero}</span>}
          {c.contacto && <span className="truncate">· {c.contacto}</span>}
          {(c.created_date || c.fecha_envio) && (
            <span className="flex items-center gap-0.5 flex-shrink-0">
              <Clock className="w-2.5 h-2.5" /> {fmtRelativo(c.created_date || c.fecha_envio)}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-bold text-ld-fg tabular-nums leading-tight">{fmtCLP(c.total)}</p>
        <span className={`inline-block mt-0.5 text-[9.5px] px-1.5 py-0.5 rounded-md font-bold ${STATUS_STYLE[c.status] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
          {c.status}
        </span>
      </div>
    </div>
  );
}
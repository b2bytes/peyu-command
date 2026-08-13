import { Clock, Tag, Truck } from 'lucide-react';
import ActionButton from '../ActionButton';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

const ESTADO_STYLE = {
  'Nuevo': 'bg-ld-highlight-soft text-ld-highlight',
  'Confirmado': 'bg-ld-action-soft text-ld-action',
  'En Producción': 'bg-ld-action-soft text-ld-action',
  'Listo para Despacho': 'bg-ld-action-soft text-ld-action',
  'Despachado': 'bg-ld-action-soft text-ld-action',
  'Entregado': 'bg-ld-bg-soft text-ld-fg-muted',
};

// Fila de pedido con UNA acción clara. La acción se decide fuera (la card sabe
// el contexto operativo), así la fila solo se preocupa de leerse bien.
export default function OrderRow({ pedido: p, accion, onDone }) {
  const fecha = p.created_date || p.fecha;

  return (
    <div className="rounded-xl px-3 py-2 bg-ld-bg-soft/50 border border-ld-border">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-ld-fg truncate leading-tight">
            {p.cliente_nombre || 'Cliente'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-ld-fg-muted">
            <span className="font-mono">{p.numero_pedido || p.id?.slice(-6)}</span>
            {p.medio_pago && <span className="truncate">· {p.medio_pago}</span>}
            {fecha && (
              <span className="flex items-center gap-0.5 flex-shrink-0" title={fmtFechaHora(fecha) || ''}>
                <Clock className="w-2.5 h-2.5" /> {fmtRelativo(fecha)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[13px] font-bold text-ld-fg tabular-nums leading-tight">{fmtCLP(p.total)}</p>
          <span className={`inline-block mt-0.5 text-[9.5px] px-1.5 py-0.5 rounded-md font-bold ${ESTADO_STYLE[p.estado] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
            {p.estado}
          </span>
        </div>
      </div>

      {accion && (
        <div className="mt-2">
          <ActionButton
            action={accion.action}
            payload={accion.payload}
            label={accion.label}
            icon={accion.icon === 'tag' ? Tag : Truck}
            variant={accion.variant}
            onDone={onDone}
          />
        </div>
      )}
    </div>
  );
}
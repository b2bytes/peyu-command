import { useState } from 'react';
import { Clock, Tag, Truck, ChevronDown, MapPin, Package } from 'lucide-react';
import ActionButton from '../ActionButton';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Punto de color = estado, sin ocupar ancho con un chip largo.
const ESTADO_DOT = {
  'Nuevo': 'var(--ld-highlight)',
  'Confirmado': 'var(--ld-action)',
  'En Producción': 'var(--ld-action)',
  'Listo para Despacho': 'var(--ld-action)',
  'Despachado': 'var(--ld-action)',
  'Entregado': 'var(--ld-fg-subtle)',
};

// Fila de pedido de UNA línea: lo esencial visible, el detalle al desplegar y
// UNA acción clara al costado. Así 10 pedidos caben sin volverse una lista larga.
export default function OrderRow({ pedido: p, accion, onDone }) {
  const [abierto, setAbierto] = useState(false);
  const fecha = p.created_date || p.fecha;

  return (
    <div className="rounded-xl border" style={{ borderColor: 'var(--ld-border)', background: 'var(--ld-bg-soft)' }}>
      <div className="flex items-center gap-2 px-2.5 py-2">
        <button onClick={() => setAbierto((v) => !v)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: ESTADO_DOT[p.estado] || 'var(--ld-fg-subtle)' }} title={p.estado} />
          <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--ld-fg)' }}>
            {p.cliente_nombre || 'Cliente'}
          </span>
          <span className="text-[10px] hidden sm:flex items-center gap-0.5 flex-shrink-0"
            style={{ color: 'var(--ld-fg-muted)' }} title={fmtFechaHora(fecha) || ''}>
            <Clock className="w-2.5 h-2.5" /> {fmtRelativo(fecha)}
          </span>
          <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
            style={{ color: 'var(--ld-fg-subtle)' }} />
        </button>

        <span className="text-[12.5px] font-bold tabular-nums flex-shrink-0" style={{ color: 'var(--ld-fg)' }}>
          {fmtCLP(p.total)}
        </span>

        {accion && (
          <div className="flex-shrink-0">
            <ActionButton
              action={accion.action}
              payload={accion.payload}
              label={accion.short || accion.label}
              icon={accion.icon === 'tag' ? Tag : Truck}
              variant={accion.variant}
              onDone={onDone}
            />
          </div>
        )}
      </div>

      {abierto && (
        <div className="px-3 pb-2.5 pt-0.5 space-y-1 border-t" style={{ borderColor: 'var(--ld-border)' }}>
          <p className="text-[10.5px] font-mono pt-1.5" style={{ color: 'var(--ld-fg-muted)' }}>
            {p.numero_pedido || p.id?.slice(-6)} · {p.estado}{p.medio_pago ? ` · ${p.medio_pago}` : ''}
          </p>
          {(p.ciudad || p.direccion_envio) && (
            <p className="text-[10.5px] flex items-start gap-1" style={{ color: 'var(--ld-fg-muted)' }}>
              <MapPin className="w-3 h-3 flex-shrink-0 mt-px" />
              <span className="truncate">{[p.direccion_envio, p.ciudad].filter(Boolean).join(', ')}</span>
            </p>
          )}
          {p.descripcion_items && (
            <p className="text-[10.5px] flex items-start gap-1" style={{ color: 'var(--ld-fg-muted)' }}>
              <Package className="w-3 h-3 flex-shrink-0 mt-px" />
              <span className="line-clamp-2">{p.descripcion_items}</span>
            </p>
          )}
          {p.tracking && (
            <a href={`https://www.bluex.cl/seguimiento?n=${p.tracking}`} target="_blank" rel="noreferrer"
              className="text-[10.5px] font-bold" style={{ color: 'var(--ld-action)' }}>
              OT {p.tracking} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
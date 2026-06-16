import { Package, Truck, Tag, Clock } from 'lucide-react';
import ActionButton from '../ActionButton';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// ¿Pagado? (payment_status paid o estado post-pago).
const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
const estaPagado = (p) => p.payment_status === 'paid' || ESTADOS_PAGADOS.includes(p.estado);

const ESTADO_STYLE = {
  'Nuevo': 'bg-ld-highlight-soft text-ld-highlight',
  'Confirmado': 'bg-ld-action-soft text-ld-action',
  'En Producción': 'bg-ld-action-soft text-ld-action',
  'Listo para Despacho': 'bg-ld-action-soft text-ld-action',
  'Despachado': 'bg-ld-action-soft text-ld-action',
};

// Siguiente estado lógico en el flujo operativo del pedido.
const NEXT = {
  'Nuevo': 'Confirmado',
  'Confirmado': 'En Producción',
  'En Producción': 'Listo para Despacho',
  'Listo para Despacho': 'Despachado',
  'Despachado': 'Entregado',
};

// Pedidos pendientes con acción: avanzar al siguiente estado del flujo.
// Acepta `pedidos` (CRM completo) o `lista` (datos ya filtrados de brain).
export default function OrdersCard({ pedidos = [], lista, onDone }) {
  const pendientes = lista
    ? lista
    : pedidos.filter((p) => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado)).slice(0, 6);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Package className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Pedidos pendientes</span>
        </div>
        <span className="text-[11px] text-ld-fg-subtle">{pendientes.length}</span>
      </div>
      {pendientes.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">No hay pedidos pendientes 🎉</p>
      ) : (
        <div className="space-y-2.5">
          {pendientes.map((p) => (
            <div key={p.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ld-fg truncate">{p.cliente_nombre || 'Cliente'}</div>
                  <div className="text-[11px] text-ld-fg-muted truncate">{p.numero_pedido || p.id?.slice(-6)} · {p.medio_pago || ''}</div>
                  {(p.created_date || p.fecha) && (
                    <div className="text-[10px] text-ld-fg-subtle mt-0.5 flex items-center gap-1" title={fmtFechaHora(p.created_date || p.fecha) || ''}>
                      <Clock className="w-2.5 h-2.5" /> {fmtRelativo(p.created_date || p.fecha)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-semibold text-ld-fg">{fmtCLP(p.total)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[p.estado] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
                    {p.estado}
                  </span>
                </div>
              </div>
              {/* En "Listo para Despacho" sin OT → la acción real es generar la
                  etiqueta BlueExpress, no solo cambiar el estado. */}
              {p.estado === 'Listo para Despacho' && !p.tracking ? (
                <div className="mt-2.5">
                  <ActionButton
                    action="generarEtiqueta"
                    payload={{ id: p.id }}
                    label="Generar etiqueta BlueExpress"
                    icon={Tag}
                    variant="primary"
                    onDone={onDone}
                  />
                </div>
              ) : !estaPagado(p) ? (
                <div className="mt-2.5">
                  <ActionButton
                    action="marcarPedidoPagado"
                    payload={{ id: p.id }}
                    label="Marcar pagado"
                    icon={Truck}
                    onDone={onDone}
                  />
                </div>
              ) : NEXT[p.estado] && (
                <div className="mt-2.5">
                  <ActionButton
                    action="updatePedidoEstado"
                    payload={{ id: p.id, estado: NEXT[p.estado] }}
                    label={`→ ${NEXT[p.estado]}`}
                    icon={Truck}
                    onDone={onDone}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
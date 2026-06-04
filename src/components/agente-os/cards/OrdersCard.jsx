import { Package, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

const ESTADO_STYLE = {
  'Nuevo': 'bg-ld-highlight-soft text-ld-highlight',
  'Confirmado': 'bg-ld-action-soft text-ld-action',
  'En Producción': 'bg-ld-action-soft text-ld-action',
  'Listo para Despacho': 'bg-ld-action-soft text-ld-action',
  'Despachado': 'bg-ld-action-soft text-ld-action',
};

// Lista de pedidos pendientes (no entregados / cancelados).
export default function OrdersCard({ pedidos = [] }) {
  const pendientes = pedidos
    .filter((p) => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado))
    .slice(0, 6);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Package className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Pedidos pendientes</span>
        </div>
        <Link to="/admin/procesar-pedidos" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {pendientes.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">No hay pedidos pendientes 🎉</p>
      ) : (
        <div className="space-y-2">
          {pendientes.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{p.cliente_nombre || 'Cliente'}</div>
                <div className="text-[11px] text-ld-fg-muted truncate">{p.numero_pedido || p.id?.slice(-6)} · {p.medio_pago || ''}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-ld-fg">{fmtCLP(p.total)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[p.estado] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
                  {p.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
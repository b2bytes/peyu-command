import { Link } from 'react-router-dom';
import { Package, Truck, CreditCard, ChevronRight, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// PedidoCard — Tarjeta resumida de una compra del cliente en su perfil.
// Muestra número, estado, fecha, total y un acceso al seguimiento detallado.
// ════════════════════════════════════════════════════════════════════════
const ESTADO_STYLE = (estado) =>
  estado === 'Entregado'
    ? { background: 'var(--ld-action-soft)', color: 'var(--ld-action)', border: '1px solid var(--ld-action)' }
    : ['Despachado', 'Listo para Despacho'].includes(estado)
      ? { background: 'var(--ld-highlight-soft)', color: 'var(--ld-highlight)', border: '1px solid var(--ld-highlight)' }
      : { background: 'var(--ld-bg-soft)', color: 'var(--ld-fg-muted)', border: '1px solid var(--ld-border)' };

export default function PedidoCard({ pedido }) {
  return (
    <Link
      to={`/seguimiento?pedido=${encodeURIComponent(pedido.numero_pedido)}`}
      className="ld-card p-5 block hover:-translate-y-0.5 transition-transform"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-mono text-xs text-ld-fg-muted">{pedido.numero_pedido}</p>
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide" style={ESTADO_STYLE(pedido.estado)}>
              {pedido.estado}
            </span>
          </div>
          <p className="text-sm text-ld-fg-muted">{pedido.fecha}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="ld-display text-2xl text-ld-fg">${(pedido.total || 0).toLocaleString('es-CL')}</p>
          <p className="text-[11px] text-ld-fg-muted flex items-center gap-1 justify-end">
            <CreditCard className="w-3 h-3" /> {pedido.medio_pago}
          </p>
        </div>
      </div>

      {pedido.descripcion_items && (
        <p className="text-sm text-ld-fg-soft line-clamp-2 mb-3">{pedido.descripcion_items}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-ld-border">
        <div className="flex items-center gap-3 text-xs text-ld-fg-muted">
          {pedido.requiere_personalizacion && (
            <span className="flex items-center gap-1" style={{ color: 'var(--ld-highlight)' }}>
              <Sparkles className="w-3 h-3" /> Personalizado
            </span>
          )}
          {pedido.tracking && (
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" /> {pedido.tracking}
            </span>
          )}
          {!pedido.tracking && !pedido.requiere_personalizacion && (
            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {pedido.canal}</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: 'var(--ld-action)' }}>
          Ver seguimiento <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
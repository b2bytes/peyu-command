import { getPagoStatus } from '@/lib/pago-status';
import { Loader2, BadgeCheck, Tag, Printer, Clock, CheckCircle2, Eye } from 'lucide-react';
import { fmtRelativo, fmtFechaHora } from '@/lib/fecha-relativa';

const ESTADOS = ['Nuevo', 'Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado', 'Cancelado', 'Reembolsado'];
const TONE = {
  green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  gray: 'bg-slate-100 text-slate-600 border-slate-200',
};

const fmt = (n) => '$' + (n || 0).toLocaleString('es-CL');

/**
 * OpsPedidoRow — Fila de pedido en el Centro de Operaciones del Agent OS.
 * Acciones 1-clic: marcar pagado · generar etiqueta Bluex · cambiar estado.
 */
export default function OpsPedidoRow({ pedido, busy, onAction, onOpenLabel, onOpenDetail }) {
  const pago = getPagoStatus(pedido);
  const esRetiro = pedido.courier === 'Retiro en Tienda';
  const puedeEtiqueta = pago.pagado && !pedido.tracking && !esRetiro;

  return (
    <div className="ld-card rounded-xl p-3 sm:p-3.5 cursor-pointer hover:border-ld-border-strong transition-colors" onClick={() => onOpenDetail?.(pedido)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-ld-fg">{pedido.numero_pedido || pedido.id?.slice(-6)}</span>
            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${TONE[pago.tone] || TONE.gray}`}>{pago.label}</span>
            {pedido.tracking && (
              <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-bold">OT {pedido.tracking}</span>
            )}
          </div>
          <p className="text-xs text-ld-fg-muted mt-0.5 truncate">
            {pedido.cliente_nombre} · {fmt(pedido.total)} · {pedido.ciudad || (esRetiro ? 'Retiro en tienda' : '—')}
          </p>
          {/* Fechas precisas: cuándo se generó y, si aplica, cuándo se pagó */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-ld-fg-subtle mt-0.5">
            {(pedido.created_date || pedido.fecha) && (
              <span className="inline-flex items-center gap-1" title={fmtFechaHora(pedido.created_date || pedido.fecha) || ''}>
                <Clock className="w-2.5 h-2.5" /> Generado {fmtRelativo(pedido.created_date || pedido.fecha)}
              </span>
            )}
            {pedido.comprobante_enviado_at && (
              <span className="inline-flex items-center gap-1 text-emerald-600" title={fmtFechaHora(pedido.comprobante_enviado_at) || ''}>
                <CheckCircle2 className="w-2.5 h-2.5" /> Pagado {fmtRelativo(pedido.comprobante_enviado_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={pedido.estado || 'Nuevo'}
            disabled={busy}
            onChange={(e) => onAction('updatePedidoEstado', { id: pedido.id, estado: e.target.value })}
            className="ld-input !rounded-lg text-xs px-2 py-1.5 font-semibold"
          >
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>

          {!pago.pagado && pedido.estado !== 'Cancelado' && pedido.estado !== 'Reembolsado' && (
            <button
              disabled={busy}
              onClick={() => onAction('marcarPedidoPagado', { id: pedido.id })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />} Marcar pagado
            </button>
          )}

          {puedeEtiqueta && (
            <button
              disabled={busy}
              onClick={() => onAction('generarEtiqueta', { id: pedido.id })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg ld-btn-primary text-xs font-bold disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />} Etiqueta
            </button>
          )}

          {pedido.tracking && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenLabel(pedido); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg ld-btn-ghost text-xs font-bold"
            >
              <Printer className="w-3 h-3" /> Etiqueta/Track
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail?.(pedido); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg ld-btn-ghost text-xs font-bold"
            title="Ver pedido completo"
          >
            <Eye className="w-3 h-3" /> Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
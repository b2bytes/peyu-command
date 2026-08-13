import { Package, Tag } from 'lucide-react';
import ChatCardShell from './ChatCardShell';
import OrderRow from './OrderRow';

const fmtCompacto = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
};

// ¿Pagado? (payment_status paid o estado post-pago).
const ESTADOS_PAGADOS = ['Confirmado', 'En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];
const estaPagado = (p) => p.payment_status === 'paid' || ESTADOS_PAGADOS.includes(p.estado);
const tieneOT = (p) => !!(p.tracking && String(p.tracking).trim());
const VIVOS = (p) => !['Cancelado', 'Reembolsado'].includes(p.estado);

// Siguiente estado lógico en el flujo operativo del pedido.
const NEXT = {
  'Nuevo': 'Confirmado',
  'Confirmado': 'En Producción',
  'En Producción': 'Listo para Despacho',
  'Listo para Despacho': 'Despachado',
  'Despachado': 'Entregado',
};

// Decide la ÚNICA acción que corresponde a este pedido según el contexto.
function accionDe(p, filtro) {
  if (filtro === 'por_etiqueta') {
    return { action: 'generarEtiqueta', payload: { id: p.id }, label: 'Generar etiqueta BlueExpress', icon: 'tag', variant: 'primary' };
  }
  if (filtro === 'por_pagar') {
    return { action: 'marcarPedidoPagado', payload: { id: p.id }, label: 'Marcar pagado' };
  }
  if (p.estado === 'Listo para Despacho' && !tieneOT(p)) {
    return { action: 'generarEtiqueta', payload: { id: p.id }, label: 'Generar etiqueta BlueExpress', icon: 'tag', variant: 'primary' };
  }
  if (!estaPagado(p)) {
    return { action: 'marcarPedidoPagado', payload: { id: p.id }, label: 'Marcar pagado' };
  }
  if (NEXT[p.estado]) {
    return { action: 'updatePedidoEstado', payload: { id: p.id, estado: NEXT[p.estado] }, label: `→ ${NEXT[p.estado]}` };
  }
  return null;
}

// Pedidos pendientes con acción. Acepta `pedidos` (CRM completo) o `lista`
// (datos ya filtrados del cerebro).
// `filtro`: 'por_pagar' (faltan marcar pagados) | 'por_etiqueta' (pagados sin OT).
export default function OrdersCard({ pedidos = [], lista, filtro, onDone }) {
  let pendientes;
  if (filtro === 'por_pagar') {
    pendientes = pedidos.filter((p) => VIVOS(p) && !estaPagado(p)).slice(0, 30);
  } else if (filtro === 'por_etiqueta') {
    pendientes = pedidos.filter((p) => VIVOS(p) && estaPagado(p) && !tieneOT(p) && p.estado !== 'Entregado').slice(0, 30);
  } else if (lista) {
    pendientes = lista;
  } else {
    pendientes = pedidos.filter((p) => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado)).slice(0, 30);
  }

  const titulo = filtro === 'por_pagar'
    ? 'Pedidos por confirmar pago'
    : filtro === 'por_etiqueta'
      ? 'Pedidos para crear etiqueta'
      : 'Pedidos pendientes';
  const vacio = filtro === 'por_pagar'
    ? 'No hay pedidos por confirmar pago 🎉'
    : filtro === 'por_etiqueta'
      ? 'No hay pedidos pagados pendientes de etiqueta 🎉'
      : 'No hay pedidos pendientes 🎉';

  const montoTotal = pendientes.reduce((s, p) => s + (Number(p.total) || 0), 0);
  const sinPagar = pendientes.filter((p) => !estaPagado(p)).length;
  const sinEtiqueta = pendientes.filter((p) => estaPagado(p) && !tieneOT(p) && p.estado !== 'Entregado').length;

  return (
    <ChatCardShell
      icon={filtro === 'por_etiqueta' ? Tag : Package}
      title={titulo}
      subtitle={pendientes.length ? 'Ordenados por urgencia · una acción por pedido' : undefined}
      count={pendientes.length}
      metrics={pendientes.length ? [
        { label: 'Monto', value: fmtCompacto(montoTotal), tone: 'accent' },
        { label: 'Sin pagar', value: sinPagar, tone: sinPagar ? 'warn' : undefined },
        { label: 'Sin etiqueta', value: sinEtiqueta, tone: sinEtiqueta ? 'warn' : undefined },
      ] : []}
      items={pendientes}
      renderItem={(p) => (
        <OrderRow key={p.id} pedido={p} accion={accionDe(p, filtro)} onDone={onDone} />
      )}
      emptyText={vacio}
      linkTo="/admin/procesar-pedidos"
      linkLabel="Ver todos"
    />
  );
}
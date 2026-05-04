// ============================================================================
// B2CFunnel · Embudo visual del flujo B2C (carrito → pago → entrega)
// ----------------------------------------------------------------------------
// Calcula etapas reales a partir de CarritoAbandonado y PedidoWeb.
// ============================================================================
import { Link } from 'react-router-dom';
import {
  ShoppingCart, CreditCard, Hammer, Truck, CheckCircle2, ArrowRight, AlertTriangle,
} from 'lucide-react';

const ETAPAS_B2C = [
  { key: 'carritos',     label: 'Carritos iniciados',       icon: ShoppingCart, color: 'bg-blue-500',     desc: 'Usuarios que ingresaron email en checkout' },
  { key: 'pedidos',      label: 'Pedidos creados',          icon: CreditCard,   color: 'bg-indigo-500',   desc: 'Conversión de carrito a pedido pagado' },
  { key: 'produccion',   label: 'En producción',            icon: Hammer,       color: 'bg-orange-500',   desc: 'Pedidos en fabricación / personalización' },
  { key: 'despachados',  label: 'Despachados',              icon: Truck,        color: 'bg-cyan-500',     desc: 'Pedidos en camino al cliente' },
  { key: 'entregados',   label: 'Entregados',               icon: CheckCircle2, color: 'bg-emerald-500',  desc: 'Pedidos confirmados como recibidos' },
];

export default function B2CFunnel({ carritos = [], pedidos = [], loading }) {
  const carritosTotal     = carritos.length;
  const pedidosTotal      = pedidos.length;
  const enProduccion      = pedidos.filter(p => ['Confirmado','En Producción','Listo para Despacho'].includes(p.estado)).length;
  const despachados       = pedidos.filter(p => p.estado === 'Despachado').length;
  const entregados        = pedidos.filter(p => p.estado === 'Entregado').length;

  const carritosAbandonados = carritos.filter(c => c.estado === 'Pendiente' || c.estado === 'Recordatorio Enviado').length;
  const carritosConvertidos = carritos.filter(c => c.estado === 'Convertido').length;
  const tasaCarritoPedido = carritosTotal > 0 ? ((carritosConvertidos / carritosTotal) * 100).toFixed(0) : 0;
  const tasaPedidoEntrega = pedidosTotal > 0 ? ((entregados / pedidosTotal) * 100).toFixed(0) : 0;

  const counts = {
    carritos: carritosTotal,
    pedidos: pedidosTotal,
    produccion: enProduccion,
    despachados,
    entregados,
  };

  const max = Math.max(...Object.values(counts), 1);

  return (
    <div className="space-y-3">
      {/* Alerta carritos abandonados */}
      {carritosAbandonados > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/15 text-amber-200 border border-amber-500/30 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>{carritosAbandonados}</strong> carritos abandonados sin recuperar.
            Tasa de recuperación actual: <strong>{tasaCarritoPedido}%</strong>
          </span>
          <Link to="/admin/ecommerce" className="ml-auto text-amber-300 hover:text-amber-100 text-xs underline">
            Ver detalle
          </Link>
        </div>
      )}

      {/* Métricas clave */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/50">Conversión Carrito → Pedido</p>
          <p className="text-2xl font-black font-poppins text-white mt-1">{tasaCarritoPedido}%</p>
          <p className="text-[11px] text-white/40">{carritosConvertidos} de {carritosTotal}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/50">Pedido → Entregado</p>
          <p className="text-2xl font-black font-poppins text-white mt-1">{tasaPedidoEntrega}%</p>
          <p className="text-[11px] text-white/40">{entregados} de {pedidosTotal}</p>
        </div>
      </div>

      {/* Embudo visual */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-white/40 text-sm">Cargando datos…</div>
        ) : (
          ETAPAS_B2C.map((stage) => {
            const count = counts[stage.key];
            const pct = (count / max) * 100;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/8 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${stage.color} rounded-lg flex items-center justify-center shadow`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{stage.label}</p>
                      <p className="text-[11px] text-white/50">{stage.desc}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black font-poppins text-white">{count}</p>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link
        to="/admin/procesar-pedidos"
        className="flex items-center justify-center gap-2 text-sm text-teal-300 hover:text-teal-200 transition-colors py-2"
      >
        Ver todos los pedidos B2C <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
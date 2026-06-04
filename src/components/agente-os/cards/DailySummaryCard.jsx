import { TrendingUp, Package, Truck, Users } from 'lucide-react';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Tarjeta de resumen del día — saludo + métricas clave del negocio.
export default function DailySummaryCard({ metrics = {}, onAsk }) {
  const stats = [
    { icon: TrendingUp, label: 'Ventas hoy', value: fmtCLP(metrics.ingresos_hoy), sub: `${metrics.pedidos_hoy || 0} pedidos`, ask: '¿Cuánto vendimos hoy?' },
    { icon: Package, label: 'En producción', value: metrics.pedidos_en_produccion ?? 0, sub: `${metrics.pedidos_listos ?? 0} por despachar`, ask: 'Muéstrame los pedidos pendientes' },
    { icon: Truck, label: 'En tránsito', value: metrics.envios_en_transito ?? 0, sub: `${metrics.envios_entregados_hoy ?? 0} entregados hoy`, ask: '¿Cómo van los despachos?' },
    { icon: Users, label: 'Leads B2B hoy', value: metrics.leads_hoy ?? 0, sub: `${metrics.leads_calientes ?? 0} calientes`, ask: 'Cotizaciones B2B recientes' },
  ];

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onAsk?.(s.ask)}
            className="text-left rounded-xl p-3 bg-ld-bg-soft/60 border border-ld-border hover:border-ld-action/50 transition-colors group"
          >
            <s.icon className="w-4 h-4 text-ld-action mb-2" />
            <div className="text-xs text-ld-fg-muted">{s.label}</div>
            <div className="text-lg font-bold text-ld-fg leading-tight mt-0.5">{s.value}</div>
            <div className="text-[11px] text-ld-fg-subtle mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>
      {(metrics.stock_bajo > 0 || metrics.consultas_sin_responder > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {metrics.stock_bajo > 0 && (
            <button onClick={() => onAsk?.('¿Qué productos tienen stock bajo?')} className="text-xs px-3 py-1.5 rounded-full bg-ld-highlight-soft text-ld-highlight border border-ld-highlight/30 font-medium">
              ⚠️ {metrics.stock_bajo} SKUs con stock bajo
            </button>
          )}
          {metrics.consultas_sin_responder > 0 && (
            <button onClick={() => onAsk?.('Consultas sin responder')} className="text-xs px-3 py-1.5 rounded-full bg-ld-highlight-soft text-ld-highlight border border-ld-highlight/30 font-medium">
              💬 {metrics.consultas_sin_responder} consultas sin responder
            </button>
          )}
        </div>
      )}
    </div>
  );
}
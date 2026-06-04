import { TrendingUp } from 'lucide-react';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Tarjeta de ventas: monto, N° pedidos, ticket promedio.
export default function SalesCard({ metrics = {}, periodo = 'hoy' }) {
  const ingresos = periodo === '7d' ? metrics.ingresos_7d : metrics.ingresos_hoy;
  const pedidos = periodo === '7d' ? (metrics.pedidos_7d ?? metrics.pedidos_hoy) : metrics.pedidos_hoy;
  const ticket = pedidos ? Math.round((ingresos || 0) / pedidos) : 0;

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-ld-action" />
        </span>
        <span className="text-sm font-semibold text-ld-fg">Ventas {periodo === '7d' ? 'últimos 7 días' : 'de hoy'}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xl font-bold text-ld-fg">{fmtCLP(ingresos)}</div>
          <div className="text-[11px] text-ld-fg-muted mt-0.5">Total</div>
        </div>
        <div>
          <div className="text-xl font-bold text-ld-fg">{pedidos ?? 0}</div>
          <div className="text-[11px] text-ld-fg-muted mt-0.5">Pedidos</div>
        </div>
        <div>
          <div className="text-xl font-bold text-ld-fg">{fmtCLP(ticket)}</div>
          <div className="text-[11px] text-ld-fg-muted mt-0.5">Ticket prom.</div>
        </div>
      </div>
    </div>
  );
}
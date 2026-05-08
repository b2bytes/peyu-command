import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * NorthStarMetrics — KPIs Q2 con comparativa vs mes anterior.
 */
export default function NorthStarMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date();
        const startMonth = today.toISOString().slice(0, 7);
        const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);

        const [pedidos, proposals, leads, movimientos, costos] = await Promise.all([
          base44.entities.PedidoWeb.list('-fecha', 500),
          base44.entities.CorporateProposal.list('-created_date', 200),
          base44.entities.B2BLead.list('-created_date', 200),
          base44.entities.MovimientoCaja.list('-fecha', 500),
          base44.entities.ProductoCostoReal.list('-created_date', 100),
        ]);

        // B2C
        const b2cActual = pedidos.filter(p => p.fecha?.startsWith(startMonth)).reduce((s, p) => s + (p.total || 0), 0);
        const b2cPrev = pedidos.filter(p => p.fecha?.startsWith(prev)).reduce((s, p) => s + (p.total || 0), 0);

        // B2B
        const b2bActual = proposals.filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(startMonth)).reduce((s, p) => s + (p.total || 0), 0);
        const b2bPrev = proposals.filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(prev)).reduce((s, p) => s + (p.total || 0), 0);

        // Conversión
        const totalLeads = leads.length;
        const totalAceptadas = proposals.filter(p => p.status === 'Aceptada').length;
        const conversion = totalLeads > 0 ? (totalAceptadas / totalLeads) * 100 : 0;

        // Caja
        const movMes = movimientos.filter(m => m.fecha?.startsWith(startMonth));
        const cash = movMes.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0)
                   - movMes.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);

        // Margen
        const costosMes = costos.filter(c => c.mes === startMonth);
        const margenPromedio = costosMes.length > 0
          ? costosMes.reduce((s, c) => s + (c.margen_real_pct || 0), 0) / costosMes.length
          : 0;

        const delta = (a, b) => b > 0 ? ((a - b) / b) * 100 : (a > 0 ? 100 : 0);

        setMetrics([
          {
            label: 'B2C MES',
            value: `$${(b2cActual / 1000000).toFixed(1)}M`,
            target: '$6M',
            progress: Math.min(100, (b2cActual / 6_000_000) * 100),
            delta: delta(b2cActual, b2cPrev),
            color: 'emerald',
          },
          {
            label: 'B2B MES',
            value: `$${(b2bActual / 1000000).toFixed(1)}M`,
            target: '$8M',
            progress: Math.min(100, (b2bActual / 8_000_000) * 100),
            delta: delta(b2bActual, b2bPrev),
            color: 'cyan',
          },
          {
            label: 'CONVERSIÓN',
            value: `${conversion.toFixed(1)}%`,
            target: '7%',
            progress: Math.min(100, (conversion / 7) * 100),
            color: 'violet',
          },
          {
            label: 'CAJA MES',
            value: cash >= 0 ? `+$${(cash / 1000).toFixed(0)}K` : `-$${(Math.abs(cash) / 1000).toFixed(0)}K`,
            target: 'positivo',
            progress: cash >= 0 ? 100 : 0,
            color: cash >= 0 ? 'emerald' : 'red',
          },
          {
            label: 'MARGEN REAL',
            value: `${margenPromedio.toFixed(0)}%`,
            target: '55%',
            progress: Math.min(100, (margenPromedio / 55) * 100),
            color: margenPromedio >= 50 ? 'emerald' : margenPromedio >= 35 ? 'amber' : 'red',
          },
        ]);
      } catch (e) {
        console.warn('NorthStar:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const colorMap = {
    emerald: { text: 'text-emerald-300', bar: 'from-emerald-500 to-teal-500', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.15)]' },
    cyan: { text: 'text-cyan-300', bar: 'from-cyan-500 to-blue-500', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]' },
    violet: { text: 'text-violet-300', bar: 'from-violet-500 to-indigo-500', glow: 'shadow-[0_0_20px_rgba(167,139,250,0.15)]' },
    amber: { text: 'text-amber-300', bar: 'from-amber-500 to-orange-500', glow: '' },
    red: { text: 'text-red-300', bar: 'from-red-500 to-rose-500', glow: '' },
  };

  return (
    <div className="bg-gradient-to-br from-slate-950/80 to-emerald-950/20 backdrop-blur-md rounded-2xl border border-emerald-400/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-500/5 border-b border-emerald-400/10">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-emerald-300 fill-emerald-300/30" />
          <h3 className="text-[11px] font-bold tracking-[0.2em] text-white">NORTH STAR</h3>
          <span className="text-[9px] text-emerald-300/60 font-mono">· Q2 · vs_mes_anterior</span>
        </div>
        <span className="text-[9px] text-emerald-300/40 font-mono">5 KPIs</span>
      </div>

      {loading ? (
        <div className="text-white/30 text-xs text-center py-8 font-mono">computing metrics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-white/5">
          {metrics.map((m, i) => {
            const cm = colorMap[m.color] || colorMap.emerald;
            const TrendIcon = m.delta == null ? Minus : m.delta > 0 ? TrendingUp : m.delta < 0 ? TrendingDown : Minus;
            const trendColor = m.delta == null ? 'text-white/30' : m.delta > 0 ? 'text-emerald-400' : m.delta < 0 ? 'text-red-400' : 'text-white/30';
            return (
              <div key={i} className="p-3 hover:bg-white/[0.02] transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] text-white/40 font-mono tracking-widest">{m.label}</span>
                  {m.delta != null && (
                    <span className={`text-[9px] font-mono ${trendColor} flex items-center gap-0.5`}>
                      <TrendIcon className="w-2.5 h-2.5" />
                      {m.delta > 0 ? '+' : ''}{m.delta.toFixed(0)}%
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-bold font-poppins leading-none ${cm.text} tabular-nums`}>{m.value}</p>
                <div className="mt-2.5">
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${cm.bar} ${cm.glow} transition-all`}
                      style={{ width: `${Math.max(2, m.progress)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-white/30 mt-1 font-mono">target · {m.target}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
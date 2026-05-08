import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * NorthStarMetrics — las 4-5 métricas que importan ESTE TRIMESTRE.
 * Solo lo crítico, con progreso vs meta.
 */
export default function NorthStarMetrics() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const startMonth = new Date().toISOString().slice(0, 7);
        const [pedidos, proposals, leads, movimientos, costos] = await Promise.all([
          base44.entities.PedidoWeb.list('-fecha', 500),
          base44.entities.CorporateProposal.list('-created_date', 200),
          base44.entities.B2BLead.list('-created_date', 200),
          base44.entities.MovimientoCaja.list('-fecha', 500),
          base44.entities.ProductoCostoReal.list('-created_date', 100),
        ]);

        const pedidosMes = pedidos.filter(p => p.fecha?.startsWith(startMonth));
        const ingresosB2C = pedidosMes.reduce((s, p) => s + (p.total || 0), 0);

        const propAceptadasMes = proposals.filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(startMonth));
        const ingresosB2B = propAceptadasMes.reduce((s, p) => s + (p.total || 0), 0);

        const totalLeads = leads.length;
        const totalAceptadas = proposals.filter(p => p.status === 'Aceptada').length;
        const conversion = totalLeads > 0 ? (totalAceptadas / totalLeads) * 100 : 0;

        const movMes = movimientos.filter(m => m.fecha?.startsWith(startMonth));
        const ingresosMov = movMes.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
        const egresosMov = movMes.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);
        const cash = ingresosMov - egresosMov;

        const costosMes = costos.filter(c => c.mes === startMonth);
        const margenPromedio = costosMes.length > 0
          ? costosMes.reduce((s, c) => s + (c.margen_real_pct || 0), 0) / costosMes.length
          : 0;

        setMetrics([
          {
            label: 'Ingresos B2C (mes)',
            value: `$${(ingresosB2C / 1000000).toFixed(1)}M`,
            target: '$6M',
            progress: Math.min(100, (ingresosB2C / 6_000_000) * 100),
            color: 'emerald',
          },
          {
            label: 'Ingresos B2B (mes)',
            value: `$${(ingresosB2B / 1000000).toFixed(1)}M`,
            target: '$8M',
            progress: Math.min(100, (ingresosB2B / 8_000_000) * 100),
            color: 'cyan',
          },
          {
            label: 'Conversión Lead→Venta',
            value: `${conversion.toFixed(1)}%`,
            target: '7%',
            progress: Math.min(100, (conversion / 7) * 100),
            color: 'violet',
          },
          {
            label: 'Saldo Caja Mes',
            value: cash >= 0 ? `+$${(cash / 1000).toFixed(0)}K` : `-$${(Math.abs(cash) / 1000).toFixed(0)}K`,
            target: 'Positivo',
            progress: cash >= 0 ? 100 : 0,
            color: cash >= 0 ? 'emerald' : 'red',
          },
          {
            label: 'Margen real promedio',
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
    emerald: 'from-emerald-500 to-teal-500 text-emerald-300',
    cyan: 'from-cyan-500 to-blue-500 text-cyan-300',
    violet: 'from-violet-500 to-indigo-500 text-violet-300',
    amber: 'from-amber-500 to-orange-500 text-amber-300',
    red: 'from-red-500 to-rose-500 text-red-300',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-emerald-950/30 backdrop-blur-md rounded-2xl border border-emerald-400/20 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-emerald-300 fill-emerald-300/30" />
        <h3 className="font-poppins font-semibold text-white text-sm">NORTH STAR · Q2</h3>
        <span className="text-[10px] text-emerald-300/70">· las que importan</span>
      </div>
      {loading ? (
        <div className="text-white/40 text-sm text-center py-8">Cargando…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {metrics.map((m, i) => {
            const TrendIcon = m.progress >= 100 ? TrendingUp : m.progress >= 50 ? Minus : TrendingDown;
            const colorClasses = colorMap[m.color] || colorMap.emerald;
            const [grad, , txt] = colorClasses.split(' ');
            return (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[10px] text-white/60 leading-tight">{m.label}</p>
                  <TrendIcon className={`w-3 h-3 ${txt}`} />
                </div>
                <p className={`text-xl font-bold font-poppins ${txt}`}>{m.value}</p>
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colorClasses.split(' ').slice(0, 2).join(' ')}`}
                      style={{ width: `${Math.max(2, m.progress)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-white/40 mt-1">Meta: {m.target}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
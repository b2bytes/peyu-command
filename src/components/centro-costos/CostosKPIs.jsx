import { Receipt, TrendingDown, AlertTriangle, Sparkles, DollarSign } from 'lucide-react';

const fmt = (n) => `$${((n || 0) / 1000).toLocaleString('es-CL', { maximumFractionDigits: 0 })}K`;

/**
 * KPIs principales del Centro de Costos del mes seleccionado.
 */
export default function CostosKPIs({ totalFantasmas, fantasmasCount, productosCalculados, productosAlerta, sugerenciasPendientes, margenPromedio }) {
  const kpis = [
    {
      label: 'Costos fantasma',
      val: fmt(totalFantasmas),
      sub: `${fantasmasCount} registros`,
      icon: Receipt,
      gradient: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200',
    },
    {
      label: 'Margen real promedio',
      val: `${(margenPromedio || 0).toFixed(1)}%`,
      sub: `${productosCalculados} SKUs analizados`,
      icon: TrendingDown,
      gradient: margenPromedio >= 50 ? 'from-emerald-400 to-teal-500' : 'from-red-400 to-orange-500',
      bg: margenPromedio >= 50 ? 'from-emerald-50 to-teal-50' : 'from-red-50 to-orange-50',
      border: margenPromedio >= 50 ? 'border-emerald-200' : 'border-red-200',
    },
    {
      label: 'Margen bajo',
      val: productosAlerta || 0,
      sub: 'productos en alerta',
      icon: AlertTriangle,
      gradient: 'from-red-400 to-rose-500',
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200',
    },
    {
      label: 'Sugerencias IA',
      val: sugerenciasPendientes || 0,
      sub: 'esperando aprobación',
      icon: Sparkles,
      gradient: 'from-teal-400 to-cyan-500',
      bg: 'from-teal-50 to-cyan-50',
      border: 'border-teal-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div
            key={i}
            className={`relative bg-gradient-to-br ${k.bg} border ${k.border} rounded-2xl p-4 overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${k.gradient} flex items-center justify-center shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">{k.label}</p>
            <p className="font-poppins font-extrabold text-2xl text-foreground tabular-nums leading-none">{k.val}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{k.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
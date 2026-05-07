import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

/**
 * Tarjeta KPI clickeable. Si recibe `to`, envuelve todo en un Link a la
 * lista filtrada. Reemplaza al StatCard estático del dashboard.
 */
export default function ClickableKPI({
  title, value, subtitle, icon: Icon, trend, trendLabel,
  color = '#14b8a6', bg = 'rgba(20,184,166,0.1)', to,
}) {
  const inner = (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20 hover:border-white/40 hover:bg-white/15 transition-all h-full group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-teal-300/80 uppercase tracking-wide">{title}</p>
            {to && <ArrowUpRight className="w-3 h-3 text-teal-300/50 group-hover:text-teal-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />}
          </div>
          <p className="text-2xl font-poppins font-bold mt-1 text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-300/70 mt-1 truncate">{subtitle}</p>}
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center ml-3 flex-shrink-0" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );

  return to ? <Link to={to} className="block">{inner}</Link> : inner;
}
// ============================================================================
// AITokenUsageChart · Evolución diaria de tokens y costo
// ----------------------------------------------------------------------------
// Gráfico de área dual: tokens (izquierda) y costo USD (derecha).
// ============================================================================
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function AITokenUsageChart({ stats }) {
  const data = (stats?.by_day || []).map(d => ({
    day: d.day.slice(5), // MM-DD
    tokens: d.tokens,
    cost: Number((d.cost || 0).toFixed(4)),
    calls: d.calls,
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <TrendingUp className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm font-inter">Sin datos de tendencia aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-jakarta font-bold text-white text-base tracking-tight">Uso diario</h3>
          <p className="text-xs text-white/50 font-inter">Tokens consumidos y costo estimado por día</p>
        </div>
        <TrendingUp className="w-4 h-4 text-teal-300" />
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="tokensGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#fff', fontWeight: 700 }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }} />
          <Area yAxisId="left" type="monotone" dataKey="tokens" stroke="#2dd4bf" strokeWidth={2} fill="url(#tokensGrad)" name="Tokens" />
          <Area yAxisId="right" type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} fill="url(#costGrad)" name="Costo USD" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
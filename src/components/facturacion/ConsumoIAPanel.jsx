import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Cpu, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const fmtNum = (n) => Math.round(n || 0).toLocaleString('es-CL');

// Panel de consumo real de IA (últimos 30 días) desde los AILog de la app:
// llamadas, tokens, costo USD y desglose por modelo — el driver principal
// del gasto de créditos de la plataforma.
export default function ConsumoIAPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    base44.functions.invoke('aiUsageStats', { since })
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="ld-card p-10 flex items-center justify-center gap-2 text-ld-fg-muted">
        <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Cargando consumo de IA…</span>
      </div>
    );
  }
  if (!stats?.ok) return null;

  const modelos = Object.entries(stats.by_model || {}).sort((a, b) => b[1].tokens - a[1].tokens);

  return (
    <div className="ld-card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ld-highlight-soft)' }}>
          <Cpu className="w-5 h-5 text-ld-highlight" />
        </div>
        <div>
          <p className="text-sm font-bold text-ld-fg">Consumo de IA · últimos 30 días</p>
          <p className="text-xs text-ld-fg-muted">Registro interno de la app (chats, generaciones, agentes)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Mini label="Llamadas IA" value={fmtNum(stats.total_calls)} />
        <Mini label="Tokens totales" value={fmtNum(stats.tokens?.total)} />
        <Mini label="Costo estimado" value={`US$${(stats.cost_usd || 0).toFixed(2)}`} />
        <Mini label="Tasa de éxito" value={`${((stats.success_rate || 0) * 100).toFixed(0)}%`} />
      </div>

      {stats.by_day?.length > 1 && (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.by_day} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F8B6C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0F8B6C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ld-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" name="Llamadas" stroke="#0F8B6C" strokeWidth={2} fill="url(#gradCalls)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {modelos.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted mb-2">Por modelo</p>
          <div className="space-y-1.5">
            {modelos.map(([modelo, m]) => (
              <div key={modelo} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'var(--ld-bg-soft)', border: '1px solid var(--ld-border)' }}>
                <span className="text-xs font-bold text-ld-fg truncate">{modelo}</span>
                <span className="text-[11px] text-ld-fg-muted font-semibold flex-shrink-0">
                  {fmtNum(m.count)} llamadas · {fmtNum(m.tokens)} tokens
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: 'var(--ld-bg-soft)', border: '1px solid var(--ld-border)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-ld-fg-muted">{label}</p>
      <p className="text-lg font-bold text-ld-fg">{value}</p>
    </div>
  );
}
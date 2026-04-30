// ============================================================================
// HealthCheckWidget — monitor live del endpoint público /healthCheck
// ----------------------------------------------------------------------------
// Pingea cada 60s y muestra estado, latencia BD y uptime. Útil para el
// War Room durante el launch para detectar caídas en tiempo real.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

function formatUptime(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function HealthCheckWidget() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);
  const [history, setHistory] = useState([]); // últimas 10 latencias

  const ping = async () => {
    const t0 = performance.now();
    try {
      const res = await base44.functions.invoke('healthCheck', {});
      const latency = Math.round(performance.now() - t0);
      setData(res.data);
      setError(null);
      setLastCheck(new Date());
      setHistory((h) => [...h.slice(-9), { latency, ok: res.data?.status === 'ok', t: Date.now() }]);
    } catch (err) {
      setError(err.message || 'Error de conexión');
      setData(null);
      setLastCheck(new Date());
      setHistory((h) => [...h.slice(-9), { latency: 0, ok: false, t: Date.now() }]);
    }
  };

  useEffect(() => {
    ping();
    const id = setInterval(ping, 60_000);
    return () => clearInterval(id);
  }, []);

  const isOk = data?.status === 'ok' && !error;
  const dbLatency = data?.db?.latency_ms;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isOk ? 'text-emerald-600' : 'text-red-600'}`} />
          <h3 className="font-semibold text-gray-900 text-sm">Health Check live</h3>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isOk ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
               : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {isOk ? '● OPERATIONAL' : '● DOWN'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">App</p>
          <div className="flex items-center gap-1.5 mt-1">
            {isOk
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
            <p className="text-sm font-bold text-gray-900">{isOk ? 'OK' : 'Err'}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">DB latency</p>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {dbLatency != null ? `${dbLatency}ms` : '—'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Uptime</p>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {formatUptime(data?.uptime_ms)}
          </p>
        </div>
      </div>

      {/* Sparkline de latencia (últimas 10 muestras) */}
      {history.length > 0 && (
        <div className="flex items-end gap-1 h-10 mb-3">
          {history.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${
                !h.ok ? 'bg-red-300'
                : h.latency < 300 ? 'bg-emerald-400'
                : h.latency < 800 ? 'bg-amber-400'
                : 'bg-orange-400'
              }`}
              style={{ height: `${Math.min(100, Math.max(10, (h.latency / 10)))}%` }}
              title={h.ok ? `${h.latency}ms` : 'error'}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lastCheck ? `Hace ${Math.floor((Date.now() - lastCheck.getTime()) / 1000)}s` : '—'}
        </span>
        <span>Ping cada 60s</span>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          {error}
        </p>
      )}
    </div>
  );
}
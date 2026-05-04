// ============================================================================
// MonitoreoIA · Vista centralizada de monitoreo de modelos IA
// ----------------------------------------------------------------------------
// 1) Estado de modelos en uso (vendor, calls, tokens, costo).
// 2) Uso de tokens / costo a lo largo del tiempo.
// 3) Consola en tiempo real de respuestas del asistente.
// 4) Drawer para auditar y marcar casos para re-entrenamiento.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Brain, RefreshCw, Calendar, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { computeAIStats } from '@/lib/ai-stats';

import AIStatsHeader from '@/components/monitoreo-ia/AIStatsHeader';
import AIModelStatusGrid from '@/components/monitoreo-ia/AIModelStatusGrid';
import AITokenUsageChart from '@/components/monitoreo-ia/AITokenUsageChart';
import AILiveConsole from '@/components/monitoreo-ia/AILiveConsole';
import AIAuditDrawer from '@/components/monitoreo-ia/AIAuditDrawer';
import AIRetrainQueuePanel from '@/components/monitoreo-ia/AIRetrainQueuePanel';

const WINDOWS = [
  { label: '24h', days: 1 },
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
];

export default function MonitoreoIA() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [windowDays, setWindowDays] = useState(7);
  const [selectedLog, setSelectedLog] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadStats = async () => {
    setLoading(true);
    try {
      const sinceDate = new Date(Date.now() - windowDays * 24 * 3600 * 1000);
      // 1) Intentar función backend (más eficiente con muchos datos).
      try {
        const res = await base44.functions.invoke('aiUsageStats', { since: sinceDate.toISOString() });
        if (res.data?.ok) {
          setStats(res.data);
          setLoading(false);
          return;
        }
      } catch {
        // continúa al fallback cliente
      }
      // 2) Fallback: calcular en cliente desde la entidad.
      const logs = await base44.entities.AILog.list('-created_date', 500);
      setStats(computeAIStats(logs, sinceDate));
    } catch (e) {
      // último recurso: mostrar vacío
      setStats(computeAIStats([], new Date(Date.now() - windowDays * 24 * 3600 * 1000)));
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, [windowDays, refreshKey]);

  const handleAuditUpdated = () => setRefreshKey(k => k + 1);

  // Bulk approve: aprueba todas las llamadas success pendientes en la ventana actual
  const [bulkBusy, setBulkBusy] = useState(false);
  const handleBulkApprove = async () => {
    if (!confirm('¿Aprobar todas las respuestas exitosas pendientes? (No marca las flagged ni con feedback negativo)')) return;
    setBulkBusy(true);
    try {
      const sinceDate = new Date(Date.now() - windowDays * 24 * 3600 * 1000);
      const logs = await base44.entities.AILog.list('-created_date', 500);
      const candidates = logs.filter(l =>
        new Date(l.created_date) >= sinceDate &&
        (!l.auditor_review || l.auditor_review === 'pending') &&
        l.status === 'success' &&
        l.user_feedback !== 'negative'
      );
      let count = 0;
      for (const l of candidates) {
        await base44.entities.AILog.update(l.id, { auditor_review: 'approved' });
        count++;
      }
      toast.success(`✅ ${count} respuestas aprobadas en bulk`);
      setRefreshKey(k => k + 1);
    } catch (e) {
      toast.error('Error: ' + (e?.message || 'desconocido'));
    }
    setBulkBusy(false);
  };

  return (
    <div className="min-h-screen p-5 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-jakarta font-extrabold text-white text-2xl tracking-tight leading-none">
              Monitoreo IA
            </h1>
            <p className="text-sm text-white/50 font-inter mt-1">
              Estado de modelos · uso de tokens · consola y auditoría en vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de ventana */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            <Calendar className="w-3.5 h-3.5 text-white/40 ml-2" />
            {WINDOWS.map(w => (
              <button
                key={w.days}
                onClick={() => setWindowDays(w.days)}
                className={`px-3 py-1 rounded-md text-xs font-bold font-jakarta transition-all ${
                  windowDays === w.days
                    ? 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkBusy || (stats?.pending_review || 0) === 0}
            className="h-9 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 gap-1.5 text-xs"
          >
            <CheckCheck className={`w-3.5 h-3.5 ${bulkBusy ? 'animate-pulse' : ''}`} />
            Aprobar pendientes {(stats?.pending_review || 0) > 0 && `(${stats.pending_review})`}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefreshKey(k => k + 1)}
            className="h-9 text-white/60 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* KPIs */}
      <AIStatsHeader stats={stats} loading={loading} />

      {/* Modelos */}
      <section>
        <h2 className="font-jakarta font-bold text-white text-base tracking-tight mb-3">
          Estado de modelos
        </h2>
        <AIModelStatusGrid stats={stats} />
      </section>

      {/* Chart + Console lado a lado en desktop */}
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
        <div className="space-y-5">
          <AITokenUsageChart stats={stats} />

          {/* Distribución por agente */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
            <h3 className="font-jakarta font-bold text-white text-sm tracking-tight mb-3">Por agente</h3>
            <div className="space-y-2">
              {Object.entries(stats?.by_agent || {}).sort((a, b) => b[1].count - a[1].count).slice(0, 8).map(([name, data]) => {
                const total = stats?.total_calls || 1;
                const pct = (data.count / total) * 100;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1 text-xs font-inter">
                      <span className="text-white/80 font-medium truncate">{name}</span>
                      <span className="text-white/40 font-mono">{data.count} · {data.tokens} tk</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(stats?.by_agent || {}).length === 0 && (
                <p className="text-xs text-white/40 font-inter">Sin datos en esta ventana.</p>
              )}
            </div>
          </div>
        </div>

        <AILiveConsole onSelectLog={setSelectedLog} key={refreshKey} />
      </div>

      {/* Cola de re-entrenamiento (gold standards listos para fine-tuning) */}
      <AIRetrainQueuePanel onSelectLog={setSelectedLog} refreshKey={refreshKey} />

      {/* Drawer */}
      {selectedLog && (
        <AIAuditDrawer
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onUpdated={handleAuditUpdated}
        />
      )}
    </div>
  );
}
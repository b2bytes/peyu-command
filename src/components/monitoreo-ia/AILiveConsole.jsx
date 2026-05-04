// ============================================================================
// AILiveConsole · Consola en tiempo real de respuestas IA
// ----------------------------------------------------------------------------
// Lista las últimas llamadas con auto-refresh. Click en una fila → abre el
// drawer de auditoría para ver, aprobar, marcar para retraining, etc.
// ============================================================================
import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Clock, Search, Filter, RefreshCw, Pause, Play, GraduationCap, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_ICON = {
  success:  { icon: CheckCircle2, color: 'text-emerald-300' },
  error:    { icon: AlertCircle,  color: 'text-rose-400' },
  timeout:  { icon: Clock,        color: 'text-amber-300' },
  filtered: { icon: AlertCircle,  color: 'text-violet-300' },
  fallback: { icon: AlertCircle,  color: 'text-yellow-300' },
};

const REVIEW_BADGE = {
  pending:           { label: 'Pendiente',  cls: 'bg-amber-500/15 text-amber-300 border-amber-400/25' },
  approved:          { label: 'Aprobada',   cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25' },
  flagged:           { label: 'Flagged',    cls: 'bg-rose-500/15 text-rose-300 border-rose-400/25' },
  needs_retraining:  { label: 'Re-train',   cls: 'bg-violet-500/15 text-violet-300 border-violet-400/25' },
};

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `hace ${Math.round(diff)}s`;
  if (diff < 3600) return `hace ${Math.round(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.round(diff / 3600)}h`;
  return new Date(date).toLocaleDateString('es-CL');
}

export default function AILiveConsole({ onSelectLog }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [filterReview, setFilterReview] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.AILog.list('-created_date', 100);
      setLogs(data || []);
    } catch (e) {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const agents = useMemo(() => Array.from(new Set(logs.map(l => l.agent_name).filter(Boolean))), [logs]);

  const filtered = logs.filter(log => {
    if (filterReview !== 'all' && log.auditor_review !== filterReview) return false;
    if (filterAgent !== 'all' && log.agent_name !== filterAgent) return false;
    if (search && !`${log.user_message} ${log.ai_response} ${log.agent_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
          <h3 className="font-jakarta font-bold text-white text-sm tracking-tight">Consola en vivo</h3>
          <span className="text-[10px] text-white/40 font-inter">{filtered.length} de {logs.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-8 text-white/60 hover:text-white hover:bg-white/5 gap-1.5">
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-xs">{autoRefresh ? 'Pausar' : 'Reanudar'}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={load}
            className="h-8 text-white/60 hover:text-white hover:bg-white/5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mensaje, respuesta, agente..."
            className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <select value={filterReview} onChange={e => setFilterReview(e.target.value)}
          className="h-8 text-xs bg-white/5 border border-white/10 rounded-md px-2 text-white">
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="flagged">Flagged</option>
          <option value="needs_retraining">Re-train</option>
        </select>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          className="h-8 text-xs bg-white/5 border border-white/10 rounded-md px-2 text-white">
          <option value="all">Todos los agentes</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light divide-y divide-white/5">
        {loading && logs.length === 0 && (
          <div className="p-6 text-center text-white/40 text-sm font-inter">Cargando...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center">
            <Filter className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm font-inter">No hay registros con esos filtros.</p>
          </div>
        )}

        {filtered.map(log => {
          const Status = (STATUS_ICON[log.status] || STATUS_ICON.success);
          const StatusIcon = Status.icon;
          const reviewMeta = REVIEW_BADGE[log.auditor_review] || REVIEW_BADGE.pending;

          return (
            <button
              key={log.id}
              onClick={() => onSelectLog?.(log)}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-4 h-4 ${Status.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-jakarta font-bold text-white text-xs tracking-tight">{log.agent_name || 'unknown'}</span>
                    <span className="text-[10px] text-white/30 font-mono">{log.model || '—'}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${reviewMeta.cls}`}>
                      {reviewMeta.label}
                    </span>
                    {log.marked_for_retraining && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded border border-violet-400/25">
                        <GraduationCap className="w-2.5 h-2.5" /> Cola
                      </span>
                    )}
                    {log.user_feedback === 'negative' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-400/25">
                        <Flag className="w-2.5 h-2.5" /> Negative
                      </span>
                    )}
                    <span className="text-[10px] text-white/30 ml-auto">{timeAgo(log.created_date)}</span>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-1 font-inter">
                    <span className="text-white/40">→</span> {log.user_message || '(sin mensaje)'}
                  </p>
                  <p className="text-[11px] text-white/50 line-clamp-1 font-inter mt-0.5">
                    <span className="text-teal-300/70">←</span> {log.ai_response || '(sin respuesta)'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-mono">
                    <span>{log.tokens_total || 0} tk</span>
                    {log.cost_usd > 0 && <span>${log.cost_usd.toFixed(4)}</span>}
                    {log.latency_ms > 0 && <span>{log.latency_ms}ms</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
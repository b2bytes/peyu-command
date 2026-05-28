// ============================================================================
// AILiveConsole · Consola en tiempo real de respuestas IA
// ----------------------------------------------------------------------------
// Lista las últimas llamadas con auto-refresh. Click en una fila → abre el
// drawer de auditoría para ver, aprobar, marcar para retraining, etc.
// ============================================================================
import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Clock, Search, Filter, RefreshCw, Pause, Play, GraduationCap, Flag, MessagesSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Limpia el user_message quitando el bloque [CONTEXTO] page=/... top_skus="..."
// que el frontend del chat envía como prefijo técnico. Lo que queda es el
// mensaje real del cliente.
function cleanUserText(text) {
  if (!text) return '';
  let m = String(text);
  m = m.replace(/^\[CONTEXTO\][^\n]*/g, '').trim();
  return m;
}

const STATUS_ICON = {
  success:  { icon: CheckCircle2, color: 'text-emerald-600' },
  error:    { icon: AlertCircle,  color: 'text-red-600' },
  timeout:  { icon: Clock,        color: 'text-amber-600' },
  filtered: { icon: AlertCircle,  color: 'text-violet-600' },
  fallback: { icon: AlertCircle,  color: 'text-yellow-600' },
};

const REVIEW_BADGE = {
  pending:           { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved:          { label: 'Aprobada',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  flagged:           { label: 'Flagged',    cls: 'bg-red-100 text-red-800 border-red-200' },
  needs_retraining:  { label: 'Re-train',   cls: 'bg-violet-100 text-violet-800 border-violet-200' },
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

  // Agrupa logs por conversation_id para mostrar conversaciones (no turnos
  // sueltos). Cada grupo se representa por su log más reciente + un contador.
  const conversations = useMemo(() => {
    const map = new Map();
    for (const log of logs) {
      const key = log.conversation_id || log.id;
      if (!map.has(key)) {
        map.set(key, { latest: log, count: 1, logs: [log] });
      } else {
        const grp = map.get(key);
        grp.count += 1;
        grp.logs.push(log);
        // logs vienen ordenados -created_date, así que el primero ya es el más reciente
      }
    }
    return Array.from(map.values());
  }, [logs]);

  const filtered = conversations.filter(({ latest }) => {
    if (filterReview !== 'all' && latest.auditor_review !== filterReview) return false;
    if (filterAgent !== 'all' && latest.agent_name !== filterAgent) return false;
    if (search) {
      const cleanMsg = cleanUserText(latest.user_message);
      const haystack = `${cleanMsg} ${latest.ai_response} ${latest.agent_name}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="ld-card flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ld-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'animate-pulse' : ''}`} style={{ background: autoRefresh ? 'var(--ld-action)' : 'var(--ld-fg-muted)' }} />
          <h3 className="font-jakarta font-bold text-ld-fg text-sm tracking-tight">Conversaciones en vivo</h3>
          <span className="text-[10px] text-ld-fg-muted">{filtered.length} convs · {logs.length} mensajes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-8 text-ld-fg-muted hover:text-ld-fg hover:bg-ld-bg-soft gap-1.5">
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="text-xs">{autoRefresh ? 'Pausar' : 'Reanudar'}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={load}
            className="h-8 text-ld-fg-muted hover:text-ld-fg hover:bg-ld-bg-soft">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="px-4 py-2.5 border-b border-ld-border flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-muted" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mensaje, respuesta, agente..."
            className="pl-8 h-8 text-xs ld-input text-ld-fg placeholder:text-ld-fg-muted"
          />
        </div>
        <select value={filterReview} onChange={e => setFilterReview(e.target.value)}
          className="h-8 text-xs ld-card border border-ld-border rounded-md px-2 text-ld-fg font-medium bg-ld-bg-elevated">
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="flagged">Flagged</option>
          <option value="needs_retraining">Re-train</option>
        </select>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
          className="h-8 text-xs ld-card border border-ld-border rounded-md px-2 text-ld-fg font-medium bg-ld-bg-elevated">
          <option value="all">Todos los agentes</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar divide-y divide-ld-border">
        {loading && logs.length === 0 && (
          <div className="p-6 text-center text-ld-fg-muted text-sm">Cargando...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="p-10 text-center">
            <Filter className="w-8 h-8 text-ld-fg-muted mx-auto mb-3 opacity-40" />
            <p className="text-ld-fg-muted text-sm">No hay registros con esos filtros.</p>
          </div>
        )}

        {filtered.map(({ latest: log, count }) => {
          const Status = (STATUS_ICON[log.status] || STATUS_ICON.success);
          const StatusIcon = Status.icon;
          const reviewMeta = REVIEW_BADGE[log.auditor_review] || REVIEW_BADGE.pending;
          const cleanMsg = cleanUserText(log.user_message);
          const noRealMessage = !cleanMsg;

          return (
            <button
              key={log.conversation_id || log.id}
              onClick={() => onSelectLog?.(log)}
              className="w-full text-left px-4 py-3 hover:bg-ld-bg-soft transition-colors group"
            >
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-4 h-4 ${Status.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-jakarta font-bold text-ld-fg text-xs tracking-tight">{log.agent_name || 'unknown'}</span>
                    {count > 1 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-800 bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-200">
                        <MessagesSquare className="w-2.5 h-2.5" /> {count} turnos
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${reviewMeta.cls}`}>
                      {reviewMeta.label}
                    </span>
                    {log.marked_for_retraining && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-violet-800 bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200">
                        <GraduationCap className="w-2.5 h-2.5" /> Cola
                      </span>
                    )}
                    {log.user_feedback === 'negative' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                        <Flag className="w-2.5 h-2.5" /> Negative
                      </span>
                    )}
                    <span className="text-[10px] text-ld-fg-muted ml-auto">{timeAgo(log.created_date)}</span>
                  </div>

                  {noRealMessage ? (
                    <p className="text-xs italic line-clamp-1" style={{ color: 'var(--ld-highlight)' }}>
                      🔇 El cliente abrió el chat pero aún no escribió nada · click para ver la conversación
                    </p>
                  ) : (
                    <p className="text-xs text-ld-fg line-clamp-2 font-medium">
                      <span className="text-ld-fg-muted">Cliente:</span> {cleanMsg}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ld-fg-muted">
                    <MessagesSquare className="w-3 h-3" />
                    <span className="font-semibold" style={{ color: 'var(--ld-action)' }}>Abrir conversación completa →</span>
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
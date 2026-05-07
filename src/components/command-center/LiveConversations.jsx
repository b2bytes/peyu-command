import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Loader2, ArrowRight, User, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Panel del Centro de Comando: muestra las últimas conversaciones del chat
 * público con Peyu (AILog task_type='chat') en vivo. Auto-refresh 30s.
 *
 * Permite ver al toque:
 *   - Quién está hablando con Peyu
 *   - Qué preguntó
 *   - Qué respondió Peyu
 *   - Click directo a /admin/monitoreo-ia para auditar
 */
export default function LiveConversations() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const all = await base44.entities.AILog.list('-created_date', 50);
      // Solo chat público REAL (landing) — descarta seed/demo data:
      //   - chats sin conversation_id (data antigua sin trazabilidad)
      //   - chats con tag 'chat_publico' (los nuevos del proxy)
      const chats = all.filter(a =>
        a.task_type === 'chat' &&
        (a.conversation_id || (a.tags || []).includes('chat_publico'))
      );
      const byConv = {};
      for (const c of chats) {
        const key = c.conversation_id || c.session_id || c.id;
        if (!byConv[key]) byConv[key] = c; // primero = más reciente (orden -created_date)
      }
      setLogs(Object.values(byConv).slice(0, 8));
      setLastUpdate(new Date());
      setLoading(false);
    } catch (e) {
      console.warn('LiveConversations load error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 1200); // stagger
    const id = setInterval(load, 60_000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, []);

  const truncate = (s, n = 80) => !s ? '' : (s.length > n ? s.slice(0, n) + '…' : s);
  const ago = (d) => {
    if (!d) return '';
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl flex flex-col h-[420px]">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-sm">Conversaciones con Peyu · En vivo</h3>
            <p className="text-[10px] text-teal-300/70">
              {lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando…'}
            </p>
          </div>
        </div>
        <Link to="/admin/monitoreo-ia" className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 peyu-scrollbar-light">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/60 text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando…
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/50 text-xs gap-2">
            <Bot className="w-8 h-8 opacity-40" />
            <p>Sin conversaciones recientes</p>
          </div>
        ) : (
          logs.map((c) => (
            <div key={c.id} className="bg-white/5 hover:bg-white/10 transition rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-teal-300">
                  <User className="w-3 h-3" />
                  <span className="font-mono">{c.user_email || `anon-${(c.session_id || '').slice(-6) || 'web'}`}</span>
                </div>
                <span className="text-[10px] text-white/40">{ago(c.created_date)}</span>
              </div>
              {c.user_message && (
                <p className="text-xs text-white/80 mb-1.5 line-clamp-2">
                  <span className="text-cyan-300/80 font-semibold">→</span> {truncate(c.user_message, 120)}
                </p>
              )}
              {c.ai_response && (
                <p className="text-[11px] text-white/55 line-clamp-2 italic">
                  <span className="text-emerald-300/80 not-italic font-semibold">🐢</span> {truncate(c.ai_response, 130)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[9px] text-white/40">
                {c.tokens_total > 0 && <span>{c.tokens_total}t</span>}
                {c.latency_ms > 0 && <span>{c.latency_ms}ms</span>}
                {c.status && c.status !== 'success' && <span className="text-red-300">{c.status}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
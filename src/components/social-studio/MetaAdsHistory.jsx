import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Loader2, History } from 'lucide-react';

// Historial de conversaciones del agente de Meta Ads. Lista las conversaciones
// nativas del agente (guardadas automáticamente por Base44) y permite reabrir
// cualquiera. Tema oscuro para el panel de Meta Ads.
export default function MetaAdsHistory({ agentName, activeId, refreshKey, onSelect }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.agents
      .listConversations({ agent_name: agentName })
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : (res?.conversations || res?.data || []);
        setThreads(list || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [agentName, refreshKey]);

  const title = (t) =>
    t?.metadata?.name ||
    t?.messages?.find((m) => m.role === 'user')?.content?.slice(0, 40) ||
    'Conversación';

  return (
    <div className="px-3 pb-3 mt-2 border-t border-white/[0.06] pt-3">
      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1.5">
        <History className="w-3 h-3" /> Conversaciones
      </p>
      {loading ? (
        <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-white/40">
          <Loader2 className="w-3 h-3 animate-spin" /> Cargando…
        </div>
      ) : threads.length === 0 ? (
        <p className="px-1 py-1 text-[10px] text-white/30">Aún no hay conversaciones guardadas.</p>
      ) : (
        <div className="space-y-0.5 max-h-72 overflow-y-auto peyu-scrollbar-light">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                activeId === t.id
                  ? 'bg-blue-500/15 border border-blue-500/25'
                  : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.06]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-white/35" />
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-semibold text-white/80 truncate">{title(t)}</span>
                <span className="block text-[9px] text-white/30">
                  {new Date(t.updated_date || t.created_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
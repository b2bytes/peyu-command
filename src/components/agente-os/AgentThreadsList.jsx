import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Trash2, Loader2 } from 'lucide-react';

// Lista de hilos guardados del Agent OS, filtrados por el admin que los usó.
// Click → retoma la conversación. Basurero → elimina el hilo.
export default function AgentThreadsList({ userEmail, activeId, refreshKey, onSelect, compact = false }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.AgentOSConversation
      .filter({ user_email: userEmail }, '-updated_date', 25)
      .then((t) => { setThreads(t || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userEmail, refreshKey]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setThreads((prev) => prev.filter((t) => t.id !== id));
    await base44.entities.AgentOSConversation.delete(id).catch(() => {});
  };

  if (!userEmail) return null;

  return (
    <div className="px-3 pb-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ld-fg-subtle px-1 mb-1.5">Hilos guardados</p>
      {loading ? (
        <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-ld-fg-muted">
          <Loader2 className="w-3 h-3 animate-spin" /> Cargando…
        </div>
      ) : threads.length === 0 ? (
        <p className="px-1 py-1 text-[11px] text-ld-fg-subtle">Aún no hay conversaciones guardadas.</p>
      ) : (
        <div className={`space-y-0.5 overflow-y-auto peyu-scrollbar ${compact ? 'max-h-56' : 'max-h-72'}`}>
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`group w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                activeId === t.id ? 'bg-ld-action-soft text-ld-fg' : 'text-ld-fg-soft hover:bg-ld-bg-elevated hover:text-ld-fg'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-ld-fg-muted" />
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold truncate">{t.titulo || 'Conversación'}</span>
                <span className="block text-[10px] text-ld-fg-subtle">
                  {t.mensajes_count || t.mensajes?.length || 0} msjs · {new Date(t.ultimo_mensaje_at || t.updated_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                </span>
              </span>
              <span
                role="button"
                onClick={(e) => handleDelete(e, t.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-ld-highlight-soft transition-opacity"
                title="Eliminar hilo"
              >
                <Trash2 className="w-3 h-3" style={{ color: 'var(--ld-highlight)' }} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
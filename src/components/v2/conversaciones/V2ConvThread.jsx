import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Building2, Mail, Phone, Hash } from 'lucide-react';

// Detalle read-only de una conversación: lee AILog por conversation_id
// (asc por created_date) y reconstruye el hilo user_message + ai_response.
export default function V2ConvThread({ cl, onClose }) {
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const logs = await base44.entities.AILog.filter(
          { conversation_id: cl.conversation_id }, 'created_date', 200
        );
        if (alive) setTurns(logs || []);
      } catch { if (alive) setTurns([]); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [cl.conversation_id]);

  return (
    <>
      <div className="v2-drawer-backdrop" onClick={onClose} />
      <div className="v2-drawer" data-side="right" style={{ width: 'min(460px, 92vw)' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--v2-border)' }}>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--v2-fg)' }}>
                {cl.empresa || cl.nombre || 'Conversación'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--v2-fg-muted)' }}>{cl.tipo} · {cl.mensajes_count || 0} mensajes</p>
            </div>
            <button onClick={onClose} className="v2-btn-ghost w-8 h-8 flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>

          {/* Datos capturados */}
          {(cl.email || cl.telefono || cl.cantidad_estimada) && (
            <div className="px-4 py-2.5 flex flex-wrap gap-3 text-[11px] flex-shrink-0" style={{ borderBottom: '1px solid var(--v2-border)', color: 'var(--v2-fg-muted)' }}>
              {cl.empresa && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {cl.empresa}</span>}
              {cl.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {cl.email}</span>}
              {cl.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cl.telefono}</span>}
              {cl.cantidad_estimada && <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {cl.cantidad_estimada} u</span>}
            </div>
          )}

          {/* Hilo */}
          <div className="flex-1 overflow-y-auto v2-scroll px-4 py-4 flex flex-col gap-3">
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--v2-teal)' }} /></div>
            ) : turns.length === 0 ? (
              <p className="text-xs text-center py-10" style={{ color: 'var(--v2-fg-subtle)' }}>Sin mensajes registrados en esta conversación.</p>
            ) : (
              turns.map((t, i) => (
                <div key={t.id || i} className="flex flex-col gap-2">
                  {t.user_message && (
                    <div className="self-end max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] whitespace-pre-wrap break-words" style={{ background: 'var(--v2-grad-gold)', color: '#2a1f2b' }}>
                      {t.user_message}
                    </div>
                  )}
                  {t.ai_response && (
                    <div className="self-start max-w-[88%] flex gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
                      <div className="rounded-2xl px-3.5 py-2.5 text-[13px] whitespace-pre-wrap break-words" style={{ background: 'var(--v2-surface)', color: 'var(--v2-fg-soft)', border: '1px solid var(--v2-border)' }}>
                        {t.ai_response}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="px-4 py-2 text-[10px] text-center flex-shrink-0" style={{ borderTop: '1px solid var(--v2-border)', color: 'var(--v2-fg-subtle)' }}>
            Vista de solo lectura · Inteligencia de negocio
          </div>
        </div>
      </div>
    </>
  );
}
// Drawer que muestra el journey cronológico completo de una sesión o usuario
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, User, Clock } from 'lucide-react';
import FunnelTimeline from '@/components/embudo/FunnelTimeline';

// Mapeo event_type → type del FunnelTimeline (reusa los iconos)
const TYPE_MAP = {
  page_view: 'note',
  product_view: 'note',
  add_to_cart: 'note',
  checkout_start: 'note',
  checkout_complete: 'paid',
  b2b_form_submit: 'created',
  b2b_proposal_view: 'proposal_viewed',
  b2b_proposal_accept: 'accepted',
  b2b_proposal_reject: 'rejected',
  tracking_view: 'note',
  giftcard_purchase: 'created',
  giftcard_redeem: 'note',
  review_submit: 'rated',
  chat_message: 'note',
  blog_view: 'note',
};

export default function SessionJourneyDrawer({ seedLog, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seedLog) return;
    setLoading(true);

    const filters = [];
    if (seedLog.user_email) filters.push({ user_email: seedLog.user_email });
    if (seedLog.session_id) filters.push({ session_id: seedLog.session_id });

    Promise.all(
      filters.map((f) => base44.entities.ActivityLog.filter(f, '-created_date', 100))
    ).then((arrs) => {
      const merged = new Map();
      arrs.flat().forEach((l) => merged.set(l.id, l));
      setLogs(Array.from(merged.values()).sort((a, b) =>
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      ));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [seedLog]);

  if (!seedLog) return null;

  const historial = logs.map((l) => ({
    at: l.created_date,
    type: TYPE_MAP[l.event_type] || 'note',
    actor: l.user_email || `sesión ${(l.session_id || '').slice(-6)}`,
    channel: l.category === 'B2B' ? 'web' : (l.category === 'Soporte' ? 'whatsapp' : 'web'),
    detail: `${l.event_type.replace(/_/g, ' ')}${l.page_path ? ` · ${l.page_path}` : ''}${l.value_clp ? ` · $${l.value_clp.toLocaleString('es-CL')}` : ''}${l.meta?.nombre ? ` · ${l.meta.nombre}` : ''}${l.meta?.company ? ` · ${l.meta.company}` : ''}`,
    meta: l.meta,
  }));

  const identityLabel = seedLog.user_email
    || `sesión anónima · ${(seedLog.session_id || '').slice(-8)}`;

  return (
    <div className="fixed inset-0 z-[80] flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-md bg-slate-900 border-l border-white/10 overflow-y-auto">
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <User className="w-4 h-4 text-teal-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-poppins font-bold text-white text-sm truncate">{identityLabel}</p>
            <p className="text-[11px] text-white/50 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {logs.length} eventos
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-center text-white/50 text-sm py-8">Cargando journey…</p>
          ) : (
            <FunnelTimeline historial={historial} emptyText="Sin más eventos para este usuario." />
          )}
        </div>
      </aside>
    </div>
  );
}
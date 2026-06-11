import { MessageCircle } from 'lucide-react';

const timeAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

// Lista de conversaciones WhatsApp del agente whatsapp_peyu.
export default function WhatsAppConvList({ conversations, activeId, onSelect }) {
  if (!conversations.length) {
    return (
      <div className="p-6 text-center text-sm text-ld-fg-muted">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Aún no hay conversaciones de WhatsApp.
        <p className="text-xs mt-1">Comparte el link de conexión para empezar.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ld-border">
      {conversations.map((c) => {
        const last = c.messages?.[c.messages.length - 1];
        const nombre = c.metadata?.name || `Conversación ${c.id?.slice(-5)}`;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={`w-full text-left px-3 py-3 flex items-start gap-2.5 transition-colors hover:bg-ld-bg-elevated ${activeId === c.id ? 'bg-ld-action-soft' : ''}`}
          >
            <span className="w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ld-fg truncate">{nombre}</span>
                <span className="text-[10px] text-ld-fg-subtle flex-shrink-0">{timeAgo(c.updated_date)}</span>
              </div>
              <p className="text-xs text-ld-fg-muted truncate mt-0.5">
                {last ? `${last.role === 'user' ? '' : '🐢 '}${(last.content || '').slice(0, 70)}` : 'Sin mensajes'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
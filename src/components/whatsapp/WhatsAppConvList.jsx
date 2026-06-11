import { useState, useMemo } from 'react';
import { MessageCircle, Search } from 'lucide-react';

const timeAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

// Avatar con inicial y color determinístico por conversación (estilo WhatsApp)
const AVATAR_COLORS = ['#128C7E', '#34B7F1', '#FF8C42', '#9C27B0', '#E91E63', '#5C6BC0'];
const avatarColor = (id = '') => AVATAR_COLORS[(id.charCodeAt(id.length - 1) || 0) % AVATAR_COLORS.length];

export default function WhatsAppConvList({ conversations, activeId, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const nombre = (c.metadata?.name || '').toLowerCase();
      const last = (c.messages?.[c.messages.length - 1]?.content || '').toLowerCase();
      return nombre.includes(q) || last.includes(q);
    });
  }, [conversations, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Buscador */}
      <div className="flex-shrink-0 p-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-ld-fg-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación…"
            className="ld-input w-full pl-9 pr-3 py-2 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-ld-fg-muted">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-[#25D366] opacity-60" />
          </div>
          <p className="font-semibold text-ld-fg-soft">{search ? 'Sin resultados' : 'Aún no hay conversaciones'}</p>
          {!search && <p className="text-xs mt-1">Escanea el QR o comparte el link para empezar.</p>}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto peyu-scrollbar">
          {filtered.map((c) => {
            const last = c.messages?.[c.messages.length - 1];
            const nombre = c.metadata?.name || `Cliente ${c.id?.slice(-5)}`;
            const isActive = activeId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors border-l-2 ${
                  isActive ? 'bg-ld-action-soft border-[#25D366]' : 'border-transparent hover:bg-ld-bg-elevated'
                }`}
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm"
                  style={{ background: avatarColor(c.id) }}
                >
                  {nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ld-fg truncate">{nombre}</span>
                    <span className="text-[10px] text-ld-fg-subtle flex-shrink-0">{timeAgo(c.updated_date)}</span>
                  </div>
                  <p className="text-xs text-ld-fg-muted truncate mt-0.5">
                    {last ? `${last.role === 'assistant' ? '🐢 ' : ''}${(last.content || '').slice(0, 70)}` : 'Sin mensajes'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Globe } from 'lucide-react';
import WebChatLeadForm from '@/components/whatsapp/WebChatLeadForm';

// Visor de la conversación COMPLETA del vendedor Peyu web (todos los mensajes
// del visitante y del agente), abierto desde el pipeline de chat web.
export default function WebChatThreadModal({ lead: leadProp, onClose, onSaved }) {
  const [lead, setLead] = useState(leadProp);
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await base44.functions
        .invoke('getChatConversation', { conversation_id: lead.conversation_id })
        .catch(() => null);
      setMessages(r?.data?.messages || []);
    })();
  }, [lead.conversation_id]);

  const limpiar = (t) => String(t || '')
    .replace(/\[\[[^\]]*\]\]/g, '')
    .replace(/\[CONTEXTO\][^\n]*/g, '')
    .replace(/\[CATALOGO\][\s\S]*$/g, '')
    .trim();

  const nombre = lead.nombre || lead.empresa || 'Visitante de la tienda';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--ld-bg)', border: '1px solid var(--ld-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-ld-border">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,.15)' }}>
            <Globe className="w-4 h-4" style={{ color: '#8B5CF6' }} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ld-fg truncate">{nombre}</p>
            <p className="text-[10px] text-ld-fg-muted truncate">
              Chat de la tienda · {lead.page_origen || 'origen desconocido'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ld-fg-muted hover:bg-ld-bg-soft">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-b border-ld-border" style={{ background: 'var(--ld-bg-soft)' }}>
          <WebChatLeadForm lead={lead} onSaved={(l) => { setLead(l); onSaved?.(l); }} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 peyu-scrollbar">
          {messages === null && (
            <div className="flex items-center justify-center gap-2 py-10 text-ld-fg-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando conversación…
            </div>
          )}
          {messages?.length === 0 && (
            <p className="text-center text-xs text-ld-fg-muted py-10">Esta conversación ya no tiene mensajes guardados.</p>
          )}
          {(messages || []).map((m, i) => {
            const txt = limpiar(m.content);
            if (!txt) return null;
            const mio = m.role === 'assistant';
            return (
              <div key={i} className={`flex ${mio ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed whitespace-pre-wrap"
                  style={mio
                    ? { background: 'var(--ld-bg-soft)', color: 'var(--ld-fg)', border: '1px solid var(--ld-border)' }
                    : { background: 'var(--ld-action)', color: '#fff' }}
                >
                  {txt}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
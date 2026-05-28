// ============================================================================
// ConversationThread · Muestra la conversación COMPLETA de un AILog
// ----------------------------------------------------------------------------
// Hace fetch a getChatConversation (admin only) y renderiza todos los turnos
// usuario/agente con burbujas estilo chat. Esto es lo que faltaba en el
// drawer de auditoría: ver QUÉ escribió el cliente y QUÉ respondió la IA.
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MessageCircle, Bot, User, AlertCircle } from 'lucide-react';

function cleanUserText(content) {
  if (!content) return '';
  let m = String(content);
  // Quitar prefijo [CONTEXTO] page=/... top_skus="..." que envía el frontend
  m = m.replace(/^\[CONTEXTO\][^\n]*/g, '').trim();
  return m || '(solo contexto técnico — el usuario no envió mensaje)';
}

export default function ConversationThread({ conversationId }) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('getChatConversation', { conversation_id: conversationId });
        if (!alive) return;
        if (res?.data?.messages) {
          setMessages(res.data.messages);
        } else if (res?.data?.error) {
          setError(res.data.error);
        }
      } catch (e) {
        if (alive) setError(e?.message || 'Error al cargar conversación');
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [conversationId]);

  if (!conversationId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-ld-fg-muted text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando conversación completa…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>No se pudo cargar la conversación: {error}</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-6 text-ld-fg-muted text-xs">
        <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
        Esta conversación aún no tiene mensajes registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto peyu-scrollbar pr-1">
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user';
        const text = isUser ? cleanUserText(msg.content) : (msg.content || '(sin respuesta)');
        return (
          <div key={i} className={`flex gap-2 ${isUser ? '' : 'flex-row-reverse'}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white"
              style={isUser ? { background: 'var(--ld-fg-muted)' } : { background: 'var(--ld-grad-action)' }}
            >
              {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              style={isUser
                ? { background: 'var(--ld-bg-soft)', color: 'var(--ld-fg)', border: '1px solid var(--ld-border)', borderTopLeftRadius: '4px' }
                : { background: 'var(--ld-action-soft)', color: 'var(--ld-fg)', border: '1px solid var(--ld-border)', borderTopRightRadius: '4px' }
              }
            >
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: isUser ? 'var(--ld-fg-muted)' : 'var(--ld-action)' }}>
                {isUser ? 'Cliente' : 'Peyu (IA)'}
              </div>
              {text}
            </div>
          </div>
        );
      })}
    </div>
  );
}
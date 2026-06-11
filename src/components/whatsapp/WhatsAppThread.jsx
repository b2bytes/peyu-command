import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2 } from 'lucide-react';

const msgTime = (d) => d ? new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';

// Hilo de una conversación WhatsApp con suscripción en tiempo real.
// El founder puede intervenir escribiendo en la conversación.
export default function WhatsAppThread({ conversation }) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(conversation.messages || []);
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsubscribe;
  }, [conversation.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: `[Mensaje del equipo PEYU] ${text}`,
    });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mensajes — fondo con patrón sutil estilo WhatsApp */}
      <div
        className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-5 py-4 space-y-1.5"
        style={{
          background: 'var(--ld-bg-soft)',
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--ld-border) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      >
        {messages.filter((m) => m.content).map((m, i) => {
          const isAgent = m.role === 'assistant';
          const isTeam = m.role === 'user' && (m.content || '').startsWith('[Mensaje del equipo PEYU]');
          const mine = isAgent || isTeam;
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`relative max-w-[85%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  mine ? 'rounded-br-md' : 'ld-card rounded-bl-md'
                }`}
                style={mine ? {
                  background: isAgent ? 'rgba(37, 211, 102, 0.16)' : 'var(--ld-action-soft)',
                  border: `1px solid ${isAgent ? 'rgba(37, 211, 102, 0.25)' : 'var(--ld-border)'}`,
                } : undefined}
              >
                {isAgent && <p className="text-[9px] font-bold text-[#1DA851] mb-0.5">🐢 Agente Peyu</p>}
                {isTeam && <p className="text-[9px] font-bold text-ld-action mb-0.5">👤 Equipo PEYU</p>}
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-inherit">
                  {isTeam ? m.content.replace('[Mensaje del equipo PEYU] ', '') : m.content}
                </ReactMarkdown>
                {(m.created_date || m.timestamp) && (
                  <span className="block text-right text-[9px] text-ld-fg-subtle mt-0.5 -mb-0.5">
                    {msgTime(m.created_date || m.timestamp)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer del equipo */}
      <div className="flex-shrink-0 p-2.5 sm:p-3 border-t border-ld-border bg-ld-bg flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Intervenir como equipo PEYU…"
          className="ld-input flex-1 !rounded-2xl px-4 py-2.5 text-sm resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:brightness-105 transition-all shadow-md"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          aria-label="Enviar"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2 } from 'lucide-react';

// Hilo de una conversación WhatsApp con suscripción en tiempo real.
// El founder puede intervenir escribiendo en la conversación (el agente
// responde con el contexto completo, incluido lo que escribió el founder).
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
      {/* Mensajes — estilo WhatsApp */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar px-3 sm:px-4 py-4 space-y-2" style={{ background: 'var(--ld-bg-soft)' }}>
        {messages.filter((m) => m.content).map((m, i) => {
          const isAgent = m.role === 'assistant';
          const isTeam = m.role === 'user' && (m.content || '').startsWith('[Mensaje del equipo PEYU]');
          return (
            <div key={i} className={`flex ${isAgent || isTeam ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                isAgent ? 'bg-[#25D366]/15 text-ld-fg rounded-tr-md'
                : isTeam ? 'bg-ld-action-soft text-ld-fg rounded-tr-md'
                : 'ld-card text-ld-fg rounded-tl-md'
              }`}>
                {isAgent && <p className="text-[9px] font-bold text-[#25D366] mb-0.5">🐢 Agente Peyu</p>}
                {isTeam && <p className="text-[9px] font-bold text-ld-action mb-0.5">👤 Equipo PEYU</p>}
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-inherit">
                  {isTeam ? m.content.replace('[Mensaje del equipo PEYU] ', '') : m.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer del equipo */}
      <div className="flex-shrink-0 p-2.5 border-t border-ld-border bg-ld-bg flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Intervenir como equipo PEYU…"
          className="ld-input flex-1 !rounded-2xl px-3.5 py-2 text-sm resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:brightness-105 transition-all"
          aria-label="Enviar"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
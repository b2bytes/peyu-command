import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User, AlertTriangle } from 'lucide-react';
import HumanTakeoverBar from '@/components/whatsapp/HumanTakeoverBar';

const msgTime = (d) => d ? new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';

// ════════════════════════════════════════════════════════════════════════
// WhatsAppThread — Hilo de una conversación WhatsApp real.
// Las conversaciones viven en el agente (service role), así que el hilo se
// lee y se escribe por backend: whatsappInbox (leer / takeover) y
// whatsappEvolutionSend (enviar el mensaje al WhatsApp del cliente).
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppThread({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [conv, setConv] = useState(conversation);
  const bottomRef = useRef(null);

  const refresh = useCallback(async () => {
    const r = await base44.functions.invoke('whatsappInbox', { action: 'get', conversation_id: conversation.id }).catch(() => null);
    const full = r?.data?.conversation;
    if (full) {
      setMessages(full.messages || []);
      setConv(full);
    }
  }, [conversation.id]);

  useEffect(() => {
    setMessages(conversation.messages || []);
    setConv(conversation);
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [conversation.id, conversation.messages, refresh]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const humanMode = conv?.metadata?.human_takeover === true;
  const telefono = conv?.metadata?.phone || '';

  const setTakeover = async (tomar) => {
    const r = await base44.functions.invoke('whatsappInbox', {
      action: 'takeover', conversation_id: conv.id, human_takeover: tomar,
    }).catch(() => null);
    const updated = r?.data?.conversation;
    if (updated) {
      setConv((p) => ({ ...p, metadata: { ...p.metadata, ...updated.metadata } }));
      onConversationUpdate?.({ ...conv, metadata: { ...conv.metadata, ...updated.metadata } });
    }
  };

  // El mensaje del equipo sale al WhatsApp REAL del cliente y queda en el hilo.
  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await base44.functions.invoke('whatsappEvolutionSend', {
        conversation_id: conv.id, telefono, texto: text,
      });
      if (r?.data?.ok === false) throw new Error(r.data.error || 'No se pudo enviar');
      setInput('');
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'No se pudo enviar el mensaje.');
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <HumanTakeoverBar conversation={conv} onTakeover={() => setTakeover(true)} onResume={() => setTakeover(false)} />

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
          const isTeam = isAgent && /^(👤 \[Equipo PEYU\]|_\()/.test(m.content || '');
          const isTeamIntervention = m.role === 'user' && (m.content || '').startsWith('[Mensaje del equipo PEYU]');
          const mine = isAgent || isTeamIntervention;
          const limpio = (m.content || '')
            .replace('👤 [Equipo PEYU] ', '')
            .replace('[Mensaje del equipo PEYU] ', '');
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`relative max-w-[88%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  mine ? 'rounded-br-md' : 'ld-card rounded-bl-md'
                }`}
                style={mine ? {
                  background: isTeam || isTeamIntervention ? 'var(--ld-action-soft)' : 'rgba(37, 211, 102, 0.16)',
                  border: `1px solid ${isTeam || isTeamIntervention ? 'var(--ld-border)' : 'rgba(37, 211, 102, 0.25)'}`,
                } : undefined}
              >
                {isAgent && !isTeam && <p className="text-[9px] font-bold text-[#1DA851] mb-0.5 flex items-center gap-1"><Bot className="w-2.5 h-2.5" /> Agente Peyu</p>}
                {(isTeam || isTeamIntervention) && <p className="text-[9px] font-bold text-ld-action mb-0.5 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Equipo PEYU</p>}
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-inherit">
                  {limpio}
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

      {error && (
        <div className="flex-shrink-0 flex items-start gap-2 px-3 py-2 text-[11px] text-red-600 bg-red-50 dark:bg-red-950/30 border-t border-ld-border">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Composer del equipo — sale al WhatsApp real del cliente */}
      <div className="flex-shrink-0 p-2.5 sm:p-3 pb-safe border-t border-ld-border bg-ld-bg flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={humanMode ? 'Escribe al cliente (tú tienes el control)…' : 'Escribir al cliente por WhatsApp…'}
          className="ld-input flex-1 !rounded-2xl px-4 py-2.5 text-sm resize-none"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:brightness-105 transition-all shadow-md"
          style={{ background: humanMode ? '#D96B4D' : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          aria-label="Enviar"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
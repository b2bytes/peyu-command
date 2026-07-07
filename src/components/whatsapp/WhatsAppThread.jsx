import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User } from 'lucide-react';
import HumanTakeoverBar from '@/components/whatsapp/HumanTakeoverBar';

const msgTime = (d) => d ? new Date(d).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '';

// ════════════════════════════════════════════════════════════════════════
// WhatsAppThread — Hilo de una conversación WhatsApp con suscripción en
// tiempo real. Pipeline agéntico-humano: el founder puede tomar el control
// (pausar agente), responder directo al cliente, y devolver al agente.
// ════════════════════════════════════════════════════════════════════════
export default function WhatsAppThread({ conversation, onConversationUpdate }) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conv, setConv] = useState(conversation);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(conversation.messages || []);
    setConv(conversation);
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      if (data.metadata) setConv((p) => ({ ...p, metadata: { ...p.metadata, ...data.metadata } }));
    });
    return unsubscribe;
  }, [conversation.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const humanMode = conv?.metadata?.human_takeover === true;

  // Tomar el control: marca la conversación como humana. El agente no responde.
  const takeover = async () => {
    try {
      const updated = await base44.agents.updateConversation(conv.id, {
        metadata: { ...conv.metadata, human_takeover: true },
      });
      setConv(updated);
      onConversationUpdate?.(updated);
    } catch { /* noop */ }
  };

  // Devolver al agente: quita el flag de takeover y envía un mensaje al agente
  // para que retome el contexto de la conversación.
  const resume = async () => {
    try {
      const updated = await base44.agents.updateConversation(conv.id, {
        metadata: { ...conv.metadata, human_takeover: false, escalated: false },
      });
      setConv(updated);
      onConversationUpdate?.(updated);
      // Avisa al agente que el humano terminó — el agente retoma con contexto
      await base44.agents.addMessage(updated, {
        role: 'user',
        content: '[El equipo PEYU tomó el control y ahora te lo devuelve al agente. Continúa la conversación donde quedó.]',
      });
    } catch { /* noop */ }
  };

  // Enviar mensaje: en modo humano, va como assistant (directo al cliente, sin
  // disparar respuesta del agente). En modo agente, va como user con prefijo
  // [Mensaje del equipo PEYU] y el agente responde.
  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    if (humanMode) {
      // Mensaje directo al cliente: role assistant con prefijo del equipo
      await base44.agents.addMessage(conv, {
        role: 'assistant',
        content: `👤 [Equipo PEYU] ${text}`,
      });
    } else {
      // Intervención dentro del modo agente: el agente procesa y responde
      await base44.agents.addMessage(conv, {
        role: 'user',
        content: `[Mensaje del equipo PEYU] ${text}`,
      });
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Barra de takeover agéntico-humano */}
      <HumanTakeoverBar conversation={conv} onTakeover={takeover} onResume={resume} />

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
          const isTeam = m.role === 'assistant' && (m.content || '').startsWith('👤 [Equipo PEYU]');
          const isTeamIntervention = m.role === 'user' && (m.content || '').startsWith('[Mensaje del equipo PEYU]');
          const mine = isAgent || isTeamIntervention;
          return (
            <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`relative max-w-[85%] sm:max-w-[68%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                  mine ? 'rounded-br-md' : 'ld-card rounded-bl-md'
                }`}
                style={mine ? {
                  background: isTeam ? 'var(--ld-action-soft)' : isTeamIntervention ? 'var(--ld-action-soft)' : 'rgba(37, 211, 102, 0.16)',
                  border: `1px solid ${isTeam || isTeamIntervention ? 'var(--ld-border)' : 'rgba(37, 211, 102, 0.25)'}`,
                } : undefined}
              >
                {isAgent && !isTeam && <p className="text-[9px] font-bold text-[#1DA851] mb-0.5 flex items-center gap-1"><Bot className="w-2.5 h-2.5" /> Agente Peyu</p>}
                {isTeam && <p className="text-[9px] font-bold text-ld-action mb-0.5 flex items-center gap-1"><User className="w-2.5 h-2.5" /> Equipo PEYU</p>}
                {isTeamIntervention && <p className="text-[9px] font-bold text-ld-action mb-0.5">👤 Equipo PEYU</p>}
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-inherit">
                  {isTeam ? m.content.replace('👤 [Equipo PEYU] ', '') : isTeamIntervention ? m.content.replace('[Mensaje del equipo PEYU] ', '') : m.content}
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
          placeholder={humanMode ? 'Escribe directo al cliente…' : 'Intervenir como equipo PEYU…'}
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
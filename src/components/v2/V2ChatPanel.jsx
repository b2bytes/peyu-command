import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send } from 'lucide-react';

// Panel conversacional Peyu IA para /v2. Reusa publicChatProxy (sin auth).
// Aislado: maneja su propia conversación, no comparte estado con la home.
export default function V2ChatPanel({ open, seedMessage, onClose }) {
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const seededRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && seedMessage && seededRef.current !== seedMessage) {
      seededRef.current = seedMessage;
      send(seedMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seedMessage]);

  const stripContext = (m) => m;

  const send = async (val) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);
    setMessages((p) => [...p, { role: 'user', content: text }]);

    try {
      let id = convId;
      if (!id) {
        const cr = await base44.functions.invoke('publicChatProxy', {
          action: 'create', context: 'v2', page_path: '/v2',
        });
        id = cr.data?.conversation_id;
        setConvId(id);
      }
      await base44.functions.invoke('publicChatProxy', {
        action: 'send', conversation_id: id, content: text, page_path: '/v2',
      });

      const intervals = [600, 800, 1000, 1200, 1500, 2000, 2000, 2500, 3000, 3000, 3000];
      let attempt = 0;
      const poll = async () => {
        try {
          const res = await base44.functions.invoke('publicChatProxy', { action: 'get', conversation_id: id });
          const msgs = (res.data?.messages || []).filter((m) => m.content).map(stripContext);
          let answered = false;
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') break;
            if (msgs[i].role === 'assistant' && msgs[i].content?.trim()) { answered = true; break; }
          }
          if (msgs.length) setMessages(msgs);
          if (answered) { setLoading(false); return; }
        } catch { /* continúa */ }
        attempt++;
        if (attempt < intervals.length) setTimeout(poll, intervals[attempt]);
        else {
          setLoading(false);
          setMessages((p) => [...p, { role: 'assistant', content: 'Estoy lento ahora 🐢. Escríbenos por WhatsApp y te ayudamos al toque: https://wa.me/56935040242' }]);
        }
      };
      setTimeout(poll, 600);
    } catch {
      setLoading(false);
      setMessages((p) => [...p, { role: 'assistant', content: 'Ups, tuve un problema 🐢. Intenta de nuevo en un momento.' }]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="v2-glass relative w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 p-3" style={{ borderBottom: '1px solid var(--v2-border)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--v2-fg)' }}>Peyu IA</p>
            <p className="text-[10px]" style={{ color: 'var(--v2-fg-muted)' }}>Asistente de regalos · en línea</p>
          </div>
          <button onClick={onClose} className="v2-btn-ghost w-8 h-8 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto v2-scroll p-3 flex flex-col gap-2">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-center mt-8" style={{ color: 'var(--v2-fg-muted)' }}>
              Cuéntame qué buscas y te muestro opciones 🐢
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="rounded-2xl px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap break-words"
                style={m.role === 'user'
                  ? { background: 'var(--v2-grad-action)', color: '#fff' }
                  : { background: 'var(--v2-surface-2)', color: 'var(--v2-fg-soft)' }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-3.5 py-3 flex gap-1" style={{ background: 'var(--v2-surface-2)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)', animationDelay: '.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)', animationDelay: '.4s' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-3" style={{ borderTop: '1px solid var(--v2-border)' }}>
          <div className="v2-input flex items-center gap-2 pl-4 pr-1.5 py-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
              placeholder="Escribe a Peyu…"
              className="flex-1 bg-transparent border-0 outline-none text-sm h-9"
              style={{ color: 'var(--v2-fg)' }}
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} className="v2-btn-primary w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
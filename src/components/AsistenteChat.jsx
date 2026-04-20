import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, History } from 'lucide-react';
import ChatProductContentLight from '@/components/chat/ChatMessageContentLight';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { ensureFreshSession, addToHistory } from '@/lib/chat-history';

const STORAGE_KEY = 'peyu_chat_conversation_id';
const OPEN_KEY = 'peyu_chat_open';
const AGENT_NAV_KEY = 'peyu_chat_agent_navigated_at';
// Cuando el AGENTE navega (vía tool_call o por instrucción en chat), seteamos este
// timestamp. Si el usuario entra a la página dentro de los próximos 8s, asumimos
// que la navegación la disparó el agente y mantenemos el chat abierto.
const AGENT_NAV_WINDOW_MS = 8000;

export default function AsistenteChat() {
  const location = useLocation();
  // Al montar por primera vez en una sesión nueva (pestaña reabierta), archivamos
  // la conversación activa al historial para arrancar limpio. Si el usuario quiere
  // seguir la conversación anterior, la reabre desde el panel de historial.
  const [freshSession] = useState(() => ensureFreshSession());
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) === '1');
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);
  const firstMountRef = useRef(true);

  // Do NOT render on landing — landing page has its own embedded chat UI
  const path = location.pathname;
  const isLanding = path === '/';
  const isPublicPage = (
    path.startsWith('/shop') ||
    path.startsWith('/producto') ||
    path.startsWith('/b2b') ||
    path.startsWith('/cart') ||
    path.startsWith('/catalogo-visual') ||
    path.startsWith('/nosotros') ||
    path.startsWith('/soporte') ||
    path.startsWith('/seguimiento') ||
    path.startsWith('/personalizar')
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(OPEN_KEY, open ? '1' : '0');
  }, [open]);

  // Lógica de apertura al navegar:
  // - Primer montaje: respeta lo que el usuario dejó guardado (OPEN_KEY).
  // - Navegación posterior:
  //     · Si el AGENTE acaba de navegar (timestamp reciente en AGENT_NAV_KEY),
  //       mantenemos el chat ABIERTO para que el usuario vea la conversación.
  //     · Si el USUARIO navegó por su cuenta, CONTRAEMOS el chat (FAB visible).
  useEffect(() => {
    if (isLanding) return;
    if (firstMountRef.current) {
      firstMountRef.current = false;
      return;
    }
    const navTs = parseInt(localStorage.getItem(AGENT_NAV_KEY) || '0', 10);
    const agentJustNavigated = navTs && (Date.now() - navTs) < AGENT_NAV_WINDOW_MS;
    if (agentJustNavigated) {
      setOpen(true);
      localStorage.removeItem(AGENT_NAV_KEY);
    } else {
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isLanding]);

  // Load existing conversation (if any) from persisted id when mounting on a new page.
  // Si es una sesión fresca (pestaña reabierta), ensureFreshSession ya archivó la
  // conversación anterior y limpió el active id → arrancamos vacíos por diseño.
  useEffect(() => {
    if (!conversationId || isLanding || freshSession) return;
    let alive = true;
    (async () => {
      try {
        const conv = await base44.agents.getConversation(conversationId);
        if (alive && conv?.messages) setMessages(conv.messages.filter(m => m.content));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      }
    })();
    return () => { alive = false; };
  }, [conversationId, isLanding, freshSession]);

  // Subscribe to live updates while a conversation exists
  useEffect(() => {
    if (!conversationId) return;
    try {
      unsubRef.current = base44.agents.subscribeToConversation(conversationId, (data) => {
        const msgs = (data.messages || []).filter(m => m.content);
        setMessages(msgs);
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') setLoading(false);
      });
    } catch (e) { /* no-op */ }
    return () => { unsubRef.current?.(); };
  }, [conversationId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Detectar cantidad para precargar cotizador B2B desde tarjetas
    const qtyMatch = text.match(/\b(\d{2,5})\b\s*(u\.?|unidades|pcs|piezas|regalos)?/i);
    if (qtyMatch) {
      const n = parseInt(qtyMatch[1], 10);
      if (n >= 10 && n <= 10000) localStorage.setItem('peyu_chat_last_qty', String(n));
    }

    try {
      let convId = conversationId;
      let conv;
      if (!convId) {
        conv = await base44.agents.createConversation({
          agent_name: 'asistente_compras',
          metadata: { context: 'floating' },
        });
        convId = conv.id;
        localStorage.setItem(STORAGE_KEY, convId);
        setConversationId(convId);
      } else {
        conv = await base44.agents.getConversation(convId);
      }
      await base44.agents.addMessage(conv, { role: 'user', content: text });
      // Registrar/actualizar esta conversación en el historial (título = primer mensaje del user)
      addToHistory(convId, text);
    } catch (e) {
      console.error('Error enviando mensaje:', e);
      setLoading(false);
    }
  }, [input, loading, conversationId]);

  // Reabrir una conversación del historial
  const handleResume = useCallback(async (id) => {
    setShowHistory(false);
    localStorage.setItem(STORAGE_KEY, id);
    setConversationId(id);
    try {
      const conv = await base44.agents.getConversation(id);
      if (conv?.messages) setMessages(conv.messages.filter(m => m.content));
    } catch {
      // si falla, limpiamos
      localStorage.removeItem(STORAGE_KEY);
      setConversationId(null);
      setMessages([]);
    }
  }, []);

  // Empezar un nuevo chat (archiva el actual al historial)
  const handleNewChat = useCallback(() => {
    const currentId = conversationId;
    if (currentId) {
      const firstUser = messages.find(m => m.role === 'user')?.content || '';
      addToHistory(currentId, firstUser);
    }
    localStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  }, [conversationId, messages]);

  const handleOpen = () => setOpen(true);

  if (isLanding || !isPublicPage) return null;

  const hasHistory = messages.length > 0;

  return (
    <>
      {/* FAB Button — posicionado encima del botón de WhatsApp */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center text-white group hover:scale-110"
          aria-label="Abrir chat con Peyu"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform">🐢</span>
          {hasHistory && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4 flex items-center justify-between flex-shrink-0 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">🐢</div>
              <div>
                <h3 className="font-bold text-sm">Peyu · PEYU Chile</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  En línea · sigue tu conversación
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(v => !v)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition"
                aria-label="Ver historial"
                title="Conversaciones anteriores"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition"
                aria-label="Minimizar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Panel de historial (overlay encima del chat) */}
          {showHistory && (
            <ChatHistoryPanel
              onResume={handleResume}
              onClose={() => setShowHistory(false)}
            />
          )}

          {/* Messages */}
          <div className="peyu-scrollbar flex-1 overflow-y-auto min-h-[320px] max-h-[60vh] space-y-3 p-4 bg-gradient-to-b from-gray-50 to-white flex flex-col">
            {messages.length === 0 && !loading && (
              <div className="text-center text-gray-500 text-xs py-8 space-y-3">
                <p className="text-sm font-medium">👋 ¡Hola! Soy Peyu</p>
                <p>Tu asistente de gifting sostenible. Cuéntame qué necesitas.</p>
                {typeof window !== 'undefined' && (() => {
                  try {
                    const raw = localStorage.getItem('peyu_chat_history');
                    const hist = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(hist) && hist.length > 0) {
                      return (
                        <button
                          onClick={() => setShowHistory(true)}
                          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-[11px] font-semibold transition"
                        >
                          <History className="w-3 h-3" /> Retomar conversación anterior ({hist.length})
                        </button>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-br-none max-w-[75%]'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none max-w-[90%] w-full'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? <ChatProductContentLight content={msg.content} />
                    : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2 flex-shrink-0 bg-white">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder="Escribe tu consulta..."
              className="text-sm rounded-xl border-gray-200 focus-visible:ring-teal-500"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="sm"
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
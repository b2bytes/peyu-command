import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, History, Sparkles, Gift, Building2, Leaf } from 'lucide-react';
import ChatProductContentLight from '@/components/chat/ChatMessageContentLight';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { ensureFreshSession, addToHistory } from '@/lib/chat-history';
import { withContext } from '@/lib/chat-context';

// Clave PROPIA del chat flotante autenticado (NO compartir con la landing pública,
// que usa publicChatProxy y puede crear conversaciones bajo otro user → "Access denied").
const STORAGE_KEY = 'peyu_chat_conversation_id_auth';
const OPEN_KEY = 'peyu_chat_open';
const AGENT_NAV_KEY = 'peyu_chat_agent_navigated_at';
// Cuando el AGENTE navega (vía tool_call o por instrucción en chat), seteamos este
// timestamp. Si el usuario entra a la página dentro de los próximos 8s, asumimos
// que la navegación la disparó el agente y mantenemos el chat abierto.
const AGENT_NAV_WINDOW_MS = 8000;

// Limpia el bloque [CONTEXTO] que se inyecta al agente — no debe verse en la UI.
const stripContext = (m) => {
  if (!m || m.role !== 'user' || !m.content) return m;
  const cleaned = m.content.replace(/^\[CONTEXTO\][^\n]*\n+/, '').trim();
  return { ...m, content: cleaned };
};

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
  // Checkout pages: ocultamos los floats para no competir con el CTA principal
  // (best practice Amazon/Shopify — ningún elemento debe distraer del "Pagar").
  const isCheckout = path.startsWith('/cart') || path.startsWith('/gracias');
  const isPublicPage = !isCheckout && (
    path.startsWith('/shop') ||
    path.startsWith('/producto') ||
    path.startsWith('/b2b') ||
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

  // Load existing conversation (if any) from persisted id when mounting.
  // Siempre cargamos el hilo previo — el chat persiste entre visitas/pestañas
  // para que el usuario retome su conversación con Peyu donde la dejó.
  useEffect(() => {
    if (!conversationId || isLanding) return;
    let alive = true;
    (async () => {
      try {
        const conv = await base44.agents.getConversation(conversationId);
        if (alive && conv?.messages) setMessages(conv.messages.filter(m => m.content).map(stripContext));
      } catch (e) {
        // Conversación inválida o pertenece a otro usuario → limpiar silenciosamente.
        localStorage.removeItem(STORAGE_KEY);
        if (alive) {
          setConversationId(null);
          setMessages([]);
        }
      }
    })();
    return () => { alive = false; };
  }, [conversationId, isLanding, freshSession]);

  // Subscribe to live updates while a conversation exists
  useEffect(() => {
    if (!conversationId) return;
    try {
      unsubRef.current = base44.agents.subscribeToConversation(
        conversationId,
        (data) => {
          const msgs = (data.messages || []).filter(m => m.content).map(stripContext);
          setMessages(msgs);
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant') setLoading(false);
        },
        (err) => {
          // Si la suscripción falla por permiso, limpiamos la conv inválida.
          if (err?.message?.includes('Access denied')) {
            localStorage.removeItem(STORAGE_KEY);
            setConversationId(null);
            setMessages([]);
          }
        }
      );
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
      // Inyectamos el contexto de página (producto visto, carrito, ruta) al mensaje
      // que recibe el agente. El usuario sigue viendo solo su texto en la UI.
      const contextualized = await withContext(text);
      await base44.agents.addMessage(conv, { role: 'user', content: contextualized });
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
    try {
      // Validamos PRIMERO que la conv sea accesible para este user antes de persistirla.
      const conv = await base44.agents.getConversation(id);
      localStorage.setItem(STORAGE_KEY, id);
      setConversationId(id);
      if (conv?.messages) setMessages(conv.messages.filter(m => m.content).map(stripContext));
    } catch {
      // Conv inaccesible (otro user o eliminada) → no la guardamos.
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
      {/* FAB Premium estilo Intercom — pill con texto + avatar.
          En mobile: pill compacto sobre el bottom nav (sin tapar contenido).
          En desktop: pill expandido para invitar al diálogo. */}
      {!open && (
        <div
          className="fixed right-4 sm:right-6 z-40"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
        >
          <button
            onClick={handleOpen}
            className="group relative flex items-center gap-2.5 pl-2 pr-4 py-2 bg-white rounded-full shadow-[0_8px_32px_-8px_rgba(15,139,108,0.4)] hover:shadow-[0_12px_40px_-8px_rgba(15,139,108,0.5)] border border-teal-100/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
            aria-label="Abrir chat con Peyu"
          >
            {/* Avatar circular con gradiente firma */}
            <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-lg shadow-inner">
              🐢
              {/* Status dot vivo */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
            </span>
            {/* Copy comercial */}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1">
                {hasHistory ? 'Sigue tu chat' : 'Habla con Peyu'}
                <Sparkles className="w-3 h-3 text-amber-500" />
              </span>
              <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {hasHistory ? `${messages.filter(m => m.role === 'assistant').length} mensajes` : 'Te respondo al toque'}
              </span>
            </span>
            {/* Badge contador (solo si historia) */}
            {hasHistory && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {messages.filter(m => m.role === 'assistant').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Chat Window — en móvil ocupa ancho completo y respeta bottom nav.
          En móvil le damos una altura mínima cómoda (60vh) y un max-h que no
          tape el bottom nav, así el chat se siente como una "ventana real"
          y no una caja pequeña. */}
      {open && (
        <div
          className="fixed right-2 sm:right-6 left-2 sm:left-auto z-50 w-auto sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)',
            height: 'min(72vh, calc(100vh - env(safe-area-inset-bottom) - 7rem))',
            maxHeight: 'calc(100vh - env(safe-area-inset-bottom) - 7rem)',
          }}
        >
          {/* Header — gradiente verde Peyu con micro-cta de confianza */}
          <div className="bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-700 text-white p-3.5 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
            {/* Decorativo */}
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2.5 relative">
              <div className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-xl ring-2 ring-white/20">
                🐢
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-teal-600 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] leading-tight">Peyu</h3>
                <p className="text-[10.5px] text-white/85 flex items-center gap-1 leading-tight mt-0.5">
                  Tu asistente de regalos sostenibles
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 relative">
              <button
                onClick={() => setShowHistory(v => !v)}
                className="text-white/90 hover:text-white hover:bg-white/15 p-1.5 rounded-lg transition"
                aria-label="Ver historial"
                title="Conversaciones anteriores"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-white/90 hover:text-white hover:bg-white/15 p-1.5 rounded-lg transition"
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
          <div className="peyu-scrollbar flex-1 overflow-y-auto space-y-3 p-3.5 bg-gradient-to-b from-gray-50 to-white flex flex-col">
            {messages.length === 0 && !loading && (
              <div className="py-3 space-y-3">
                {/* Burbuja de bienvenida tipo Peyu (orientada a venta) */}
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-sm flex-shrink-0">
                    🐢
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 max-w-[85%] shadow-sm">
                    <p className="text-[13.5px] text-gray-900 leading-relaxed">
                      Hola 🌱 Soy <b>Peyu</b>. Te ayudo a encontrar el regalo perfecto en segundos.
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1.5">¿Qué necesitas hoy?</p>
                  </div>
                </div>

                {/* Chips de venta — disparan conversación B2C / B2B / gifting */}
                <div className="grid grid-cols-1 gap-1.5 px-1 pt-1">
                  {[
                    { icon: Gift, text: 'Buscar regalo personal', q: 'Estoy buscando un regalo personal, ¿qué me recomiendas?', color: 'from-pink-500 to-rose-500' },
                    { icon: Building2, text: 'Regalos para mi empresa', q: 'Necesito regalos corporativos para mi empresa', color: 'from-blue-500 to-indigo-500' },
                    { icon: Leaf, text: '¿Por qué Peyu?', q: '¿Qué hace especial a Peyu? Cuéntame del impacto ambiental.', color: 'from-emerald-500 to-teal-500' },
                  ].map((chip, i) => {
                    const Icon = chip.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => { setInput(chip.q); setTimeout(() => sendMessage(), 50); }}
                        className="group flex items-center gap-2.5 bg-white hover:bg-gray-50 border border-gray-200 hover:border-teal-300 rounded-xl px-3 py-2 text-left transition-all shadow-sm hover:shadow"
                      >
                        <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${chip.color} flex items-center justify-center text-white flex-shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[12.5px] font-semibold text-gray-800 flex-1">{chip.text}</span>
                        <span className="text-teal-600 text-xs opacity-0 group-hover:opacity-100 transition">→</span>
                      </button>
                    );
                  })}
                </div>

                {/* Retomar conversación anterior */}
                {typeof window !== 'undefined' && (() => {
                  try {
                    const raw = localStorage.getItem('peyu_chat_history');
                    const hist = raw ? JSON.parse(raw) : [];
                    if (Array.isArray(hist) && hist.length > 0) {
                      return (
                        <button
                          onClick={() => setShowHistory(true)}
                          className="w-full inline-flex items-center justify-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-[11px] font-semibold transition"
                        >
                          <History className="w-3 h-3" /> Retomar conversación anterior ({hist.length})
                        </button>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {/* Trust signals minimales */}
                <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">⚡ Respuesta &lt;5s</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>🇨🇱 Hecho en Chile</span>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    🐢
                  </div>
                )}
                <div
                  className={`rounded-2xl text-[13.5px] leading-relaxed break-words ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-br-md px-3.5 py-2.5 max-w-[78%] shadow-sm font-medium'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md px-3.5 py-2.5 max-w-[85%] shadow-sm'
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
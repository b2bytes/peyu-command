import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, ShoppingCart, Bell, Home, Grid3x3, Building2, HelpCircle, Heart, BookOpen, Sparkles, Package, Lock } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ChatMessageContent from '@/components/chat/ChatMessageContent';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { ensureFreshSession, addToHistory, readHistory } from '@/lib/chat-history';
import { withContext } from '@/lib/chat-context';
import { closeConversation } from '@/lib/chat-brain';
import { syncShownSkusFromMessages, buildOccasionPrompt, clearShownSkus } from '@/lib/chat-recommendations';
import { History } from 'lucide-react';
import { useAppBackground, getBackgroundById, buildBackgroundImageCSS, BG_OVERLAY, THEME_OVERLAY } from '@/lib/background';
import BackgroundSwitcher from '@/components/BackgroundSwitcher';
import LiquidDualToggle from '@/components/LiquidDualToggle';
import { setLiquidPreference } from '@/lib/liquid-dual';
import CelebrationBanner from '@/components/landing/CelebrationBanner';
import FeaturedCarousel from '@/components/landing/FeaturedCarousel';
import PublicSEO from '@/components/PublicSEO';
import MobileShopLanding from '@/components/landing/mobile/MobileShopLanding';
import DesktopHeroSplit from '@/components/landing/desktop/DesktopHeroSplit';
import DesktopCategorySection from '@/components/landing/desktop/DesktopCategorySection';
import DesktopTopSellers from '@/components/landing/desktop/DesktopTopSellers';
import DesktopTrustFooter from '@/components/landing/desktop/DesktopTrustFooter';

// Limpia los bloques [CONTEXTO] y [BRAIN] que se inyectan al agente —
// no deben verse en la UI. En withContext() el mensaje real del usuario
// SIEMPRE queda al final, separado por '\n\n' del último bloque inyectado.
// Estrategia: si detectamos marcadores, devolvemos solo lo que viene
// después del último '\n\n' (= el mensaje real del usuario).
const stripContext = (m) => {
  if (!m || m.role !== 'user' || !m.content) return m;
  const hasMarkers = /\[CONTEXTO\]|\[BRAIN\]/.test(m.content);
  if (!hasMarkers) return m;
  const idx = m.content.lastIndexOf('\n\n');
  const cleaned = idx >= 0 ? m.content.slice(idx + 2).trim() : m.content;
  return { ...m, content: cleaned };
};

const OCASIONES = [
  { id: 'navidad', label: 'Navidad', icon: '🎄' },
  { id: 'patrias', label: 'Patrias', icon: '🇨🇱' },
  { id: 'anio', label: 'Año Nuevo', icon: '🎉' },
  { id: 'trabajador', label: 'Trabajador', icon: '💼' },
  { id: 'secretaria', label: 'Secretaria', icon: '💐' },
  { id: 'profesor', label: 'Profesor', icon: '📚' },
  { id: 'madre', label: 'Día Madre', icon: '❤️' },
  { id: 'padre', label: 'Día Padre', icon: '👨' },
  { id: 'bienestar', label: 'Bienestar', icon: '🌟' },
  { id: 'logros', label: 'Logros', icon: '🏆' },
];

const STORAGE_KEY = 'peyu_chat_conversation_id';
const WELCOME_MSG = {
  role: 'assistant',
  content: [
    'Hola, soy Peyu.',
    '',
    'Diseño regalos en plástico 100% reciclado, hechos en Chile, con grabado láser y garantía de 10 años.',
    '',
    '¿Buscas un regalo personal o para tu empresa?',
  ].join('\n'),
};

export default function ShopLanding() {
  // Si la pestaña es nueva (usuario cerró y volvió), archivar la conv anterior al historial.
  const [freshSession] = useState(() => {
    const fresh = ensureFreshSession();
    // Sesión nueva → resetear memoria de SKUs ya mostrados
    if (fresh) clearShownSkus();
    return fresh;
  });
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyCount, setHistoryCount] = useState(() => readHistory().length);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [bgId] = useAppBackground();
  const bg = getBackgroundById(bgId);
  const isTheme = bg.category === 'Temas';
  const messagesEndRef = useRef(null);
  const [carrito, setCarrito] = useState(() => JSON.parse(localStorage.getItem('carrito') || '[]'));

  // Forzar modo "día" por defecto en la home pública. Si el usuario ya eligió
  // un modo (day/night) lo respetamos; solo aplicamos el default si no hay preferencia.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('peyu_liquid_mode');
      if (stored !== 'day' && stored !== 'night') {
        setLiquidPreference('day');
      }
    } catch { /* noop */ }
  }, []);

  // Mantener el badge del carrito sincronizado cuando el chat agrega items
  useEffect(() => {
    const refresh = () => setCarrito(JSON.parse(localStorage.getItem('carrito') || '[]'));
    window.addEventListener('peyu:cart-added', refresh);
    window.addEventListener('peyu:cart-cleared', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('peyu:cart-added', refresh);
      window.removeEventListener('peyu:cart-cleared', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const MENU_ITEMS = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/shop', label: 'Tienda', icon: ShoppingCart },
    { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
    { href: '/personalizar', label: 'Personalizar', icon: Sparkles },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
    { href: '/nosotros', label: 'Nosotros', icon: Heart },
    { href: '/seguimiento', label: 'Seguimiento', icon: Package },
    { href: '/soporte', label: 'Soporte', icon: HelpCircle },
  ];

  useEffect(() => {
    // Scroll SOLO dentro del contenedor de mensajes del chat (no la página entera).
    // Usar scrollIntoView sin scope hace que el navegador busque el ancestro
    // scrollable más cercano y termine scrolleando el main layout al recargar
    // con conversación restaurada → el chat parecía "haber crecido".
    const end = messagesEndRef.current;
    const scroller = end?.parentElement;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    // 🧠 Sincroniza SKUs ya mostrados para que el agente rote en próximos clicks
    syncShownSkusFromMessages(messages);
  }, [messages]);

  // Recuperar conversación existente al montar SOLO si la sesión sigue viva
  // (usuario navegó a otra página y volvió). Si es sesión nueva, arrancamos limpio.
  useEffect(() => {
    if (!conversationId || freshSession) return;
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('publicChatProxy', { action: 'get', conversation_id: conversationId });
        const msgs = (res.data?.messages || []).filter(m => m.content).map(stripContext);
        if (alive && msgs.length > 0) setMessages(msgs);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setConversationId(null);
      }
    })();
    return () => { alive = false; };
  }, [freshSession, conversationId]);

  const handleResumeFromHistory = async (id) => {
    setShowHistory(false);
    localStorage.setItem(STORAGE_KEY, id);
    setConversationId(id);
    try {
      const res = await base44.functions.invoke('publicChatProxy', { action: 'get', conversation_id: id });
      const msgs = (res.data?.messages || []).filter(m => m.content).map(stripContext);
      setMessages(msgs.length > 0 ? msgs : [WELCOME_MSG]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setConversationId(null);
      setMessages([WELCOME_MSG]);
    }
  };

  // 🧠 Al cerrar la pestaña: destilar resumen de la conversación y guardarlo
  // como memoria vectorial de largo plazo (Fase 5).
  useEffect(() => {
    const handleUnload = () => {
      if (conversationId && messages.length >= 3) {
        // Fire-and-forget: el navegador puede cortar la request, pero suele llegar.
        try {
          base44.functions.invoke('summarizeAndSaveConversation', {
            conversation_id: conversationId,
            messages: messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
            last_query: messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
          });
        } catch { /* best-effort */ }
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [conversationId, messages]);

  const sendMessage = async (messageText) => {
    const text = (typeof messageText === 'string' ? messageText : input).trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // Detectar cantidad mencionada por el usuario (ej: "necesito 100 unidades")
    const qtyMatch = text.match(/\b(\d{2,5})\b\s*(u\.?|unidades|pcs|piezas|regalos)?/i);
    if (qtyMatch) {
      const n = parseInt(qtyMatch[1], 10);
      if (n >= 10 && n <= 10000) localStorage.setItem('peyu_chat_last_qty', String(n));
    }

    try {
      // Crear o recuperar conversación vía proxy público (no requiere auth)
      let convId = conversationId;
      let msgCountBefore = 0;

      // Trazabilidad 360°: enviamos session_id + page_path al proxy para
      // cruzar la conversación con el journey del visitante.
      const sessionId = (() => {
        try { return localStorage.getItem('peyu_session_id') || null; } catch { return null; }
      })();
      const pagePath = window.location.pathname;

      if (!convId) {
        const createRes = await base44.functions.invoke('publicChatProxy', {
          action: 'create',
          context: 'landing',
          session_id: sessionId,
          page_path: pagePath,
          referrer: document.referrer || null,
        });
        convId = createRes.data?.conversation_id;
        if (!convId) throw new Error('No se pudo crear la conversación');
        setConversationId(convId);
        localStorage.setItem(STORAGE_KEY, convId);
      } else {
        const getRes = await base44.functions.invoke('publicChatProxy', { action: 'get', conversation_id: convId });
        msgCountBefore = (getRes.data?.messages || []).length;
      }

      // Registrar/actualizar esta conversación en el historial con el texto del usuario
      addToHistory(convId, text);
      setHistoryCount(readHistory().length);

      // Enviar mensaje al agente con contexto de página inyectado (invisible en UI).
      // Si withContext falla (RAG, productos, etc.), enviamos el texto puro para no bloquear.
      let contextualized = text;
      try {
        contextualized = await withContext(text);
      } catch (ctxErr) {
        console.warn('withContext falló, uso texto puro:', ctxErr);
      }
      await base44.functions.invoke('publicChatProxy', {
        action: 'send',
        conversation_id: convId,
        content: contextualized,
        session_id: sessionId,
        page_path: pagePath,
      });

      // Polling: verificar cada 1.5s si llegó respuesta del agente
      let attempts = 0;
      const maxAttempts = 30; // 45 segundos máx

      const poll = async () => {
        attempts++;
        const updated = await base44.functions.invoke('publicChatProxy', { action: 'get', conversation_id: convId });
        const msgs = (updated.data?.messages || []).filter(m => m.content).map(stripContext);
        const last = msgs[msgs.length - 1];

        // Actualizar mensajes siempre (para mostrar streaming parcial si aplica)
        if (msgs.length > 0) setMessages(msgs);

        // Respuesta lista: más mensajes que antes, y el último es del asistente
        if (last?.role === 'assistant' && msgs.length > msgCountBefore + 1) {
          setLoading(false);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1500);
        } else {
          setLoading(false);
        }
      };

      setTimeout(poll, 1500);

    } catch (e) {
      console.error('Error chat:', e);
      // Fallback amigable: en lugar de leak técnico, ofrecemos WhatsApp directo.
      const waUrl = `https://wa.me/56935040242?text=${encodeURIComponent(`Hola Peyu, intenté escribirte pero falló: "${text}"`)}`;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Ups, tuve un problema para responderte 🐢. Mientras lo arreglo, [escríbenos directo por WhatsApp](${waUrl}) y un humano te ayuda al toque.`
      }]);
      setLoading(false);
    }
  };

  const handleOccasionClick = async (ocasion) => {
    // Genera un prompt inteligente: pide productos DISTINTOS si ya hubo
    // recomendaciones previas, o cambia el set si cambió la ocasión.
    const mensaje = buildOccasionPrompt(ocasion.label);
    await sendMessage(mensaje);
  };

  return (
    <>
    <PublicSEO pageKey="home" />
    {/* H1 SEO oculto visualmente pero indexable — el chat-only landing no tenía H1 semántico,
        Google necesita uno para entender el tema principal de la home. */}
    <h1 className="sr-only">
      PEYU Chile · Regalos Corporativos Sustentables en Plástico 100% Reciclado
    </h1>

    {/* ─── MOBILE: Home e-commerce agéntico ─── */}
    <div className="lg:hidden">
      <MobileShopLanding
        menuItems={MENU_ITEMS}
        cartCount={carrito.length}
        messages={messages}
        loading={loading}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        onOccasionClick={handleOccasionClick}
        historyCount={historyCount}
        onShowHistory={() => setShowHistory(true)}
        showHistory={showHistory}
        onCloseHistory={() => setShowHistory(false)}
        onResumeFromHistory={handleResumeFromHistory}
      />
    </div>

    {/* ─── DESKTOP: Liquid Dual canvas (auto día/noche) ─── */}
    <div className="landing-viewport ld-canvas hidden lg:block min-h-screen relative">
      <style>{`
        html, body { margin: 0; padding: 0; }
        @media (min-width: 1024px) {
          .landing-viewport { min-height: 100vh; min-height: 100svh; }
        }
      `}</style>
      <WhatsAppFloat />


      {/* SIDEBAR Liquid Dual */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[60] ld-glass-strong border-r border-ld-border transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarExpanded ? 'w-48 shadow-2xl' : 'w-14'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0 border-b border-ld-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/90" />
          </div>
          {sidebarExpanded && <span className="text-[10px] text-ld-fg-muted ml-auto font-bold tracking-[0.18em]">PEYU</span>}
        </div>

        <nav className="flex flex-col items-stretch gap-0.5 px-1.5 py-3 flex-1 overflow-y-auto min-h-0">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/';
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.label}
                className={`flex items-center rounded-xl transition-colors h-11 flex-shrink-0 ${
                  sidebarExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'
                } ${
                  isActive ? 'text-ld-fg' : 'text-ld-fg-muted hover:text-ld-fg'
                }`}
                style={isActive ? { background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' } : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarExpanded && <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Liquid Dual al pie del sidebar */}
        <div className={`flex-shrink-0 border-t border-ld-border p-2 flex ${sidebarExpanded ? 'justify-start px-3' : 'justify-center'}`}>
          <LiquidDualToggle compact />
        </div>

        {/* Acceso admin discreto */}
        <div className="px-1.5 pb-3 flex-shrink-0">
          <Link
            to="/admin"
            title="Acceso administrador"
            className={`flex items-center rounded-lg transition-colors h-10 text-ld-fg-subtle hover:text-ld-action ${
              sidebarExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'
            }`}
          >
            <Lock className="w-[15px] h-[15px] flex-shrink-0" />
            {sidebarExpanded && <span className="text-[11px] font-semibold whitespace-nowrap overflow-hidden">Admin</span>}
          </Link>
        </div>
      </aside>

      {/* Main content area — reserva espacio dinámico según sidebar (colapsado 56px / expandido 192px). */}
      <div className={`overflow-y-auto overflow-x-hidden peyu-scrollbar-light transition-[padding] duration-200 ease-out ${sidebarExpanded ? 'lg:pl-48' : 'lg:pl-14'}`}>

        {/* ─── ABOVE THE FOLD: Hero split + chat sticky ─── */}
        <div className="flex gap-4 p-4 relative z-10 w-full max-w-[1440px] mx-auto items-stretch lg:h-[calc(100vh-32px)] lg:max-h-[760px] lg:min-h-[600px]">
          {/* IZQUIERDA: Hero gigante (60%) */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Header bar Liquid Dual — limpio: logo + CTAs + toggle + carrito */}
            <div className="ld-glass rounded-2xl px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
              <PEYULogo size="sm" />
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to="/shop">
                  <Button className="ld-btn-primary rounded-full px-4 h-9 text-xs font-semibold">Tienda</Button>
                </Link>
                <Link to="/b2b/contacto">
                  <Button className="ld-btn-ghost rounded-full px-4 h-9 text-xs font-semibold text-ld-fg">B2B</Button>
                </Link>
                <LiquidDualToggle compact />
                <Link to="/cart">
                  <button className="relative w-10 h-10 inline-flex items-center justify-center rounded-full ld-btn-primary">
                    <ShoppingCart className="w-4 h-4" />
                    {carrito.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white ring-2"
                        style={{ background: 'var(--ld-highlight)', borderColor: 'var(--ld-bg)' }}
                      >
                        {carrito.length}
                      </span>
                    )}
                  </button>
                </Link>
              </div>
            </div>

            {/* Hero unificado — incorpora la celebración activa como strip editorial superior */}
            <div className="flex-1 min-h-0">
              <DesktopHeroSplit onOpenChat={() => document.getElementById('peyu-chat-input-desktop')?.focus()} />
            </div>
          </div>

          {/* DERECHA: Chat — mismo alto que el hero contenedor (header + hero) */}
          <div className="hidden lg:flex w-[400px] xl:w-[440px] flex-shrink-0 self-stretch">
            <div className="w-full flex">
              <div className="ld-glass rounded-2xl p-3 flex flex-col flex-1 overflow-hidden relative transition-all duration-500">
                {/* Agent header */}
                <div className="mb-2 pb-2 border-b border-ld-border flex items-center gap-2 flex-shrink-0">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base shadow-md ring-2 ring-white/20"
                      style={{ background: 'var(--ld-grad-action)' }}
                    >🐢</div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2" style={{ borderColor: 'var(--ld-bg)' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm leading-tight text-ld-fg">Peyu IA</p>
                    <p className="text-[10px] text-ld-fg-muted">Asistente de Gifting · en línea</p>
                  </div>
                  {historyCount > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="ld-btn-ghost flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0"
                    >
                      <History className="w-3 h-3" />
                      <span>{historyCount}</span>
                    </button>
                  )}
                </div>

                {showHistory && (
                  <ChatHistoryPanel onResume={handleResumeFromHistory} onClose={() => setShowHistory(false)} />
                )}

                {/* Messages */}
                <div className="peyu-scrollbar-light flex-1 overflow-y-auto overflow-x-hidden mb-2 pr-1 flex flex-col gap-2 min-h-0">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                          style={{ background: 'var(--ld-action-soft)' }}
                        >🐢</div>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-xs sm:text-sm break-words leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-sm max-w-[75%] text-white' : 'ld-glass-soft rounded-bl-sm max-w-[85%] text-ld-fg'}`}
                        style={msg.role === 'user' ? { background: 'var(--ld-grad-action)' } : undefined}
                      >
                        {msg.role === 'assistant' ? <ChatMessageContent content={msg.content} /> : msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs" style={{ background: 'var(--ld-action-soft)' }}>🐢</div>
                      <div className="ld-glass-soft rounded-xl rounded-bl-none px-3.5 py-2.5 text-ld-fg flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--ld-action)' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--ld-action)', animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--ld-action)', animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Liquid Dual */}
                <div className="ld-input flex gap-2 flex-shrink-0 items-center pl-1.5 pr-1.5 py-1.5">
                  <Input
                    id="peyu-chat-input-desktop"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                    placeholder="Escribe tu mensaje a Peyu…"
                    className="bg-transparent border-0 text-ld-fg placeholder:text-ld-fg-muted text-sm rounded-full focus:ring-0 focus-visible:ring-0 flex-1 h-11 px-4 disabled:opacity-60 shadow-none font-medium"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="ld-btn-primary rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-[18px] h-[18px]" />
                  </Button>
                </div>

                {/* Quick replies Liquid Dual */}
                <div className="flex-shrink-0 mt-2 overflow-x-auto scrollbar-hide flex gap-1 pb-0.5">
                  {OCASIONES.map(occ => (
                    <button
                      key={occ.id}
                      onClick={() => handleOccasionClick(occ)}
                      className="ld-btn-ghost flex items-center gap-1 flex-shrink-0 rounded-full px-2 py-0.5 hover:border-ld-action transition"
                    >
                      <span className="text-[10px] leading-none">{occ.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap text-ld-fg-soft">{occ.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BELOW THE FOLD: E-commerce sections ─── */}
        <div className="w-full max-w-[1440px] mx-auto">
          <DesktopCategorySection />
          <DesktopTopSellers />
          <DesktopTrustFooter />
        </div>

      </div>
    </div>
    </>
  );
}
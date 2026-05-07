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
import CelebrationBanner from '@/components/landing/CelebrationBanner';
import FeaturedCarousel from '@/components/landing/FeaturedCarousel';
import PublicSEO from '@/components/PublicSEO';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div
      className="landing-viewport transition-colors duration-500"
      data-theme-mode={isTheme ? 'theme' : 'nature'}
      style={{
        backgroundColor: bg.tint || '#0f172a',
        backgroundImage: isTheme
          ? `${THEME_OVERLAY}, url('${bg.url}')`
          : buildBackgroundImageCSS(bg.url, bg.gradient),
        backgroundSize: isTheme ? 'auto 100%, cover' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <style>{`
        /* Estabilización global del landing: sin overflow, sin espacios blancos,
           altura exacta al viewport (con fallback a svh para mobile dinámico). */
        html, body { margin: 0; padding: 0; background: #0f172a; overscroll-behavior: none; }
        .landing-viewport {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100svh;
          overflow: hidden;
          background-color: #0f172a;
        }

        /* ============================================================
           LIQUID GLASS — iOS 26 / visionOS style (2026-2027 UX trend)
           Dejamos ver MUCHO más la imagen de fondo:
           - Transparencia real (bg 6-8%)
           - Blur sutil + saturate para "vidrio líquido"
           - Doble capa de luz: highlight superior + borde refractivo
           - Inner shadow suave para profundidad
           ============================================================ */
        .peyu-liquid-glass {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.06) 100%);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.25) inset,          /* highlight superior */
            0 -1px 0 0 rgba(255,255,255,0.06) inset,         /* highlight inferior */
            0 20px 60px -20px rgba(0,0,0,0.55),              /* sombra profundidad */
            0 0 0 1px rgba(255,255,255,0.04) inset;          /* refracción */
          position: relative;
        }
        /* Brillo de luz superior (hot spot) — característico del liquid glass */
        .peyu-liquid-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%);
          pointer-events: none;
          mix-blend-mode: screen;
          opacity: 0.8;
        }

        /* Variante interior (chat) — aún más translúcida */
        .peyu-liquid-glass-inner {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%);
          backdrop-filter: blur(14px) saturate(150%);
          -webkit-backdrop-filter: blur(14px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow:
            0 1px 0 0 rgba(255,255,255,0.20) inset,
            0 10px 40px -10px rgba(0,0,0,0.45);
        }

        /* Modo temático cálido (Día del Trabajador / campañas) */
        .peyu-liquid-glass-warm {
          background:
            linear-gradient(180deg, rgba(244,162,97,0.10) 0%, rgba(120,53,15,0.06) 100%) !important;
          border-color: rgba(251,191,36,0.22) !important;
          box-shadow:
            0 1px 0 0 rgba(253,230,138,0.25) inset,
            0 10px 40px -10px rgba(0,0,0,0.45),
            0 0 40px rgba(244,162,97,0.12) !important;
        }

        /* Fallback para navegadores sin backdrop-filter (raros en 2026) */
        @supports not (backdrop-filter: blur(1px)) {
          .peyu-liquid-glass, .peyu-liquid-glass-inner {
            background: rgba(15,23,42,0.55);
          }
        }
      `}</style>
      <WhatsAppFloat />

      {/* SIDEBAR - overlay flotante (no empuja el contenido, no duplica fondo) */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[60] bg-slate-900/70 backdrop-blur-md border-r border-white/10 transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarExpanded ? 'w-48 shadow-2xl shadow-black/40' : 'w-14'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* macOS Header */}
        <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0 border-b border-white/10">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/90" />
          </div>
          {sidebarExpanded && <span className="text-[10px] text-white/50 ml-auto font-semibold tracking-wide">PEYU</span>}
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col items-stretch gap-0.5 px-1.5 py-3 flex-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/';
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.label}
                className={`flex items-center rounded-lg transition-colors h-11 ${
                  sidebarExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'
                } ${
                  isActive ? 'bg-teal-500/25 text-white ring-1 ring-teal-400/40' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarExpanded && <span className="text-xs font-medium whitespace-nowrap overflow-hidden">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Acceso admin discreto — solo para fundadores (Joaquín, Nilo, Carlos, Richard).
            El sistema validará el login y rol al entrar a /admin. */}
        <div className="px-1.5 pb-3 pt-2 border-t border-white/10 mt-auto">
          <Link
            to="/admin"
            title="Acceso administrador"
            className={`flex items-center rounded-lg transition-colors h-10 text-white/40 hover:text-teal-300 hover:bg-white/5 ${
              sidebarExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'
            }`}
          >
            <Lock className="w-[15px] h-[15px] flex-shrink-0" />
            {sidebarExpanded && <span className="text-[11px] font-medium whitespace-nowrap overflow-hidden">Admin</span>}
          </Link>
        </div>

      </aside>

      {/* Selector de fondo — flotante independiente */}
      <BackgroundSwitcher />

      {/* Main content area — reserva espacio dinámico según sidebar (colapsado 56px / expandido 192px).
          En mobile usamos altura fija (100svh) y SIN scroll vertical: el chat tiene su propio scroll interno
          para que NO se expanda infinitamente al agregar mensajes. */}
      <div className={`absolute inset-0 overflow-hidden lg:overflow-y-auto overflow-x-hidden peyu-scrollbar-light transition-[padding] duration-200 ease-out ${sidebarExpanded ? 'lg:pl-48' : 'lg:pl-14'}`}>
        {/* Main container — Liquid Glass (iOS 26 / visionOS style).
            Mobile: altura fija al viewport (100% del padre). Desktop: ancho máx 1280px. */}
        <div className="flex gap-2 sm:gap-3 lg:gap-3 p-2 sm:p-3 lg:p-3 relative z-10 flex-col lg:flex-row items-stretch h-full lg:h-full w-full lg:max-w-[1280px] lg:mx-auto">
          {/* LEFT CONTAINER - Liquid Glass · ocupa todo el alto disponible en mobile */}
          <div className="peyu-liquid-glass flex-1 rounded-2xl lg:rounded-3xl overflow-hidden flex flex-col min-w-0 min-h-0">

            {/* Header — altura reducida */}
            <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-b border-white/15 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MobileMenu items={MENU_ITEMS} />
                <PEYULogo size="sm" showText={true} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button className="hidden sm:inline-flex w-9 h-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:bg-white/35">
                  <Bell className="w-4 h-4" />
                </button>
                <Link to="/cart">
                  <button className="relative w-9 h-9 inline-flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 border border-teal-400/50 text-white transition-all active:bg-teal-700 shadow-md">
                    <ShoppingCart className="w-4 h-4" />
                    {carrito.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0f172a]/60">
                        {carrito.length}
                      </span>
                    )}
                  </button>
                </Link>
              </div>
            </div>

            {/* Barra superior unificada: celebration pill + CTAs — compacta */}
            <div className="px-3 sm:px-4 pt-2 pb-0.5 flex items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <CelebrationBanner onChatPrompt={sendMessage} compact />
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Link to="/shop">
                  <Button className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-full px-3 py-1 h-7 shadow-lg text-[10px] transition-all">
                    📮 Explorar
                  </Button>
                </Link>
                <Link to="/b2b/contacto">
                  <Button className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-gray-900 font-bold rounded-full px-3 py-1 h-7 shadow-lg text-[10px] transition-all">
                    ✨ B2B
                  </Button>
                </Link>
              </div>
            </div>

            {/* Content — flex-1 + min-h-0 hace que el chat respete la altura disponible y no se expanda */}
            <div className="flex flex-col gap-1 p-2 sm:p-2.5 flex-1 min-h-0 overflow-hidden">

              {/* Chat Agent — Liquid Glass; epicentro del landing.
                  IMPORTANTE: SIN min-h en mobile para que el flex-1 lo limite al alto disponible
                  y el scroll quede dentro del contenedor de mensajes (no en la página). */}
              <div
                className={`peyu-liquid-glass-inner rounded-xl lg:rounded-2xl p-2 sm:p-2.5 flex flex-col flex-1 min-h-0 overflow-hidden relative transition-all duration-500 ${
                  isTheme ? 'peyu-liquid-glass-warm' : ''
                }`}
              >
                {/* Glow temático sutil arriba-izquierda — solo en modo Temas */}
                {isTheme && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full opacity-40 blur-3xl"
                    style={{ backgroundColor: bg.accent || '#F4A261' }}
                  />
                )}
                
                {/* Agent Header — compacto, deja más espacio al chat */}
                <div className="mb-1.5 pb-1.5 border-b border-white/15 flex items-center gap-2 flex-shrink-0 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-sm shadow-md ring-2 ring-white/20">🐢</div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 ring-2 ring-slate-900/80" title="En línea" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xs leading-tight">Peyu</p>
                    <p className="text-white/55 text-[9px] line-clamp-1">Asistente de Gifting · en línea</p>
                  </div>
                  {historyCount > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-[9px] font-semibold transition flex-shrink-0"
                      title="Conversaciones anteriores"
                    >
                      <History className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Anteriores · {historyCount}</span>
                      <span className="sm:hidden">{historyCount}</span>
                    </button>
                  )}
                </div>

                {/* Panel de historial (overlay dentro del chat) */}
                {showHistory && (
                  <ChatHistoryPanel
                    onResume={handleResumeFromHistory}
                    onClose={() => setShowHistory(false)}
                  />
                )}

                {/* Messages Container — scroll natural; los nuevos mensajes quedan abajo vía scrollIntoView */}
                <div className="peyu-scrollbar-light flex-1 overflow-y-auto overflow-x-hidden mb-2 pr-1 flex flex-col gap-2 min-h-0">
                  {messages.length === 0 && (
                    <div className="text-center text-white/60 text-xs py-6 space-y-2">
                      <p className="text-sm font-medium">👋 Hola, soy Peyu</p>
                      <p>Tu asistente para regalos corporativos sostenibles</p>
                      <p className="text-[10px] text-white/40 mt-2">Cuéntame qué necesitas o usa los botones de ocasiones</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-xs">🐢</div>
                      )}
                      <div className={`rounded-2xl px-3.5 py-2 text-xs sm:text-sm break-words leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-sm max-w-[75%]' : 'bg-white/15 text-white border border-white/25 rounded-bl-sm backdrop-blur-sm max-w-[85%]'}`}>
                        {msg.role === 'assistant'
                          ? <ChatMessageContent content={msg.content} />
                          : msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 text-xs">🐢</div>
                      <div className="bg-white/15 border border-white/25 rounded-xl rounded-bl-none px-3.5 py-2.5 text-white flex items-center gap-2 backdrop-blur-sm">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input — protagonista del chat: alto, sólido, glow teal en focus */}
                <div className="peyu-chat-input flex gap-2 flex-shrink-0 min-w-0 items-center bg-slate-950/65 rounded-full pl-1.5 pr-1.5 py-1.5 border border-white/15 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                    placeholder="Escribe tu mensaje a Peyu…"
                    className="bg-transparent border-0 text-white placeholder:text-white/50 text-sm rounded-full focus:ring-0 focus-visible:ring-0 flex-1 h-11 px-4 disabled:opacity-60 shadow-none font-medium"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 active:from-teal-600 active:to-cyan-700 text-white rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30 transition-all disabled:opacity-50 disabled:shadow-none">
                    <Send className="w-[18px] h-[18px]" />
                  </Button>
                </div>
                <style>{`
                  .peyu-chat-input:focus-within {
                    border-color: rgba(45, 212, 191, 0.55);
                    box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.12), 0 8px 24px -8px rgba(0,0,0,0.5);
                  }
                `}</style>

                {/* Quick Replies — sin label, en una sola fila ultra-compacta */}
                <div className="flex-shrink-0 mt-1.5 overflow-x-auto scrollbar-hide flex gap-1 pb-0.5">
                  {OCASIONES.map(occ => (
                    <button
                      key={occ.id}
                      onClick={() => handleOccasionClick(occ)}
                      className="flex items-center gap-1 flex-shrink-0 bg-white/[0.06] hover:bg-teal-500/20 border border-white/10 hover:border-teal-400/40 active:bg-teal-600/30 transition-all rounded-full px-2 py-0.5"
                    >
                      <span className="text-[10px] leading-none">{occ.icon}</span>
                      <span className="text-white/75 text-[9.5px] font-medium whitespace-nowrap">{occ.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER - Product Carousel (productos REALES desde la BD) */}
          <div className="hidden lg:block flex-shrink-0 lg:w-72 xl:w-80 2xl:w-96">
            <FeaturedCarousel />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
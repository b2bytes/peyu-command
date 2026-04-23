import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PEYULogo from '@/components/PEYULogo';
import { Send, ShoppingCart, Bell, Star, ChevronLeft, ChevronRight, Home, Grid3x3, Building2, HelpCircle, Heart, BookOpen, Sparkles, Package } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ChatMessageContent from '@/components/chat/ChatMessageContent';
import ChatHistoryPanel from '@/components/chat/ChatHistoryPanel';
import { ensureFreshSession, addToHistory, readHistory } from '@/lib/chat-history';
import { withContext } from '@/lib/chat-context';
import { closeConversation } from '@/lib/chat-brain';
import { History } from 'lucide-react';
import { useAppBackground, getBackgroundById, buildBackgroundImageCSS, BG_OVERLAY, THEME_OVERLAY } from '@/lib/background';
import BackgroundSwitcher from '@/components/BackgroundSwitcher';
import CelebrationBanner from '@/components/landing/CelebrationBanner';
import SEO from '@/components/SEO';
import { buildOrganizationSchema, buildWebSiteSchema, combineSchemas } from '@/lib/schemas-peyu';

// Limpia el bloque [CONTEXTO] que se inyecta al agente — no debe verse en la UI.
const stripContext = (m) => {
  if (!m || m.role !== 'user' || !m.content) return m;
  const cleaned = m.content.replace(/^\[CONTEXTO\][^\n]*\n+/, '').trim();
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

const FEATURED_PRODUCTS = [
  { id: 1, nombre: 'Kit Escritorio Pro', precio: 30099, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg', rating: 5.0, reviews: 2400, description: 'Plástico 100% reciclado • Personalización UV • Garantía 10 años' },
  { id: 2, nombre: 'Soporte Celular Aguas', precio: 6990, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg', rating: 5.0, reviews: 1840, description: 'Plástico 100% reciclado • Múltiples colores • Garantía 10 años' },
  { id: 3, nombre: 'Soporte Notebook', precio: 18500, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg', rating: 5.0, reviews: 1620, description: 'Plástico 100% reciclado • Entretenimiento • Garantía 10 años' },
  { id: 4, nombre: 'Soporte Aguas Andinas', precio: 12999, imagen: 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg', rating: 5.0, reviews: 980, description: 'Plástico 100% reciclado • Diseño moderno • Garantía 10 años' },
];

const STORAGE_KEY = 'peyu_chat_conversation_id';
const WELCOME_MSG = { role: 'assistant', content: '¡Hola! Soy Peyu 🐢. Ayudo a empresas y personas a encontrar el regalo perfecto hecho con plástico 100% reciclado.\n\n¿Buscas regalo para empresa o uso personal?' };

export default function ShopLanding() {
  // Si la pestaña es nueva (usuario cerró y volvió), archivar la conv anterior al historial.
  const [freshSession] = useState(() => ensureFreshSession());
  const [conversationId, setConversationId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyCount, setHistoryCount] = useState(() => readHistory().length);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
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
  }, [messages]);

  // Recuperar conversación existente al montar SOLO si la sesión sigue viva
  // (usuario navegó a otra página y volvió). Si es sesión nueva, arrancamos limpio.
  useEffect(() => {
    if (!conversationId || freshSession) return;
    let alive = true;
    (async () => {
      try {
        const conv = await base44.agents.getConversation(conversationId);
        const msgs = (conv?.messages || []).filter(m => m.content).map(stripContext);
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
      const conv = await base44.agents.getConversation(id);
      const msgs = (conv?.messages || []).filter(m => m.content).map(stripContext);
      setMessages(msgs.length > 0 ? msgs : [WELCOME_MSG]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setConversationId(null);
      setMessages([WELCOME_MSG]);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
      // Crear o recuperar conversación (persistida para continuar en otras páginas)
      let conv;
      if (!conversationId) {
        conv = await base44.agents.createConversation({
          agent_name: 'asistente_compras',
          metadata: { context: 'landing' }
        });
        setConversationId(conv.id);
        localStorage.setItem(STORAGE_KEY, conv.id);
      } else {
        conv = await base44.agents.getConversation(conversationId);
      }

      // Registrar/actualizar esta conversación en el historial con el texto del usuario
      addToHistory(conv.id, text);
      setHistoryCount(readHistory().length);

      const msgCountBefore = (conv.messages || []).length;

      // Enviar mensaje al agente con contexto de página inyectado (invisible en UI)
      const contextualized = await withContext(text);
      await base44.agents.addMessage(conv, { role: 'user', content: contextualized });

      // Polling: verificar cada 1.5s si llegó respuesta del agente
      let attempts = 0;
      const maxAttempts = 30; // 45 segundos máx

      const poll = async () => {
        attempts++;
        const updated = await base44.agents.getConversation(conv.id);
        const msgs = (updated.messages || []).filter(m => m.content).map(stripContext);
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
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error de conexión. Intenta de nuevo.' }]);
      setLoading(false);
    }
  };

  const handleOccasionClick = async (ocasion) => {
    const mensaje = `Me gustaría un regalo corporativo para ${ocasion.label}. ¿Cuáles son las opciones disponibles y qué me recomiendas?`;
    await sendMessage(mensaje);
  };

  const landingJsonLd = combineSchemas(
    buildOrganizationSchema(),
    buildWebSiteSchema(),
  );

  return (
    <>
    <SEO
      title="PEYU Chile · Regalos Corporativos 100% Reciclados · Hecho en Chile"
      description="Regalos corporativos sostenibles en plástico 100% reciclado y fibra de trigo compostable. Personalización láser UV, producción local en Santiago. Cotización B2B en 4h."
      canonical="https://peyuchile.cl/"
      image="https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg"
      jsonLd={landingJsonLd}
    />
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

      </aside>

      {/* Selector de fondo — flotante independiente */}
      <BackgroundSwitcher />

      {/* Main content area — sin background propio, reserva espacio solo para sidebar colapsado */}
      <div className="absolute inset-0 lg:pl-14 overflow-y-auto overflow-x-hidden peyu-scrollbar-light">
        {/* Main container — Liquid Glass (iOS 26 / visionOS style)
            Centrado y con ancho máx ~70% en desktop para look premium. */}
        <div className="flex gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 lg:p-5 relative z-10 flex-col lg:flex-row items-stretch min-h-full lg:h-full w-full lg:max-w-[1400px] lg:mx-auto">
          {/* LEFT CONTAINER - Liquid Glass */}
          <div className="peyu-liquid-glass flex-1 rounded-2xl lg:rounded-3xl overflow-hidden flex flex-col min-w-0">

            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-b border-white/15 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3 flex-shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MobileMenu items={MENU_ITEMS} />
                <PEYULogo size="sm" showText={true} />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link to="/admin" className="hidden sm:block">
                  <button className="h-10 px-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white transition-all active:bg-white/35">
                    <span>👤</span>
                    <span>Admin</span>
                  </button>
                </Link>
                <button className="hidden sm:inline-flex w-10 h-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all active:bg-white/35">
                  <Bell className="w-[18px] h-[18px]" />
                </button>
                <Link to="/cart">
                  <button className="relative w-10 h-10 inline-flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 border border-teal-400/50 text-white transition-all active:bg-teal-700 shadow-md">
                    <ShoppingCart className="w-[18px] h-[18px]" />
                    {carrito.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0f172a]/60">
                        {carrito.length}
                      </span>
                    )}
                  </button>
                </Link>
              </div>
            </div>

            {/* Celebration Banner — barra independiente entre header y contenido */}
            <div className="px-3 sm:px-4 pt-2">
              <CelebrationBanner onChatPrompt={sendMessage} compact />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2 p-3 sm:p-4 flex-1 min-h-0 overflow-hidden">

              {/* Hero Title — compacto, una línea en desktop */}
              <div className="flex-shrink-0">
                <h1 className="text-base sm:text-lg lg:text-xl font-poppins font-black leading-tight text-white drop-shadow-lg">
                  Regalos Corporativos <span className="text-cyan-400">100%</span>{' '}
                  <span className="text-emerald-400">Sostenibles</span>
                </h1>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-2 flex-col sm:flex-row flex-shrink-0">
                <Link to="/shop" className="flex-1 min-w-0">
                  <Button className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-full px-4 py-2 gap-2 shadow-lg hover:shadow-xl text-xs transition-all">
                    📮 Explorar Regalos
                  </Button>
                </Link>
                <Link to="/b2b/contacto" className="flex-1 min-w-0">
                  <Button className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-gray-900 font-bold rounded-full px-4 py-2 gap-2 shadow-lg hover:shadow-xl text-xs transition-all">
                    ✨ B2B Corporativo
                  </Button>
                </Link>
              </div>

              {/* Chat Agent — Liquid Glass; en modo "Temas" toma un aura cálida del día */}
              <div
                className={`peyu-liquid-glass-inner rounded-xl lg:rounded-2xl p-2.5 sm:p-3 flex flex-col flex-1 min-h-[320px] lg:min-h-0 overflow-hidden relative transition-all duration-500 ${
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
                
                {/* Agent Header */}
                <div className="mb-2 pb-2 border-b border-white/20 flex items-center gap-2 flex-shrink-0 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm shadow-lg">🐢</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-xs">Peyu</p>
                    <p className="text-white/50 text-[10px] line-clamp-1">Asistente de Gifting</p>
                  </div>
                  {historyCount > 0 && (
                    <button
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 text-[10px] font-semibold transition flex-shrink-0"
                      title="Conversaciones anteriores"
                    >
                      <History className="w-3 h-3" />
                      <span className="hidden sm:inline">Anteriores ({historyCount})</span>
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

                {/* Messages Container */}
                <div className="peyu-scrollbar-light flex-1 overflow-y-auto space-y-2.5 mb-3 pr-1">
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
                      <div className={`rounded-xl px-3.5 py-2.5 text-xs sm:text-sm break-words leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none max-w-[75%]' : 'bg-white/15 text-white border border-white/25 rounded-bl-none backdrop-blur-sm max-w-[85%] w-full'}`}>
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

                {/* Input */}
                <div className="flex gap-2 flex-shrink-0 min-w-0">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
                    placeholder="¿Qué necesitas?"
                    className="bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/50 text-xs sm:text-sm rounded-full focus:ring-teal-400/50 focus:border-teal-400/50 flex-1 h-10 sm:h-11 px-4 py-2 touch-target disabled:opacity-60 transition-all"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 active:from-teal-700 active:to-cyan-700 text-white rounded-full w-10 h-10 sm:w-11 sm:h-11 p-0 flex items-center justify-center flex-shrink-0 touch-target shadow-lg transition-all disabled:opacity-60">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Ocasiones Carousel — compacto */}
              <div className="overflow-x-auto scrollbar-hide flex gap-1.5 pb-0.5 justify-start lg:justify-center flex-shrink-0">
                {OCASIONES.map(occ => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionClick(occ)}
                    className="flex flex-col items-center gap-1 flex-shrink-0 hover:scale-105 active:scale-95 transition-transform group"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/25 border border-white/40 flex items-center justify-center text-base group-hover:bg-white/35 group-hover:border-white/60 active:bg-white/40 transition-all shadow-lg">
                      {occ.icon}
                    </div>
                    <span className="text-white text-[8px] font-bold text-center leading-none whitespace-nowrap">{occ.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER - Product Carousel (Liquid Glass) */}
          <Link to={`/producto/${FEATURED_PRODUCTS[currentProductIndex].id}`} className="hidden lg:block flex-shrink-0 lg:w-72 xl:w-80 2xl:w-96">
            <div className="peyu-liquid-glass w-full rounded-2xl p-4 flex flex-col gap-3 hover:-translate-y-1 transition-all cursor-pointer group h-full">
              {(() => {
                const product = FEATURED_PRODUCTS[currentProductIndex];
                return (
                  <>
                    {/* Product Image */}
                    <div className="w-full aspect-square bg-gradient-to-br from-yellow-300/50 via-orange-400/40 to-red-500/30 rounded-xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all flex-shrink-0">
                      <img src={product.imagen} alt={product.nombre} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    </div>

                    {/* Rating + Name + Price — all together */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 space-y-1.5 flex-shrink-0">
                      {/* Stars + count */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <span className="text-yellow-300 font-bold text-xs">{product.rating.toFixed(1)}</span>
                        <span className="text-white/50 text-[10px]">({product.reviews.toLocaleString()})</span>
                      </div>
                      {/* Name */}
                      <p className="text-white font-poppins font-bold text-sm leading-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">{product.nombre}</p>
                      {/* Description */}
                      <p className="text-white/60 text-[10px] leading-relaxed line-clamp-2">{product.description}</p>
                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 pt-0.5 border-t border-white/15">
                        <span className="text-white/60 text-[10px]">Desde</span>
                        <span className="text-white font-black text-xl group-hover:text-teal-300 transition-colors">${product.precio.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Carousel Controls */}
                    <div className="flex gap-2 justify-between items-center flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex((prev) => (prev - 1 + FEATURED_PRODUCTS.length) % FEATURED_PRODUCTS.length);
                        }}
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex gap-1 items-center">
                        {FEATURED_PRODUCTS.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentProductIndex(idx);
                            }}
                            className={`rounded-full transition-all ${
                              idx === currentProductIndex ? 'w-2.5 h-2.5 bg-teal-400 shadow-lg' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentProductIndex((prev) => (prev + 1) % FEATURED_PRODUCTS.length);
                        }}
                        className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { sanitizeUserMessage } from '@/lib/chat-sanitize';
import { syncShownSkusFromMessages, buildOccasionPrompt, clearShownSkus } from '@/lib/chat-recommendations';
import { matchFAQ } from '@/lib/chat-faq-cache';
import { History, RotateCcw } from 'lucide-react';
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
import DesktopChatWelcomeChips from '@/components/landing/desktop/DesktopChatWelcomeChips';
import { isCyberActive, CYBER_COPY } from '@/lib/cyber-campaign';
import CyberCatalogBanner from '@/components/cyber/CyberCatalogBanner';
import CyberAnnouncementBar from '@/components/cyber/CyberAnnouncementBar';

// Línea Cyber para inyectar UNA vez en el saludo (solo si la campaña está activa).
const cyberGreetingLine = () => (isCyberActive() ? `\n\n${CYBER_COPY.greeting}` : '');

// Limpia los bloques [CONTEXTO] y [BRAIN] inyectados al agente — no deben
// verse en la UI. Usamos sanitizeUserMessage (que ya conoce todos los patrones)
// para ser robustos contra cualquier variante de inyección.
const stripContext = (m) => {
  if (!m || m.role !== 'user' || !m.content) return m;
  const cleaned = sanitizeUserMessage(m.content);
  return { ...m, content: cleaned || m.content };
};

// Chip evergreen de alto valor "Cotizar Empresa" primero y destacado (navega
// al flujo B2B self-service), luego las fechas atemporales. Se retiró el
// estacional "Día del Padre".
const OCASIONES = [
  { id: 'empresa', label: 'Cotizar Empresa', icon: '🏢', href: '/b2b/self-service', featured: true },
  { id: 'patrias', label: 'Fiestas Patrias', icon: '🇨🇱' },
  { id: 'navidad', label: 'Navidad', icon: '🎄' },
  { id: 'anio', label: 'Año Nuevo', icon: '🎉' },
  { id: 'bienestar', label: 'Bienestar', icon: '🌟' },
  { id: 'logros', label: 'Logros', icon: '🏆' },
];

const STORAGE_KEY = 'peyu_chat_conversation_id';

// Saludo base (anónimo). Si el usuario está logueado, se personaliza con su
// nombre al montar el componente (efecto useEffect que reemplaza el welcome).
// Saludo base (anónimo). Se construye en runtime para inyectar la línea Cyber
// solo mientras la campaña esté activa (flag CYBER_ENABLED + ventana).
const getWelcome = () => ({
  role: 'assistant',
  content: [
    '¡Hola! 🐢 Soy Peyu, tu asistente para encontrar el regalo perfecto.',
    '',
    'En PEYU diseñamos regalos sustentables: plástico 100% reciclado chileno en la mayoría de nuestros productos y fibra de trigo compostable en nuestras carcasas de teléfono. Con grabado láser personalizable y garantía de 10 años. 🌱',
    '',
    '¿Para quién buscas algo lindo hoy? ¿Es para una persona especial 🎁 o para tu equipo/empresa 💼?',
  ].join('\n') + cyberGreetingLine(),
});

const WELCOME_MSG = getWelcome();

const buildPersonalizedWelcome = (fullName) => {
  // Primer nombre solamente — más cálido que el nombre completo.
  const firstName = (fullName || '').trim().split(/\s+/)[0];
  if (!firstName) return getWelcome();
  return {
    role: 'assistant',
    content: [
      `¡Hola ${firstName}! Qué bueno verte de nuevo 🐢`,
      '',
      'Tengo ideas frescas — drops nuevos, packs corporativos y algunos best-sellers que se están yendo rápido. ✨',
      '',
      '¿Vienes por algo personal 🎁 o para tu equipo 💼?',
    ].join('\n') + cyberGreetingLine(),
  };
};

export default function ShopLanding() {
  const navigate = useNavigate();
  // Si la pestaña es nueva (usuario cerró y volvió), archivar la conv anterior al historial.
  const [freshSession] = useState(() => {
    const fresh = ensureFreshSession();
    if (fresh) {
      // Sesión nueva → resetear toda la memoria efímera de la conv anterior:
      // SKUs mostrados, datos B2B capturados, intent detectado, cantidad detectada.
      // Si no, la conv nueva arranca con sesgos de la sesión pasada (el bug que
      // hace que Peyu siga hablando del "regalo para mamá" que se preguntó ayer).
      clearShownSkus();
      try {
        localStorage.removeItem('peyu_chat_b2b_contact');
        localStorage.removeItem('peyu_chat_intent');
        localStorage.removeItem('peyu_chat_last_qty');
        localStorage.removeItem('peyu_chat_last_product');
        localStorage.removeItem('peyu_chat_turn_count');
        // 🛒 Limpiar carrito del chat en sesión nueva — el usuario debe poder
        // empezar una compra limpia sin arrastrar items de la sesión anterior.
        localStorage.removeItem('carrito');
        // Limpiar también el flag anti-duplicados de CartInject para que el
        // primer [[CART]] de la nueva sesión funcione normalmente.
        Object.keys(sessionStorage).forEach((k) => {
          if (k.startsWith('peyu_chat_cart_added_')) sessionStorage.removeItem(k);
        });
        window.dispatchEvent(new CustomEvent('peyu:cart-cleared'));
        // El email capturado SÍ se conserva entre sesiones (es dato persistente
        // del visitante), pero el resto de la memoria efímera se limpia para que
        // la conversación nueva no arrastre sesgos de la sesión anterior.
      } catch { /* noop */ }
    }
    return fresh;
  });
  // CRITICAL: si es sesión nueva, ensureFreshSession ya archivó la conv anterior
  // y borró ACTIVE_KEY. Pero por seguridad nos aseguramos: si freshSession=true
  // arrancamos SIEMPRE con conversationId=null aunque por algún race quede algo
  // en localStorage. Esto previene el bug de "se queda cargando la conv vieja".
  const [conversationId, setConversationId] = useState(() => {
    return freshSession ? null : (localStorage.getItem(STORAGE_KEY) || null);
  });
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

  // 👋 Saludo personalizado: si el usuario está logueado, reemplazamos el
  // welcome anónimo por uno con su nombre. Sólo cuando arrancamos limpio
  // (sin conversación previa pendiente de recuperar).
  useEffect(() => {
    if (conversationId && !freshSession) return; // recuperando conv → no tocar
    let alive = true;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) return;
        const user = await base44.auth.me();
        if (!alive || !user?.full_name) return;
        setMessages([buildPersonalizedWelcome(user.full_name)]);
      } catch { /* anónimo, dejar welcome por defecto */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // como memoria vectorial de largo plazo. SOLO para usuarios registrados,
  // porque la memoria de chat se indexa por user_email — para visitantes
  // anónimos no aporta valor y además genera errores en runtime (no hay
  // identidad). Para anónimos basta con el historial local de localStorage.
  useEffect(() => {
    let isRegistered = false;
    (async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (authed) {
          const u = await base44.auth.me();
          isRegistered = !!u?.email;
        }
      } catch { /* anónimo */ }
    })();

    const handleUnload = () => {
      if (!isRegistered) return; // visitante anónimo → nada que guardar
      if (conversationId && messages.length >= 3) {
        try {
          base44.functions.invoke('summarizeAndSaveConversation', {
            conversation_id: conversationId,
            messages: messages.slice(-20).map(m => ({
              role: m.role,
              content: m.role === 'user' ? sanitizeUserMessage(m.content) : m.content,
            })),
            last_query: sanitizeUserMessage(messages.filter(m => m.role === 'user').slice(-1)[0]?.content || ''),
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

    // 🐢 Pista visual inmediata: mostramos el "loading" ANTES de cualquier await,
    // así el usuario sabe que su mensaje se está procesando aunque el primer
    // round-trip de red tarde unos segundos (el bug de la captura: usuario no
    // veía dots y pensó que el chat estaba muerto, mandó "?" frustrado).
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    // ⚡ CACHÉ DE RESPUESTAS INSTANTÁNEAS: si la consulta coincide con una FAQ
    // frecuente (envíos, garantía, pagos, ubicación…), respondemos AL INSTANTE
    // sin pasar por el agente IA — atención al cliente inmediata, cero latencia.
    // La conversación igual se registra en background para no perder el lead.
    const cached = matchFAQ(text);
    if (cached) {
      setMessages(prev => [...prev, { role: 'assistant', content: cached }]);
      setLoading(false);
      // Registro en background (lead + trazabilidad), sin bloquear la UI.
      (async () => {
        try {
          const sid = localStorage.getItem('peyu_session_id') || null;
          let convId = conversationId;
          if (!convId) {
            const cr = await base44.functions.invoke('publicChatProxy', {
              action: 'create', context: 'landing', session_id: sid,
              page_path: window.location.pathname, referrer: document.referrer || null,
            });
            convId = cr.data?.conversation_id;
            if (convId) { setConversationId(convId); localStorage.setItem(STORAGE_KEY, convId); }
          }
          if (convId) {
            addToHistory(convId, text);
            setHistoryCount(readHistory().length);
            await base44.functions.invoke('publicChatProxy', {
              action: 'send', conversation_id: convId, content: text,
              session_id: sid, page_path: window.location.pathname,
            });
          }
        } catch { /* best-effort */ }
      })();
      return;
    }

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
      }
      // 💡 Ya NO consultamos el server para sacar msgCountBefore: usamos el
      // estado local que es la fuente de verdad y evita race conditions.

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

      // Polling adaptativo: rápido al inicio, luego se relaja.
      // El agente suele responder en 4-12s. Damos hasta ~35s totales antes
      // del fallback — más allá la UX se siente rota.
      const intervals = [
        400, 500, 600, 700, 800, 1000, 1200, 1500,
        1500, 2000, 2000, 2000, 2500, 2500,
        3000, 3000, 3000, 3000
      ]; // primer chequeo más temprano → la respuesta aparece apenas el agente termina
      let attempt = 0;
      let consecutiveErrors = 0;

      const poll = async () => {
        try {
          const updated = await base44.functions.invoke('publicChatProxy', {
            action: 'get',
            conversation_id: convId,
          });
          consecutiveErrors = 0;
          const msgs = (updated.data?.messages || []).filter(m => m.content).map(stripContext);

          // Detección robusta: existe un mensaje 'assistant' DESPUÉS del último 'user'.
          let respondió = false;
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') break;
            if (msgs[i].role === 'assistant' && msgs[i].content?.trim()) {
              respondió = true;
              break;
            }
          }

          if (msgs.length > 0) setMessages(msgs);

          if (respondió) {
            setLoading(false);
            return;
          }
        } catch (pollErr) {
          console.warn('Poll error (continúa):', pollErr);
          consecutiveErrors++;
          // Si fallan 3 polls seguidos, asumimos red caída → fallback ya.
          if (consecutiveErrors >= 3) {
            setLoading(false);
            const waUrl = `https://wa.me/56935040242?text=${encodeURIComponent(`Hola Peyu, te escribí en el chat: "${text}"`)}`;
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Estoy teniendo problemas de conexión 🐢. Escríbenos por WhatsApp y te ayudo al toque.\n\n[[ACTION:whatsapp]]`,
            }]);
            return;
          }
        }

        attempt++;
        if (attempt < intervals.length) {
          setTimeout(poll, intervals[attempt]);
        } else {
          // Timeout ~30s. Mensaje amigable + WhatsApp.
          setLoading(false);
          const waUrl = `https://wa.me/56935040242?text=${encodeURIComponent(`Hola Peyu, te escribí en el chat: "${text}"`)}`;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `🐢 Uy, estoy lento hoy. Tu mensaje quedó guardado. ¿Te respondo por WhatsApp?\n\n[[ACTION:whatsapp]]`,
          }]);
        }
      };

      setTimeout(poll, 600);

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

  // 🔄 Nuevo chat: archiva la conversación actual al historial y arranca limpio.
  // Resuelve el "se queda pegado en la conversación pasada" de forma explícita,
  // sin depender de cerrar la pestaña. Limpia toda la memoria efímera de la sesión.
  const handleNewChat = () => {
    const currentId = conversationId;
    if (currentId) {
      const firstUser = messages.find(m => m.role === 'user')?.content || '';
      addToHistory(currentId, sanitizeUserMessage(firstUser));
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('peyu_chat_b2b_contact');
      localStorage.removeItem('peyu_chat_intent');
      localStorage.removeItem('peyu_chat_last_qty');
      localStorage.removeItem('peyu_chat_last_product');
      localStorage.removeItem('peyu_chat_turn_count');
    } catch { /* noop */ }
    clearShownSkus();
    setConversationId(null);
    setMessages([WELCOME_MSG]);
    setShowHistory(false);
    setHistoryCount(readHistory().length);
  };

  const handleOccasionClick = async (ocasion) => {
    // CTA con destino directo (ej. "Cotizar Empresa" → flujo B2B self-service):
    // navega en vez de mandar un prompt al chat.
    if (ocasion.href) {
      navigate(ocasion.href);
      return;
    }
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

    {/* ─── FRENTE A · Banner Cyber PEYU cálido y cerrable (solo aviso visual,
        controlado por el flag de campaña — NO afecta precios) ─── */}
    <CyberAnnouncementBar />

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
        onNewChat={handleNewChat}
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
                  <button
                    onClick={handleNewChat}
                    title="Nuevo chat"
                    className="ld-btn-ghost flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold flex-shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden xl:inline">Nuevo</span>
                  </button>
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
                        {msg.role === 'assistant' ? <ChatMessageContent content={msg.content} /> : sanitizeUserMessage(msg.content)}
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

                  {/* Welcome chips desktop — solo cuando el chat arranca vacío
                      (un único mensaje del assistant = WELCOME). Replica la energía
                      visual del modal mobile y del modal de referencia. */}
                  {messages.length <= 1 && !loading && (
                    <DesktopChatWelcomeChips
                      onPick={(prompt) => sendMessage(prompt)}
                      disabled={loading}
                    />
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

                {/* Quick replies Liquid Dual — fade en borde derecho para scroll limpio */}
                <div className="relative flex-shrink-0 mt-2">
                  <div className="overflow-x-auto scrollbar-hide flex gap-1.5 pb-0.5 pr-5">
                    {OCASIONES.map(occ => (
                      <button
                        key={occ.id}
                        onClick={() => handleOccasionClick(occ)}
                        className={`flex items-center gap-1 flex-shrink-0 rounded-full px-2.5 py-1 border transition-all duration-200 active:scale-95 ${occ.featured ? '' : 'ld-btn-ghost hover:border-ld-action'}`}
                        style={occ.featured ? { background: 'var(--ld-highlight-soft)', borderColor: 'var(--ld-highlight)' } : undefined}
                      >
                        <span className="text-[10px] leading-none">{occ.icon}</span>
                        <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: occ.featured ? 'var(--ld-highlight)' : 'var(--ld-fg-soft)' }}>{occ.label}</span>
                      </button>
                    ))}
                  </div>
                  {/* Fade derecho indicando más contenido scrollable */}
                  <div className="absolute right-0 top-0 bottom-0 w-6 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, var(--ld-bg-elevated))' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── BELOW THE FOLD: E-commerce sections ─── */}
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="px-6 pt-2">
            <CyberCatalogBanner />
          </div>
          <DesktopCategorySection />
          <DesktopTopSellers />
          <DesktopTrustFooter />
        </div>

      </div>
    </div>
    </>
  );
}
import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import '@/styles/v2-warm-dusk.css';
import V2ModeToggle from '@/components/v2/V2ModeToggle';
import V2CardDispatcher from '@/components/v2/V2CardDispatcher';
import V2NavPanel from '@/components/v2/panels/V2NavPanel';
import V2ContextPanel from '@/components/v2/panels/V2ContextPanel';
import V2ChatSkeleton from '@/components/v2/V2ChatSkeleton';
import { fetchV2Catalog } from '@/lib/v2-catalog';
import { getRecentViews, pushRecentView } from '@/lib/v2-recent';
import { Send, ShoppingCart, Sparkles, SlidersHorizontal } from 'lucide-react';

const PEYU_LOGO = 'https://media.base44.com/images/public/6a1a158951bc398e16add415/86a2b4b89_image.png';

const QUICK_REPLIES = [
  '🎁 Busco un regalo',
  '🏢 Compra para mi empresa',
  '🎲 Ver cachos',
  '✦ ¿Cómo personalizo con mi logo?',
];

const WELCOME = {
  role: 'assistant',
  reply_text: '¡Hola! 🐢 Soy Peyu. Diseñamos regalos en plástico 100% reciclado chileno — merchandising sustentable, maceteros reciclados, productos para oficina, con garantía de 10 años.\n\n¿Buscas un regalo para alguien especial o algo para tu empresa?',
  cards: [],
};

// Página /v2 "Peyu Commerce OS" — COCKPIT de 3 columnas.
// Izq: navegación+filtros · Centro: río de chat (protagonista) · Der: panel vivo.
// Móvil: 1 columna + drawers (filtro / carrito).
// IDs persistentes del hilo conversacional (sobreviven recarga / re-entrada).
function getOrCreateId(key, prefix) {
  try {
    let v = localStorage.getItem(key);
    if (!v) { v = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; localStorage.setItem(key, v); }
    return v;
  } catch { return `${prefix}_${Date.now()}`; }
}

export default function PeyuV2() {
  const [mode, setMode] = useState('b2c');
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const convIdRef = useRef(getOrCreateId('peyu_v2_conversation_id', 'v2conv'));
  const sessionIdRef = useRef(getOrCreateId('peyu_v2_session_id', 'v2sess'));
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carrito') || '[]'); } catch { return []; }
  });
  const [catalog, setCatalog] = useState([]);
  const [recientes, setRecientes] = useState(() => getRecentViews());
  const [quoteDraft, setQuoteDraft] = useState(null);

  // Filtros del panel izquierdo
  const [activeCat, setActiveCat] = useState(null);
  const [material, setMaterial] = useState('Todos');
  const [priceRange, setPriceRange] = useState('all');

  // Drawers móviles
  const [navOpen, setNavOpen] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Cargar catálogo madre para los paneles laterales (destacados/best-sellers).
  useEffect(() => { fetchV2Catalog().then(setCatalog); }, []);

  // Retomar conversación previa: si el hilo ya tiene historial, lo reconstruimos
  // con un saludo "welcome-back" según el perfil inferido la última vez.
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke('peyuBrain', {
          action: 'history', conversation_id: convIdRef.current,
        });
        const turns = res.data?.turns || [];
        if (turns.length > 0) {
          const prevPerfil = res.data?.perfil;
          if (prevPerfil) setMode(prevPerfil);
          const history = [];
          for (const turn of turns) {
            if (turn.user_message) history.push({ role: 'user', reply_text: turn.user_message, cards: [] });
            if (turn.reply_text) history.push({ role: 'assistant', reply_text: turn.reply_text, cards: [] });
          }
          const back = prevPerfil === 'b2b'
            ? '¡Qué bueno verte de nuevo! 🐢 Seguimos con tu compra para empresa. ¿Continuamos donde quedamos?'
            : '¡Hola otra vez! 🐢 Retomemos donde quedamos. ¿En qué te ayudo?';
          setMessages([...history, { role: 'assistant', reply_text: back, cards: [] }]);
        }
      } catch { /* sin historial: se queda el WELCOME por defecto */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar carrito + vistos recientes con eventos globales.
  useEffect(() => {
    const refreshCart = () => { try { setCart(JSON.parse(localStorage.getItem('carrito') || '[]')); } catch { /* noop */ } };
    const refreshRecent = () => setRecientes(getRecentViews());
    window.addEventListener('peyu:cart-added', refreshCart);
    window.addEventListener('storage', refreshCart);
    window.addEventListener('v2:recent-updated', refreshRecent);
    return () => {
      window.removeEventListener('peyu:cart-added', refreshCart);
      window.removeEventListener('storage', refreshCart);
      window.removeEventListener('v2:recent-updated', refreshRecent);
    };
  }, []);

  const ask = async (val) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    setInput('');
    setLoading(true);
    setMessages((p) => [...p, { role: 'user', reply_text: text, cards: [] }]);

    try {
      const res = await base44.functions.invoke('peyuBrain', {
        message: text, perfil: mode,
        conversation_id: convIdRef.current, session_id: sessionIdRef.current,
      });
      const d = res.data || {};
      if (d.perfil && d.perfil !== mode) setMode(d.perfil);
      setMessages((p) => [...p, {
        role: 'assistant',
        reply_text: d.reply_text || 'Listo 🐢',
        cards: Array.isArray(d.cards) ? d.cards : [],
      }]);
    } catch {
      setMessages((p) => [...p, {
        role: 'assistant',
        reply_text: 'Uy, tuve un problema 🐢. Intenta de nuevo o escríbenos por WhatsApp: https://wa.me/56935040242',
        cards: [],
      }]);
    }
    setLoading(false);
  };

  // ── Handlers de cards ──
  const handleAddCart = (p, color) => {
    try {
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      carrito.push({ sku: p.sku, nombre: p.nombre, precio: p.precio_b2c, imagen: p.imagen_url, cantidad: 1, color });
      localStorage.setItem('carrito', JSON.stringify(carrito));
      setCart(carrito);
      window.dispatchEvent(new Event('peyu:cart-added'));
    } catch { /* noop */ }
    setMessages((prev) => [...prev, {
      role: 'assistant',
      reply_text: '',
      cards: [{ type: 'cart_confirm', data: { item: { nombre: p.nombre, precio: p.precio_b2c, imagen: p.imagen_url, color } } }],
    }]);
  };

  const handleQuote = (p) => {
    setMode('b2b');
    setQuoteDraft(p);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      reply_text: 'Armemos tu cotización por volumen 🐢 Precios por unidad, excluyen IVA. El grabado de tu logo va gratis desde 10 unidades.',
      cards: [{ type: 'b2b_quote', data: { producto: p } }],
    }]);
  };

  const handlePick = (p) => {
    pushRecentView(p);
    setCtxOpen(false);
    setMessages((prev) => [...prev, {
      role: 'assistant',
      reply_text: 'Aquí tienes el detalle 🐢',
      cards: [{ type: 'product', data: p }],
    }]);
  };

  const handleCheckout = () => { window.location.href = '/cart'; };

  const cardHandlers = { onAddCart: handleAddCart, onQuote: handleQuote, onPick: handlePick, onCheckout: handleCheckout };

  // Click en categoría del panel izquierdo → conversación.
  const handleCatClick = (cat) => {
    setActiveCat(cat);
    setNavOpen(false);
    ask(cat ? `Muéstrame productos de ${cat}` : 'Muéstrame todos los productos');
  };

  const handleNavLink = (target) => {
    setNavOpen(false);
    if (target === 'b2b') { setMode('b2b'); ask('Quiero comprar para mi empresa por volumen con logo'); }
    else window.location.href = target;
  };

  const renderStream = useCallback(() => (
    <div className="flex flex-col gap-4">
      {messages.map((m, i) => (
        <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
          {m.reply_text && (
            <div className="flex gap-2.5 max-w-[92%]">
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
              )}
              <div
                className="rounded-2xl px-4 py-3 text-[15px] whitespace-pre-wrap break-words leading-relaxed"
                style={m.role === 'user'
                  ? { background: 'var(--v2-grad-gold)', color: '#2a1f2b' }
                  : { background: 'var(--v2-surface)', color: 'var(--v2-fg-soft)', border: '1px solid var(--v2-border)' }}
              >
                {m.reply_text}
              </div>
            </div>
          )}
          {m.cards && m.cards.length > 0 && (
            <div className={`flex flex-wrap gap-3 ${m.role === 'assistant' ? 'pl-9' : ''}`}>
              {m.cards.map((card, ci) => (
                <V2CardDispatcher key={ci} card={card} perfil={mode} handlers={cardHandlers} />
              ))}
            </div>
          )}
        </div>
      ))}
      {loading && <div className="pl-0"><V2ChatSkeleton /></div>}
      <div ref={endRef} />
    </div>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [messages, loading, mode]);

  return (
    <div className="v2-root flex flex-col h-screen overflow-hidden" style={{ height: '100svh' }}>
      {/* ─── Barra superior ─── */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--v2-border)' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Botón filtros (móvil/tablet) */}
          <button onClick={() => setNavOpen(true)} className="lg:hidden v2-btn-ghost w-9 h-9 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e0584f' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e3c196' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#5fbfa6' }} />
          </div>
          <img src={PEYU_LOGO} alt="PEYU" className="h-6 w-auto object-contain ml-1" style={{ filter: 'brightness(0) invert(1)' }} draggable={false} />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <V2ModeToggle mode={mode} onChange={setMode} />
          {/* Carrito: en desktop vive en panel der; aquí badge + drawer en móvil */}
          <button onClick={() => setCtxOpen(true)} className="lg:hidden relative v2-btn-ghost w-9 h-9 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center" style={{ background: 'var(--v2-gold)', color: '#2a1f2b' }}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── COCKPIT 3 columnas ─── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* COLUMNA IZQUIERDA (desktop) */}
        <aside className="hidden lg:flex w-[260px] flex-shrink-0 v2-panel">
          <V2NavPanel
            perfil={mode} activeCat={activeCat} onCatClick={handleCatClick}
            material={material} onMaterialChange={setMaterial}
            priceRange={priceRange} onPriceChange={setPriceRange}
            onLink={handleNavLink}
          />
        </aside>

        {/* COLUMNA CENTRAL — río de chat */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden v2-scroll">
            <div className="max-w-[920px] w-full mx-auto px-6 py-6">
              {renderStream()}
            </div>
          </div>

          {/* Input sticky */}
          <div className="flex-shrink-0 px-4 pt-2 pb-4 pb-safe" style={{ borderTop: '1px solid var(--v2-border)' }}>
            <div className="max-w-[920px] w-full mx-auto">
              <div className="flex gap-2 overflow-x-auto v2-scrollbar-hide pb-2.5">
                {QUICK_REPLIES.map((q) => (
                  <button key={q} onClick={() => ask(q.replace(/^[^\s]+\s/, ''))} className="v2-chip px-3.5 py-2 text-xs flex-shrink-0">
                    {q}
                  </button>
                ))}
              </div>
              <div className="v2-input flex items-center gap-2.5 pl-5 pr-2 py-2">
                <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--v2-gold)' }} />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && ask()}
                  placeholder={mode === 'b2b' ? 'Ej: 100 cachos con mi logo para mi empresa…' : 'Ej: un regalo sustentable bajo $25.000…'}
                  className="flex-1 bg-transparent border-0 outline-none text-[15px] h-12"
                  style={{ color: 'var(--v2-fg)' }}
                  disabled={loading}
                />
                <button onClick={() => ask()} disabled={loading || !input.trim()} className="v2-btn-primary w-12 h-12 flex items-center justify-center flex-shrink-0 disabled:opacity-50">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* COLUMNA DERECHA (desktop) */}
        <aside className="hidden lg:flex w-[320px] flex-shrink-0 v2-panel">
          <V2ContextPanel
            perfil={mode} cart={cart} recientes={recientes} destacados={catalog} quoteDraft={quoteDraft}
            onPick={handlePick} onCheckout={handleCheckout}
          />
        </aside>
      </div>

      {/* ─── DRAWERS móviles ─── */}
      {navOpen && (
        <>
          <div className="v2-drawer-backdrop lg:hidden" onClick={() => setNavOpen(false)} />
          <div className="v2-drawer lg:hidden" data-side="left">
            <V2NavPanel
              perfil={mode} activeCat={activeCat} onCatClick={handleCatClick}
              material={material} onMaterialChange={setMaterial}
              priceRange={priceRange} onPriceChange={setPriceRange}
              onLink={handleNavLink} onClose={() => setNavOpen(false)}
            />
          </div>
        </>
      )}
      {ctxOpen && (
        <>
          <div className="v2-drawer-backdrop lg:hidden" onClick={() => setCtxOpen(false)} />
          <div className="v2-drawer lg:hidden" data-side="right">
            <V2ContextPanel
              perfil={mode} cart={cart} recientes={recientes} destacados={catalog} quoteDraft={quoteDraft}
              onPick={handlePick} onCheckout={handleCheckout} onClose={() => setCtxOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
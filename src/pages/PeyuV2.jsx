import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import '@/styles/v2-warm-dusk.css';
import PEYULogo from '@/components/PEYULogo';
import V2ModeToggle from '@/components/v2/V2ModeToggle';
import V2CardDispatcher from '@/components/v2/V2CardDispatcher';
import { Send, ShoppingCart, Sparkles } from 'lucide-react';

const PEYU_LOGO = 'https://media.base44.com/images/public/6a1a158951bc398e16add415/86a2b4b89_image.png';

// Espacios de la barra superior (estilo Agent OS · dots + labels).
const TOP_LINKS = [
  { label: 'Tienda', href: '/shop' },
  { label: 'Categorías', prompt: '¿Qué categorías de productos tienen?' },
  { label: 'Empresa / B2B', prompt: 'Quiero comprar para mi empresa por volumen con logo' },
  { label: 'Nosotros', href: '/nosotros' },
];

// Quick-replies protagonistas bajo el input.
const QUICK_REPLIES = [
  '🎁 Busco un regalo',
  '🏢 Compra para mi empresa',
  '🎲 Ver cachos',
  '✦ ¿Cómo personalizo con mi logo?',
];

const WELCOME = {
  role: 'assistant',
  reply_text: '¡Hola! 🐢 Soy Peyu. Diseñamos regalos en plástico 100% reciclado chileno — merchandising sustentable, maceteros reciclados, productos reciclados para oficina, con garantía de 10 años.\n\n¿Buscas un regalo para alguien especial o algo para tu empresa?',
  cards: [],
};

// Página /v2 "Peyu Commerce OS" — CHAT FULLSCREEN. La conversación ES la home.
// Productos, carro y cotizaciones emergen como cards DENTRO del río del chat.
export default function PeyuV2() {
  const [mode, setMode] = useState('b2c'); // toggle Personal | Empresa (default Personal)
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false); // false = hero centrado; true = río de chat
  const [cartCount, setCartCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem('carrito') || '[]').length; } catch { return 0; }
  });
  const endRef = useRef(null);

  useEffect(() => {
    if (started && endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, started]);

  const refreshCart = () => {
    try { setCartCount(JSON.parse(localStorage.getItem('carrito') || '[]').length); } catch { /* noop */ }
  };

  const ask = async (val) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    setStarted(true);
    setInput('');
    setLoading(true);
    setMessages((p) => [...p, { role: 'user', reply_text: text, cards: [] }]);

    try {
      const res = await base44.functions.invoke('peyuBrain', { message: text, perfil: mode });
      const d = res.data || {};
      // Si el cerebro detecta un perfil más específico, sincroniza el toggle.
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

  // ── Handlers de las cards (acciones dentro del río) ──
  const handleAddCart = (p, color) => {
    try {
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      carrito.push({ sku: p.sku, nombre: p.nombre, precio: p.precio_b2c, imagen: p.imagen_url, cantidad: 1, color });
      localStorage.setItem('carrito', JSON.stringify(carrito));
      refreshCart();
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
    setMessages((prev) => [...prev, {
      role: 'assistant',
      reply_text: 'Armemos tu cotización por volumen 🐢 Precios por unidad, excluyen IVA. El grabado de tu logo va gratis desde 10 unidades.',
      cards: [{ type: 'b2b_quote', data: { producto: p } }],
    }]);
  };

  const handlePick = (p) => {
    setMessages((prev) => [...prev, {
      role: 'assistant',
      reply_text: 'Aquí tienes el detalle 🐢',
      cards: [{ type: 'product', data: p }],
    }]);
  };

  const handleCheckout = () => { window.location.href = '/cart'; };

  const cardHandlers = { onAddCart: handleAddCart, onQuote: handleQuote, onPick: handlePick, onCheckout: handleCheckout };

  const handleTopLink = (link) => {
    if (link.prompt) ask(link.prompt);
  };

  return (
    <div className="v2-root flex flex-col h-screen overflow-hidden" style={{ height: '100svh' }}>
      {/* ─── Barra superior estilo Agent OS ─── */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--v2-border)' }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e0584f' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#e3c196' }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#5fbfa6' }} />
          </div>
          <img src={PEYU_LOGO} alt="PEYU" className="h-6 w-auto object-contain ml-1" style={{ filter: 'brightness(0) invert(1)' }} draggable={false} />
        </div>

        {/* Links de navegación (dots) — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {TOP_LINKS.map((l) => (
            l.href ? (
              <Link key={l.label} to={l.href} className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors" style={{ color: 'var(--v2-fg-muted)' }}>
                {l.label}
              </Link>
            ) : (
              <button key={l.label} onClick={() => handleTopLink(l)} className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors" style={{ color: 'var(--v2-fg-muted)' }}>
                {l.label}
              </button>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <V2ModeToggle mode={mode} onChange={setMode} />
          <a href="/cart" className="relative v2-btn-ghost w-9 h-9 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center" style={{ background: 'var(--v2-gold)', color: '#2a1f2b' }}>
                {cartCount}
              </span>
            )}
          </a>
        </div>
      </header>

      {/* ─── Río de chat (centrado mientras no arranca, scroll cuando arranca) ─── */}
      <main className={`flex-1 overflow-y-auto v2-scroll ${started ? '' : 'flex items-center justify-center'}`}>
        {!started ? (
          // HERO conversacional — orb + título + quick replies (input va abajo, fijo)
          <div className="w-full max-w-2xl mx-auto px-4 text-center pb-8">
            <div className="mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--v2-grad-action)', boxShadow: 'var(--v2-glow-gold)' }}>
              🐢
            </div>
            <h1 className="v2-display text-3xl sm:text-5xl mb-3" style={{ color: 'var(--v2-fg)' }}>
              Regalos que <span className="v2-display-italic" style={{ color: 'var(--v2-gold)' }}>cuidan el planeta</span>
            </h1>
            <p className="text-sm sm:text-base mb-7 max-w-lg mx-auto" style={{ color: 'var(--v2-fg-soft)' }}>
              Cuéntame qué buscas y te muestro el regalo perfecto — merchandising sustentable en plástico 100% reciclado chileno.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_REPLIES.map((q) => (
                <button key={q} onClick={() => ask(q.replace(/^[^\s]+\s/, ''))} className="v2-chip px-4 py-2 text-xs">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.reply_text && (
                  <div className="flex gap-2 max-w-[88%]">
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
                    )}
                    <div
                      className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words leading-relaxed"
                      style={m.role === 'user'
                        ? { background: 'var(--v2-grad-gold)', color: '#2a1f2b' }
                        : { background: 'var(--v2-surface)', color: 'var(--v2-fg-soft)', border: '1px solid var(--v2-border)' }}
                    >
                      {m.reply_text}
                    </div>
                  </div>
                )}
                {/* Cards emergen en el río */}
                {m.cards && m.cards.length > 0 && (
                  <div className={`flex flex-wrap gap-3 ${m.role === 'assistant' ? 'pl-9' : ''}`}>
                    {m.cards.map((card, ci) => (
                      <V2CardDispatcher key={ci} card={card} perfil={mode} handlers={cardHandlers} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{ background: 'var(--v2-grad-action)' }}>🐢</div>
                <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: 'var(--v2-surface)', border: '1px solid var(--v2-border)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)', animationDelay: '.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--v2-gold)', animationDelay: '.4s' }} />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </main>

      {/* ─── INPUT conversacional protagonista (siempre visible, abajo) ─── */}
      <div className="flex-shrink-0 px-4 pt-2 pb-4 pb-safe" style={{ borderTop: started ? '1px solid var(--v2-border)' : 'none' }}>
        <div className="max-w-2xl mx-auto">
          {/* quick replies persistentes una vez iniciada la conversación */}
          {started && (
            <div className="flex gap-2 overflow-x-auto v2-scrollbar-hide pb-2">
              {QUICK_REPLIES.map((q) => (
                <button key={q} onClick={() => ask(q.replace(/^[^\s]+\s/, ''))} className="v2-chip px-3 py-1.5 text-[11px] flex-shrink-0">
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="v2-input flex items-center gap-2 pl-4 pr-1.5 py-1.5">
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--v2-gold)' }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && ask()}
              placeholder={mode === 'b2b' ? 'Ej: 100 cachos con mi logo para mi empresa…' : 'Ej: un regalo sustentable bajo $25.000…'}
              className="flex-1 bg-transparent border-0 outline-none text-sm h-10"
              style={{ color: 'var(--v2-fg)' }}
              disabled={loading}
            />
            <button onClick={() => ask()} disabled={loading || !input.trim()} className="v2-btn-primary w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, ShoppingBag, Sparkles, ArrowLeft, Send, Zap, TrendingUp } from 'lucide-react';
import { addToCartV2, cartCountV2, fmtCLP } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';
import CockpitProductCard from '@/components/cockpit-store/CockpitProductCard';
import CopilotMessage from '@/components/cockpit-store/CopilotMessage';

// ════════════════════════════════════════════════════════════════════════
// /agent-cockpit — Agent Cockpit (RONDA 2).
// Layout copiloto: TIENDA scrollable 60% izquierda + AGENTE IA fijo 40%
// derecha (siempre visible, sigue al usuario). Estética dark "copiloto de
// productividad shopping". Paleta: #020617 · #0F8B6C · #22D3EE · #D96B4D.
// Tipografía Plus Jakarta Sans bold + Inter. Productos REALES de PEYU.
// Toggle B2C/B2B. Página independiente standalone.
// ════════════════════════════════════════════════════════════════════════

const CATS = ['Todos', 'Carcasas B2C', 'Entretenimiento', 'Hogar', 'Escritorio'];

const PROMPTS = [
  { q: 'Regalo para cumpleaños', filter: (p) => ['Carcasas B2C', 'Entretenimiento'].includes(p.categoria),
    a: 'Para un cumpleaños, estos son los favoritos — divertidos y sostenibles 🎁' },
  { q: 'Algo para mi escritorio', filter: (p) => ['Escritorio', 'Hogar'].includes(p.categoria),
    a: 'Te recomiendo estas piezas para tu escritorio, hechas con plástico reciclado:' },
  { q: 'Regalo corporativo con logo', filter: (p) => p.categoria === 'Corporativo' || p.categoria === 'Escritorio',
    a: 'Para empresas grabamos tu logo gratis desde 10 unidades 🔥 Estos son los más pedidos:' },
  { q: 'Lo más vendido', filter: () => true,
    a: 'Estos son nuestros productos estrella ahora mismo:' },
];

export default function AgentCockpit() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('Todos');
  const [modo, setModo] = useState('B2C');
  const [messages, setMessages] = useState([]);
  const [addedIds, setAddedIds] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Modo noche fijo (la página es dark).
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'night');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 300)
      .then((data) => { setProductos(data || []); setLoading(false); })
      .catch(() => setLoading(false));
    setCartCount(cartCountV2());
    setMessages([{ role: 'assistant', text: '¡Hola! Soy tu copiloto PEYU 🐢 Estoy aquí mientras navegas. Cuéntame qué buscas y te muestro lo ideal.' }]);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const filtered = productos.filter((p) => cat === 'Todos' || p.categoria === cat);

  const handleAdd = (producto) => {
    addToCartV2({
      productoId: producto.id,
      sku: producto.sku || null,
      nombre: producto.nombre,
      precio: producto.precio_b2c || 9990,
      cantidad: 1,
      imagen: producto.imagen_url,
      imagen_base: producto.imagen_url,
    });
    setAddedIds((a) => (a.includes(producto.id) ? a : [...a, producto.id]));
    setCartCount(cartCountV2());
  };

  const askPrompt = (prompt) => {
    setMessages((m) => [...m, { role: 'user', text: prompt.q }]);
    setTyping(true);
    setTimeout(() => {
      const recs = productos.filter(prompt.filter).slice(0, 3);
      setTyping(false);
      setMessages((m) => [...m, { role: 'assistant', text: prompt.a, productos: recs }]);
    }, 900);
  };

  const askProduct = (producto) => {
    setMessages((m) => [...m, { role: 'user', text: `Cuéntame del ${producto.nombre}` }]);
    setTyping(true);
    setTimeout(() => {
      const precio = producto.precio_b2c || 9990;
      const texto = `El ${producto.nombre} está ${fmtCLP(precio)}. Hecho con ${producto.material || 'plástico 100% reciclado'} en Chile. ${producto.categoria === 'Carcasas B2C' ? 'Puedes personalizarlo con grabado láser ✨' : 'Ideal para regalar con propósito 🌿'}`;
      setTyping(false);
      setMessages((m) => [...m, { role: 'assistant', text: texto, productos: [producto] }]);
    }, 800);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-inter text-white"
      style={{ background: 'radial-gradient(130% 90% at 0% 0%, #0B2A24 0%, #020617 45%, #0A0F1E 100%)' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 h-14 border-b"
        style={{ borderColor: 'rgba(255,255,255,.08)', background: 'rgba(2,6,23,.6)', backdropFilter: 'blur(14px)' }}>
        <div className="flex items-center gap-3">
          <Link to="/founders-presentation"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,.12)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: '#94A3B8' }} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[15px]">🐢</span>
            <p className="text-[15px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>PEYU Cockpit</p>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(34,211,238,.14)', color: '#22D3EE' }}>
              <Zap className="w-2.5 h-2.5" /> Copiloto IA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Toggle B2C / B2B */}
          <div className="flex rounded-full p-0.5" style={{ background: 'rgba(255,255,255,.06)' }}>
            {['B2C', 'B2B'].map((m) => (
              <button key={m} onClick={() => setModo(m)}
                className="px-3 py-1 rounded-full text-[12px] font-bold transition"
                style={modo === m ? { background: '#0F8B6C', color: '#fff' } : { color: '#94A3B8' }}>
                {m}
              </button>
            ))}
          </div>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <ShoppingBag className="w-[18px] h-[18px]" style={{ color: '#5EEAD4' }} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: '#D96B4D' }}>{cartCount}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY: tienda 60% + copiloto 40% ────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* TIENDA (60%) */}
        <section className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-4 lg:px-6 py-5">
          {/* Hero */}
          <div className="relative rounded-3xl overflow-hidden mb-5 p-6 lg:p-8"
            style={{ background: 'linear-gradient(135deg, rgba(15,139,108,.25), rgba(34,211,238,.08))', border: '1px solid rgba(255,255,255,.08)' }}>
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(15,139,108,.3)' }} />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-3"
                style={{ background: 'rgba(34,211,238,.15)', color: '#22D3EE' }}>
                <TrendingUp className="w-3 h-3" /> +59% conversión · regalos con propósito
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-2"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Regala una experiencia,<br />no solo un objeto.
              </h1>
              <p className="text-[14px] max-w-md" style={{ color: '#94A3B8' }}>
                Plástico 100% reciclado de Chile. Tu copiloto IA te ayuda a elegir el regalo perfecto — siempre a tu lado.
              </p>
            </div>
          </div>

          {/* Categorías */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition"
                style={cat === c
                  ? { background: '#0F8B6C', color: '#fff' }
                  : { background: 'rgba(255,255,255,.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,.08)' }}>
                {c.replace(' B2C', '')}
              </button>
            ))}
          </div>

          {/* Grid productos */}
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#0F8B6C' }} />
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3.5 pb-6">
              {filtered.slice(0, 30).map((p, i) => (
                <CockpitProductCard
                  key={p.id}
                  producto={p}
                  index={i}
                  added={addedIds.includes(p.id)}
                  onAdd={handleAdd}
                  onAskAgent={askProduct}
                />
              ))}
            </div>
          )}
        </section>

        {/* COPILOTO IA fijo (40%) */}
        <aside className="lg:w-[40%] lg:max-w-[440px] flex flex-col min-h-0 border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: 'rgba(255,255,255,.08)', background: 'rgba(2,6,23,.55)', backdropFilter: 'blur(10px)' }}>
          {/* header copiloto */}
          <div className="flex-shrink-0 px-4 py-3 border-b flex items-center gap-2.5" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px]"
              style={{ background: 'linear-gradient(135deg,#0F8B6C,#22D3EE)' }}>🐢</div>
            <div className="leading-tight">
              <p className="text-[14px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Copiloto PEYU</p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: '#5EEAD4' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#22D3EE' }} />
                Siempre a tu lado · modo {modo}
              </p>
            </div>
            <Sparkles className="w-4 h-4 ml-auto" style={{ color: '#22D3EE' }} />
          </div>

          {/* mensajes */}
          <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-4 py-4 space-y-4">
            {messages.map((m, i) => (
              <CopilotMessage key={i} role={m.role} text={m.text} productos={m.productos} addedIds={addedIds} onAdd={handleAdd} />
            ))}
            {typing && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[13px]" style={{ background: 'linear-gradient(135deg,#0F8B6C,#22D3EE)' }}>🐢</div>
                <div className="px-3.5 py-3 rounded-2xl flex gap-1" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
                  {[0, 1, 2].map((d) => (
                    <motion.span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: '#22D3EE' }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* prompts sugeridos + input */}
          <div className="flex-shrink-0 p-3 border-t space-y-2.5" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
            <div className="flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <button key={p.q} onClick={() => askPrompt(p)}
                  className="px-2.5 py-1.5 rounded-full text-[11.5px] font-semibold transition hover:-translate-y-0.5"
                  style={{ background: 'rgba(34,211,238,.1)', color: '#22D3EE', border: '1px solid rgba(34,211,238,.25)' }}>
                  {p.q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3.5 h-11 rounded-full" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}>
              <span className="flex-1 text-[13px]" style={{ color: '#64748B' }}>Pregúntame qué regalar…</span>
              <Send className="w-4 h-4" style={{ color: '#0F8B6C' }} />
            </div>
            {cartCount > 0 && (
              <Link to="/CarritoNuevo"
                className="flex items-center justify-between px-4 h-11 rounded-xl text-[13px] font-bold"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', color: '#fff', boxShadow: '0 6px 20px rgba(15,139,108,.4)' }}>
                <span>{cartCount} en tu carrito</span>
                <span className="flex items-center gap-1.5">Ir a pagar <ShoppingBag className="w-4 h-4" /></span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
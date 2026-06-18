import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingBag, Sparkles, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { addToCartV2, cartCountV2, fmtCLP } from '@/lib/shop-v2-cart';
import ChatBubbleSF from '@/components/storefront/ChatBubbleSF';
import QuickRepliesSF from '@/components/storefront/QuickRepliesSF';
import CanvasProductCard from '@/components/storefront/CanvasProductCard';

// ════════════════════════════════════════════════════════════════════════
// /storefront-chat — Conversational Storefront (RONDA 4).
// Layout sincronizado: CHAT 40% izquierda + CANVAS de productos 60% derecha.
// El asistente PEYU conversa, y al elegir respuestas el canvas se actualiza
// con productos REALES de PEYU. Estética Linear × Notion × Stripe.
// Paleta: #FAFAF7 · #0F8B6C · #A7D9C9 · #D96B4D · Fraunces italic + Jakarta.
// Página independiente standalone — no toca el resto del sitio.
// ════════════════════════════════════════════════════════════════════════

// Flujo conversacional. Cada "respuesta" filtra el catálogo PEYU para el canvas.
const SCRIPT = {
  start: {
    bot: ['¡Hola! Soy PEYU 🐢', 'Hacemos regalos con propósito en plástico 100% reciclado de Chile. ¿Para quién buscas hoy?'],
    options: [
      { label: '🎁 Un regalo personal', next: 'personal' },
      { label: '🏢 Regalo corporativo', next: 'corporativo' },
      { label: '🏡 Algo para mi hogar', next: 'hogar' },
    ],
  },
  personal: {
    bot: ['¡Genial! Para un regalo personal, los favoritos son las carcasas y los juegos.', 'Mira lo que armé para ti 👉'],
    filter: (p) => ['Carcasas B2C', 'Entretenimiento'].includes(p.categoria),
    options: [
      { label: '📱 Solo carcasas', next: 'carcasas' },
      { label: '🎲 Juegos & cachos', next: 'entretenimiento' },
      { label: '↩️ Volver', next: 'start' },
    ],
  },
  corporativo: {
    bot: ['Excelente. Para empresas grabamos tu logo gratis desde 10 unidades 🔥', 'Estos son los más pedidos por marcas:'],
    filter: (p) => p.categoria === 'Corporativo' || p.categoria === 'Escritorio',
    options: [
      { label: '💻 Sets de escritorio', next: 'escritorio' },
      { label: '↩️ Volver', next: 'start' },
    ],
  },
  hogar: {
    bot: ['Para el hogar tenemos piezas preciosas y sostenibles 🌿'],
    filter: (p) => p.categoria === 'Hogar',
    options: [
      { label: '↩️ Volver', next: 'start' },
    ],
  },
  carcasas: {
    bot: ['Carcasas biodegradables, livianas y resistentes. Elige tu modelo y la personalizas con láser.'],
    filter: (p) => p.categoria === 'Carcasas B2C',
    options: [{ label: '↩️ Volver', next: 'start' }],
  },
  entretenimiento: {
    bot: ['Cachos, jenga y paletas — hechos con tapitas recicladas. Perfectos para regalar.'],
    filter: (p) => p.categoria === 'Entretenimiento',
    options: [{ label: '↩️ Volver', next: 'start' }],
  },
  escritorio: {
    bot: ['Sets de escritorio para potenciar tu marca con propósito sostenible.'],
    filter: (p) => p.categoria === 'Escritorio' || p.categoria === 'Corporativo',
    options: [{ label: '↩️ Volver', next: 'start' }],
  },
};

export default function StorefrontChat() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [options, setOptions] = useState([]);
  const [canvas, setCanvas] = useState([]);
  const [addedIds, setAddedIds] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Modo día fijo (la página tiene su propia paleta clara).
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-liquid-mode');
    html.setAttribute('data-liquid-mode', 'day');
    return () => { if (prev) html.setAttribute('data-liquid-mode', prev); };
  }, []);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true }, '-updated_date', 300)
      .then((data) => {
        setProductos(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    setCartCount(cartCountV2());
  }, []);

  // Arranca la conversación cuando carga el catálogo.
  useEffect(() => {
    if (!loading && messages.length === 0) goToNode('start', true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const goToNode = (key, isFirst = false) => {
    const node = SCRIPT[key];
    if (!node) return;
    setOptions([]);
    setTyping(true);

    // Bot escribe los mensajes con un pequeño delay (efecto "typing").
    node.bot.forEach((text, i) => {
      setTimeout(() => {
        setMessages((m) => [...m, { role: 'assistant', text }]);
        if (i === node.bot.length - 1) {
          setTyping(false);
          setOptions(node.options || []);
        }
      }, 450 * (i + 1));
    });

    // Sincroniza el canvas con los productos del nodo.
    const delay = 450 * node.bot.length + 200;
    setTimeout(() => {
      if (node.filter) {
        const filtered = productos.filter(node.filter).slice(0, 6);
        setCanvas(filtered);
      } else if (isFirst) {
        // Pantalla inicial: muestra un mix destacado.
        setCanvas(productos.slice(0, 6));
      }
    }, delay);
  };

  const handlePick = (opt) => {
    setMessages((m) => [...m, { role: 'user', text: opt.label }]);
    setOptions([]);
    setTimeout(() => goToNode(opt.next), 300);
  };

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
    setAddedIds((a) => [...a, producto.id]);
    setCartCount(cartCountV2());
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden font-inter" style={{ background: '#FAFAF7', color: '#1C2421' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 h-14 border-b"
        style={{ borderColor: 'rgba(15,40,30,.07)', background: 'rgba(250,250,247,.9)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <Link to="/founders-presentation"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:bg-black/5"
            style={{ border: '1px solid rgba(15,40,30,.1)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: '#5A6B62' }} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[15px]">🐢</span>
            <div className="leading-tight">
              <p className="text-[14px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>PEYU Storefront</p>
              <p className="text-[11px] flex items-center gap-1" style={{ color: '#8FBFAE' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#0F8B6C' }} />
                En línea · responde al instante
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: '#A7D9C9', color: '#0B5C46' }}>
            <Sparkles className="w-3 h-3" /> Conversational Storefront
          </span>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ background: '#fff', border: '1px solid rgba(15,40,30,.08)' }}>
            <ShoppingBag className="w-4.5 h-4.5" style={{ color: '#0F8B6C', width: 18, height: 18 }} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: '#D96B4D' }}>{cartCount}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY: chat 40% + canvas 60% ────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

        {/* CHAT (40%) */}
        <section className="lg:w-[40%] lg:max-w-[480px] flex flex-col min-h-0 border-r"
          style={{ borderColor: 'rgba(15,40,30,.07)', background: '#fff' }}>
          <div className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-4 lg:px-5 py-5 space-y-3.5">
            {messages.map((m, i) => (
              <ChatBubbleSF key={i} role={m.role}>{m.text}</ChatBubbleSF>
            ))}
            {typing && (
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[15px]" style={{ background: '#0F8B6C' }}>🐢</div>
                <div className="px-4 py-3 rounded-[18px] rounded-bl-md flex gap-1" style={{ background: '#fff', border: '1px solid rgba(15,139,108,.12)' }}>
                  {[0, 1, 2].map((d) => (
                    <motion.span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: '#0F8B6C' }}
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                  ))}
                </div>
              </div>
            )}
            {options.length > 0 && <QuickRepliesSF options={options} onPick={handlePick} />}
            <div ref={chatEndRef} />
          </div>

          {/* Input decorativo (la conversación es por chips) */}
          <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'rgba(15,40,30,.07)' }}>
            <div className="flex items-center gap-2 px-3.5 h-11 rounded-full" style={{ background: '#F4F2EC' }}>
              <MessageSquare className="w-4 h-4" style={{ color: '#A0978A' }} />
              <span className="flex-1 text-[13px]" style={{ color: '#A0978A' }}>Elige una opción de arriba…</span>
              <Send className="w-4 h-4" style={{ color: '#0F8B6C' }} />
            </div>
          </div>
        </section>

        {/* CANVAS de productos (60%) */}
        <section className="flex-1 min-h-0 overflow-y-auto peyu-scrollbar px-4 lg:px-6 py-5"
          style={{ background: '#FAFAF7' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#0F8B6C' }} />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-[22px] leading-tight italic" style={{ fontFamily: 'Fraunces, serif', fontWeight: 500, color: '#1C2421' }}>
                  Tu vitrina, en vivo
                </h2>
                <p className="text-[13px] mt-0.5" style={{ color: '#5A6B62' }}>
                  El canvas se actualiza con cada respuesta del chat — {canvas.length} productos seleccionados para ti.
                </p>
              </div>
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {canvas.map((p, i) => (
                    <CanvasProductCard
                      key={p.id}
                      producto={p}
                      index={i}
                      added={addedIds.includes(p.id)}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </AnimatePresence>

              {cartCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="sticky bottom-0 mt-5 flex items-center justify-between px-4 py-3 rounded-2xl"
                  style={{ background: '#0F8B6C', boxShadow: '0 8px 28px rgba(15,139,108,.3)' }}
                >
                  <span className="text-[14px] font-bold text-white">{cartCount} producto{cartCount > 1 ? 's' : ''} en tu carrito</span>
                  <Link to="/CarritoNuevo"
                    className="px-4 h-10 rounded-xl flex items-center gap-1.5 text-[13px] font-bold"
                    style={{ background: '#fff', color: '#0F8B6C' }}>
                    Ir a pagar <ShoppingBag className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
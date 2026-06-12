import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, Loader2, Sparkles } from 'lucide-react';
import {
  ensureConversation, sendChatMessage, fetchMessages,
  extractSkus, extractCartActions, cartActionDone, markCartActionDone,
} from '@/lib/vendedor-chat';
import { addToCartV2 } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';
import VendedorMensaje from './VendedorMensaje';

// ════════════════════════════════════════════════════════════════════════
// VendedorChatBar — Vendedor IA PERSISTENTE de la tienda pública.
// Input central FIJO en la parte inferior de todas las páginas públicas.
// El agente trae productos al chat, los agrega al carrito ([[CART]]) y
// activa el flujo de pago ([[CHECKOUT]]) sin salir de la conversación.
// El hilo persiste en localStorage: sobrevive recargas y navegación.
// ════════════════════════════════════════════════════════════════════════
export default function VendedorChatBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [sending, setSending] = useState(false);
  const [productosBySku, setProductosBySku] = useState({});
  const scrollRef = useRef(null);
  const pollRef = useRef(null);

  // Restaura el hilo persistente al montar (si existe).
  useEffect(() => {
    const convId = localStorage.getItem('vendedor_peyu_conv_id');
    if (!convId) return;
    fetchMessages(convId).then((m) => { if (m.length) setMsgs(m); }).catch(() => {});
    return () => clearInterval(pollRef.current);
  }, []);

  // Resuelve los productos de los SKUs que el agente menciona (tarjetas).
  const resolverProductos = useCallback(async (mensajes) => {
    const skus = new Set();
    mensajes.forEach((m) => { if (m.role === 'assistant') extractSkus(m.content).forEach((s) => skus.add(s)); });
    const faltantes = [...skus].filter((s) => !productosBySku[s]);
    if (!faltantes.length) return;
    const results = await Promise.all(
      faltantes.map((sku) => base44.entities.Producto.filter({ sku }, undefined, 1).then((r) => r?.[0] || null).catch(() => null))
    );
    const nuevos = {};
    faltantes.forEach((sku, i) => { if (results[i]) nuevos[sku] = results[i]; });
    if (Object.keys(nuevos).length) setProductosBySku((prev) => ({ ...prev, ...nuevos }));
  }, [productosBySku]);

  // Ejecuta los [[CART:SKU:qty]] nuevos (idempotente por índice de mensaje).
  const ejecutarCartTags = useCallback(async (mensajes) => {
    for (let i = 0; i < mensajes.length; i++) {
      const m = mensajes[i];
      if (m.role !== 'assistant' || cartActionDone(i)) continue;
      const actions = extractCartActions(m.content);
      if (!actions.length) { continue; }
      for (const a of actions) {
        let p = productosBySku[a.sku];
        if (!p) {
          p = await base44.entities.Producto.filter({ sku: a.sku }, undefined, 1).then((r) => r?.[0]).catch(() => null);
        }
        if (p) {
          const img = getProductImage(p);
          addToCartV2({
            productoId: p.id, sku: p.sku || null, nombre: p.nombre,
            precio: p.precio_b2c || 0, cargo_personalizacion: 0,
            cantidad: a.cantidad, color: null, personalizacion: null,
            imagen: img, imagen_base: img,
          });
        }
      }
      markCartActionDone(i);
    }
  }, [productosBySku]);

  useEffect(() => {
    resolverProductos(msgs);
    ejecutarCartTags(msgs);
    // Auto-scroll al final
    setTimeout(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setOpen(true);
    setSending(true);
    setMsgs((prev) => [...prev, { role: 'user', content: text }]);
    try {
      const convId = await ensureConversation();
      const baseCount = msgs.filter((m) => m.role === 'assistant').length;
      await sendChatMessage(convId, text);

      // Polling hasta que el agente responda (máx ~50s)
      clearInterval(pollRef.current);
      let ticks = 0;
      pollRef.current = setInterval(async () => {
        ticks++;
        const m = await fetchMessages(convId).catch(() => null);
        if (m) {
          setMsgs(m);
          const asst = m.filter((x) => x.role === 'assistant').length;
          const last = m[m.length - 1];
          if (asst > baseCount && last?.role === 'assistant' && last.content) {
            clearInterval(pollRef.current);
            setSending(false);
          }
        }
        if (ticks > 30) { clearInterval(pollRef.current); setSending(false); }
      }, 1700);
    } catch {
      setSending(false);
    }
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-1rem)] max-w-xl bottom-[4.5rem] lg:bottom-4 pb-safe">
      {/* Panel de conversación */}
      {open && (
        <div
          className="mb-2 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          style={{ background: 'rgba(248,243,237,.97)', backdropFilter: 'blur(20px)', border: '1.5px solid #D4C4B0', height: 'min(58vh, 480px)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #E7D8C6', background: 'white' }}>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-base" style={{ background: 'rgba(15,139,108,.12)' }}>🐢</span>
              <div>
                <p className="text-xs font-bold" style={{ color: '#2C1810' }}>Peyu · Vendedor</p>
                <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: '#0F8B6C' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#0F8B6C' }} /> En línea — compra aquí mismo
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F0E8DE] transition-colors">
              <X className="w-4 h-4" style={{ color: '#7A6050' }} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto peyu-scrollbar px-3.5 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="text-center pt-8 px-4">
                <p className="text-2xl mb-2">🐢</p>
                <p className="text-sm font-bold" style={{ color: '#2C1810' }}>¡Hola! Soy Peyu, tu vendedor</p>
                <p className="text-xs mt-1" style={{ color: '#7A6050' }}>
                  Dime qué buscas y te muestro productos reales, los agrego a tu carro y pagas sin salir del chat 💚
                </p>
              </div>
            )}
            {msgs.map((m, i) => (
              <VendedorMensaje key={i} msg={m} productosBySku={productosBySku} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#0F8B6C' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#7A6050' }}>Peyu está escribiendo…</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input central fijo */}
      <div
        className="flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 shadow-xl"
        style={{ background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(16px)', border: '1.5px solid #D4C4B0' }}
        onClick={() => !open && msgs.length > 0 && setOpen(true)}
      >
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#C0785C' }} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          onFocus={() => msgs.length > 0 && setOpen(true)}
          placeholder="Pregúntale a Peyu 🐢 — busca, compra y paga aquí…"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
          style={{ color: '#2C1810' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
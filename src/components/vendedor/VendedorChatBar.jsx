import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, X, Loader2, Sparkles, ShoppingBag, Minus, History } from 'lucide-react';
import {
  ensureConversation, sendChatMessage, fetchMessages, resetConversation,
  extractSkus, extractCartActions, cartActionDone, markCartActionDone,
  extractLeadActions, leadActionDone, markLeadActionDone, saveLeadData,
  upsertHistory, activateConversation, startNewConversation,
} from '@/lib/vendedor-chat';
import VendedorHistorial from './VendedorHistorial';
import { addToCartV2, cartCountV2, subscribeCartV2 } from '@/lib/shop-v2-cart';
import { getProductImage } from '@/utils/productImages';
import VendedorMensaje from './VendedorMensaje';
import VendedorCartCard from './VendedorCartCard';
import { PEYU_AVATAR, PEYU_ICON } from '@/lib/shop-v2-config';

const QUICK_CHIPS = [
  '🎁 Busco un regalo',
  '🖥️ Algo para mi escritorio',
  '🎲 Un juego entretenido',
  '🏢 Compra para mi empresa',
];

export default function VendedorChatBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState([]);
  const [sending, setSending] = useState(false);
  const [productosBySku, setProductosBySku] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [cartCount, setCartCount] = useState(() => cartCountV2());
  const [unread, setUnread] = useState(0);
  const [showHistorial, setShowHistorial] = useState(false);
  const scrollRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);
  const lastAsstCountRef = useRef(0);

  useEffect(() => subscribeCartV2(() => setCartCount(cartCountV2())), []);

  // Al montar: guardamos el hilo activo (si tenía contenido) en el historial y
  // abrimos SIEMPRE en blanco. El usuario retoma un hilo desde el panel de
  // historial o empieza uno nuevo. Así el chat no arrastra la conversación
  // anterior al recargar, pero nada se pierde.
  useEffect(() => {
    const convId = localStorage.getItem('vendedor_peyu_conv_id');
    if (convId) {
      fetchMessages(convId).then((m) => {
        if (m.length) upsertHistory(convId, m);
      }).catch(() => {});
    }
    resetConversation(); // arranca en blanco
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retomar un hilo anterior del historial.
  const retomarConversacion = useCallback((convId) => {
    activateConversation(convId);
    setShowHistorial(false);
    setMsgs([]);
    fetchMessages(convId).then((m) => {
      setMsgs(m);
      lastAsstCountRef.current = m.filter((x) => x.role === 'assistant').length;
      setTimeout(() => scrollRef.current?.scrollTo({ top: 999999 }), 100);
    }).catch(() => {});
  }, []);

  // Iniciar un hilo nuevo: guarda el actual en historial y limpia.
  const nuevaConversacion = useCallback(() => {
    const convId = localStorage.getItem('vendedor_peyu_conv_id');
    if (convId && msgs.length) upsertHistory(convId, msgs);
    startNewConversation();
    setMsgs([]);
    setShowHistorial(false);
    lastAsstCountRef.current = 0;
  }, [msgs]);

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

  const ejecutarCartTags = useCallback(async (mensajes) => {
    for (let i = 0; i < mensajes.length; i++) {
      const m = mensajes[i];
      if (m.role !== 'assistant' || cartActionDone(i)) continue;
      const actions = extractCartActions(m.content);
      if (!actions.length) continue;
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

  const ejecutarLeadTags = useCallback(async (mensajes) => {
    const convId = localStorage.getItem('vendedor_peyu_conv_id');
    if (!convId) return;
    for (let i = 0; i < mensajes.length; i++) {
      const m = mensajes[i];
      if (m.role !== 'assistant' || leadActionDone(i)) continue;
      const actions = extractLeadActions(m.content);
      if (!actions.length) continue;
      markLeadActionDone(i);
      for (const fields of actions) {
        saveLeadData(convId, fields).catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    resolverProductos(msgs);
    ejecutarCartTags(msgs);
    ejecutarLeadTags(msgs);
    // Notificar mensajes no leídos si el panel está cerrado
    const newAsstCount = msgs.filter((m) => m.role === 'assistant').length;
    if (!open && newAsstCount > lastAsstCountRef.current) {
      setUnread((u) => u + (newAsstCount - lastAsstCountRef.current));
    }
    lastAsstCountRef.current = newAsstCount;
    setTimeout(() => { scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }); }, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs]);

  const handleSend = async (textParam) => {
    const text = (typeof textParam === 'string' ? textParam : input).trim();
    if (!text || sending) return;
    setInput('');
    setOpen(true);
    setUnread(0);
    setSending(true);
    setMsgs((prev) => [...prev, { role: 'user', content: text }]);
    try {
      const convId = await ensureConversation();
      const baseCount = msgs.filter((m) => m.role === 'assistant').length;
      await sendChatMessage(convId, text);

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
            upsertHistory(convId, m); // persiste el hilo en el historial
          }
        }
        // Polling más rápido (900ms) → la respuesta aparece casi al instante
        // cuando el agente termina, sin castigar al backend. Timeout ~55s.
        if (ticks > 60) { clearInterval(pollRef.current); setSending(false); }
      }, 900);
    } catch {
      setSending(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
    setTimeout(() => {
      inputRef.current?.focus();
      scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' });
    }, 100);
  };

  const handleClose = () => setOpen(false);

  // ── Layout mobile: full-screen (100vh) con safe areas ─────────────────
  return (
    <>
      {/* Panel de conversación — full-screen en mobile, panel lateral grande en desktop */}
      {open && (
        <div className="fixed inset-2 sm:inset-3 rounded-3xl overflow-hidden lg:inset-auto z-[110] flex flex-col lg:right-5 lg:bottom-5 lg:left-auto lg:w-[440px] xl:w-[480px] lg:rounded-3xl lg:overflow-hidden lg:shadow-2xl lg:h-[calc(100vh-2.5rem)] lg:max-h-[760px]"
          style={{ background: 'rgba(248,243,237,.98)', backdropFilter: 'blur(20px)', border: '1.5px solid #D4C4B0', boxShadow: '0 24px 70px rgba(44,24,16,.28)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 flex-shrink-0 pt-safe gap-2"
            style={{ borderBottom: '1px solid #E7D8C6', background: 'white' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#EAF3EF', border: '1.5px solid rgba(15,139,108,.2)' }}>
                <img src={PEYU_ICON} alt="PEYU" className="w-6 h-6 object-contain" draggable={false} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: '#2C1810' }}>Peyu · Vendedor</p>
                <p className="text-[10px] font-semibold flex items-center gap-1" style={{ color: '#0F8B6C' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#0F8B6C' }} /> <span className="truncate">En línea — compra aquí mismo</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setShowHistorial((v) => !v)}
                className="h-8 w-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[#F0E8DE]"
                style={{ border: '1px solid #E7D8C6', background: showHistorial ? '#F0E8DE' : 'transparent' }}
                title="Historial de conversaciones">
                <History className="w-4 h-4" style={{ color: '#7A6050' }} />
              </button>
              <button
                onClick={() => setShowCart((v) => !v)}
                className="relative h-8 px-2.5 rounded-xl flex items-center gap-1.5 transition-colors hover:bg-[#F0E8DE]"
                style={{ border: '1px solid #E7D8C6' }}
                title="Ver tu carro">
                <ShoppingBag className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
                {cartCount > 0 && (
                  <span className="min-w-[16px] h-4 px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#C0785C' }}>
                    {cartCount}
                  </span>
                )}
              </button>
              <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#F0E8DE] transition-colors">
                <Minus className="w-4 h-4 lg:hidden" style={{ color: '#7A6050' }} />
                <X className="w-4 h-4 hidden lg:block" style={{ color: '#7A6050' }} />
              </button>
            </div>
          </div>

          {/* Mensajes — ocupa el espacio disponible */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto peyu-scrollbar px-3.5 lg:px-4 py-3 lg:py-4 space-y-3">
            {showHistorial && (
              <VendedorHistorial onRetomar={retomarConversacion} onNuevo={nuevaConversacion} />
            )}
            {!showHistorial && msgs.length === 0 && (
              <div className="text-center pt-8 lg:pt-12 px-4">
                <span className="w-20 h-20 rounded-full overflow-hidden inline-block mb-3 shadow-md" style={{ background: '#EAF3EF', border: '2px solid rgba(15,139,108,.25)' }}>
                  <img src={PEYU_AVATAR} alt="Peyu" className="w-full h-full object-cover" draggable={false} />
                </span>
                <p className="text-base font-bold" style={{ color: '#2C1810' }}>¡Hola! Soy Peyu, tu vendedor</p>
                <p className="text-sm mt-1.5 mb-5 max-w-xs mx-auto" style={{ color: '#7A6050' }}>
                  Dime qué buscas y te muestro productos reales, los agrego a tu carro y pagas sin salir del chat 💚
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_CHIPS.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleSend(c)}
                      className="text-xs font-bold px-3.5 py-2.5 rounded-full transition-all hover:bg-[#F0E8DE] hover:-translate-y-0.5 active:scale-95"
                      style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!showHistorial && msgs.map((m, i) => (
              <VendedorMensaje key={i} msg={m} productosBySku={productosBySku} isLast={i === msgs.length - 1} />
            ))}
            {!showHistorial && sending && (
              <div className="flex items-end gap-2">
                <span className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#EAF3EF', border: '1px solid rgba(15,139,108,.2)' }}>
                  <img src={PEYU_AVATAR} alt="Peyu" className="w-full h-full object-cover" draggable={false} />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md px-3.5 py-3 shadow-sm" style={{ background: 'white', border: '1px solid #E7D8C6' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0F8B6C', animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0F8B6C', animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#0F8B6C', animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Carro pinned */}
          {showCart && (
            <div className="flex-shrink-0 px-3 pb-3 pt-1 overflow-y-auto peyu-scrollbar" style={{ maxHeight: '45%' }}>
              <VendedorCartCard showCheckout />
            </div>
          )}

          {/* Input — pegado abajo con safe area. En mobile full-screen el panel cubre todo. */}
          <div className="flex-shrink-0 px-3.5 sm:px-4 py-3 pb-safe" style={{ borderTop: '1px solid #E7D8C6', background: 'white' }}>
            <div className="flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5"
              style={{ background: '#F8F3ED', border: '1.5px solid #D4C4B0' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                enterKeyHint="send"
                placeholder="Pregúntale a Peyu…"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
                style={{ color: '#2C1810' }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90 disabled:opacity-50 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE CHAT — visible en mobile y desktop cuando el panel está cerrado.
          Píldora flotante centrada abajo (como en la imagen). Al hacer foco /
          escribir, se abre el panel a pantalla completa en mobile. En mobile se
          apoya justo sobre la barra de navegación inferior (bottom-[4.5rem]). */}
      {!open && (
        <div
          className="fixed z-[95] flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5 shadow-2xl
                     bottom-[4.5rem] left-3 right-3 lg:bottom-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[calc(100%-2rem)] lg:max-w-xl"
          style={{ background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', border: '1.5px solid #D4C4B0', boxShadow: '0 10px 40px rgba(15,139,108,.18)' }}>
          <span className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#EAF3EF', border: '1.5px solid rgba(15,139,108,.2)' }}>
            <img src={PEYU_AVATAR} alt="Peyu" className="w-full h-full object-cover" draggable={false} />
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleOpen}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            enterKeyHint="send"
            placeholder="Pregúntale a Peyu… compra aquí mismo 🐢"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm py-1.5"
            style={{ color: '#2C1810' }}
          />
          {unread > 0 && (
            <span className="min-w-[20px] h-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: '#D96B4D' }}>{unread}</span>
          )}
          <button
            onClick={() => (input.trim() ? handleSend() : handleOpen())}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all active:scale-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
            title="Hablar con Peyu">
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
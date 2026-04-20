import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';
import { ShoppingCart, Building2, MessageCircle, Star, Sparkles, ArrowRight, Package, Check } from 'lucide-react';
import ChatNavLink from '@/components/chat/ChatNavLink';
import ChatCheckoutCard from '@/components/chat/ChatCheckoutCard';

// Extracts the last quantity mentioned by the user in the current conversation
// (scans backwards through messages stored on DOM-adjacent state — we keep it
// stateless here and rely on a small helper reading the URL or returning null).
function getChatQty() {
  // Look for a global hint stashed by the page (set by ShopLanding/AsistenteChat)
  try {
    const v = parseInt(localStorage.getItem('peyu_chat_last_qty') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch { return null; }
}

function addToCart(producto, cantidad) {
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const precio = Math.floor((producto.precio_b2c || 9990) * 0.85);
  const nuevoItem = {
    id: Math.random(),
    productoId: producto.id,
    nombre: producto.nombre,
    precio,
    cantidad: cantidad || 1,
    color: null,
    personalizacion: null,
    imagen: getProductImage(producto.sku, producto.categoria),
  };
  carrito.push(nuevoItem);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  // Notificar al toast global
  window.dispatchEvent(new CustomEvent('peyu:cart-added', { detail: nuevoItem }));
}

/**
 * Parses the assistant text looking for tags like:
 *   [[PRODUCTO:SKU]]  — renders a rich product card
 *   [[ACTION:name]]   — renders an action button (cotizar_b2b, ir_a_shop, whatsapp)
 * and renders plain text in between.
 */

// Soporta:
//  [[PRODUCTO:SKU]]
//  [[ACTION:name]]            (cotizar_b2b | ir_a_shop | whatsapp)
//  [[NAV:/ruta]]              navegación interna
//  [[NAV:/ruta|Label]]        navegación con etiqueta custom
//  [[CHECKOUT]]               tarjeta de checkout in-chat
//  [[CART:SKU:qty]]           agregar producto directamente al carrito
const TAG_REGEX = /\[\[(PRODUCTO|ACTION|NAV|CHECKOUT|CART):?([^\]]*)\]\]/g;

function ProductCard({ sku }) {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.filter({ sku })
      .then(list => { if (alive) setProducto(list?.[0] || null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sku]);

  const qtyHint = getChatQty();
  const isB2BQty = qtyHint && qtyHint >= 10;
  const b2bUrl = producto
    ? `/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}${qtyHint ? `&qty=${qtyHint}` : ''}${producto.moq_personalizacion ? '&personalizacion=1' : ''}&from=chat&notas=${encodeURIComponent('Solicitud iniciada desde chat Peyu. Producto: ' + producto.nombre + (qtyHint ? ` · Cantidad sugerida: ${qtyHint}u.` : ''))}`
    : '#';

  // Persistir último producto mencionado para CTAs globales del chat
  useEffect(() => {
    if (producto?.id) {
      localStorage.setItem('peyu_chat_last_product', JSON.stringify({
        id: producto.id, nombre: producto.nombre, sku: producto.sku,
      }));
    }
  }, [producto]);

  const handleAdd = () => {
    if (!producto) return;
    addToCart(producto, qtyHint && qtyHint < 50 ? qtyHint : 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="my-2 bg-white/10 border border-white/20 rounded-xl p-3 animate-pulse flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!producto) return null;

  const precioOnline = Math.floor((producto.precio_b2c || 9990) * 0.85);
  const img = getProductImage(producto.sku, producto.categoria);

  return (
    <div className="my-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-teal-400/30 rounded-xl p-3 shadow-lg hover:border-teal-400/60 transition-all">
      <div className="flex gap-3">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-white/10">
          <img src={img} alt={producto.nombre} className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=400%2C400&ssl=1'; }} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-white/50">
            <span className="bg-teal-500/20 border border-teal-400/30 text-teal-300 px-1.5 py-0.5 rounded-full font-semibold">{producto.categoria}</span>
            <div className="flex gap-0.5 ml-auto">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
            </div>
          </div>
          <p className="font-semibold text-xs text-white line-clamp-2 leading-snug">{producto.nombre}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-white/40 line-through">${(producto.precio_b2c || 9990).toLocaleString('es-CL')}</span>
            <span className="font-poppins font-bold text-sm text-white">${precioOnline.toLocaleString('es-CL')}</span>
          </div>
          {producto.moq_personalizacion && (
            <p className="text-[10px] text-purple-300 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Láser gratis desde {producto.moq_personalizacion}u
            </p>
          )}
        </div>
      </div>
      {qtyHint >= 50 ? (
        // Modo B2B: priorizar cotización corporativa
        <>
          <Link to={b2bUrl} className="block mt-2.5">
            <button className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-bold rounded-lg py-2 transition-all shadow-md">
              <Building2 className="w-3.5 h-3.5" /> Cotizar {qtyHint}u con mi logo
            </button>
          </Link>
          <div className="grid grid-cols-2 gap-1.5 mt-1.5">
            <Link to={`/producto/${producto.id}`}>
              <button className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-semibold rounded-lg py-1.5 transition-all">
                <Package className="w-3 h-3" /> Ver ficha
              </button>
            </Link>
            <button
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-1 text-[11px] font-semibold rounded-lg py-1.5 transition-all border ${added ? 'bg-green-500/30 border-green-400/50 text-green-100' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/70'}`}
            >
              {added ? <><Check className="w-3 h-3" /> Listo</> : <><ShoppingCart className="w-3 h-3" /> Probar 1u</>}
            </button>
          </div>
        </>
      ) : (
        // Modo B2C: priorizar compra directa
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <Link to={`/producto/${producto.id}`}>
            <button className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-semibold rounded-lg py-1.5 transition-all">
              <Package className="w-3 h-3" /> Ficha
            </button>
          </Link>
          <button
            onClick={handleAdd}
            className={`w-full flex items-center justify-center gap-1 text-[11px] font-bold rounded-lg py-1.5 transition-all border ${added ? 'bg-green-500/30 border-green-400/50 text-green-100' : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-transparent'}`}
          >
            {added ? <><Check className="w-3 h-3" /> Agregado</> : <><ShoppingCart className="w-3 h-3" /> Comprar</>}
          </button>
          <Link to={b2bUrl}>
            <button className="w-full flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-semibold rounded-lg py-1.5 transition-all">
              <Building2 className="w-3 h-3" /> B2B
            </button>
          </Link>
        </div>
      )}
      {qtyHint && qtyHint < 50 && (
        <p className="text-[10px] text-white/50 mt-1.5 text-center">
          💡 Peyu detectó <span className="font-bold text-teal-300">{qtyHint}u.</span> — precargadas en B2B
        </p>
      )}
    </div>
  );
}

function buildB2BUrlFromChat() {
  const qty = getChatQty();
  let lastProd = null;
  try { lastProd = JSON.parse(localStorage.getItem('peyu_chat_last_product') || 'null'); } catch {}
  const params = new URLSearchParams();
  params.set('from', 'chat');
  if (lastProd?.id) params.set('productoId', lastProd.id);
  if (lastProd?.nombre) params.set('nombre', lastProd.nombre);
  if (qty) params.set('qty', String(qty));
  const notas = `Solicitud iniciada desde chat Peyu.${lastProd?.nombre ? ' Producto: ' + lastProd.nombre + '.' : ''}${qty ? ` Cantidad sugerida: ${qty}u.` : ''}`;
  params.set('notas', notas);
  return `/b2b/contacto?${params.toString()}`;
}

function ActionButton({ action }) {
  const ACTIONS = {
    cotizar_b2b: {
      label: 'Completar cotización B2B',
      icon: Building2,
      to: buildB2BUrlFromChat(),
      color: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
    },
    ir_a_shop: {
      label: 'Ver todos los productos',
      icon: ShoppingCart,
      to: '/shop',
      color: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600',
    },
    whatsapp: {
      label: 'Abrir WhatsApp',
      icon: MessageCircle,
      href: 'https://wa.me/56933766573?text=Hola%20Peyu%2C%20vengo%20del%20chat',
      color: 'bg-green-500 hover:bg-green-600',
    },
  };

  const a = ACTIONS[action];
  if (!a) return null;
  const Icon = a.icon;
  const inner = (
    <button className={`my-2 w-full flex items-center justify-between gap-2 ${a.color} text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all shadow-md hover:scale-[1.01]`}>
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" /> {a.label}
      </span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
  if (a.href) return <a href={a.href} target="_blank" rel="noreferrer">{inner}</a>;
  return <Link to={a.to}>{inner}</Link>;
}

/**
 * Lee SKU + qty de [[CART:SKU:qty]] y agrega al carrito silenciosamente.
 * Muestra un badge de confirmación.
 */
function CartInject({ spec }) {
  const [sku, qtyRaw] = spec.split(':');
  const qty = Math.max(1, parseInt(qtyRaw || '1', 10) || 1);
  const [done, setDone] = useState(false);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await base44.entities.Producto.filter({ sku });
      const producto = list?.[0];
      if (!producto || !alive) return;
      // Evitar duplicados si el mensaje se re-renderiza
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      const key = `peyu_chat_cart_added_${sku}_${qty}`;
      if (!sessionStorage.getItem(key)) {
        addToCart(producto, qty);
        sessionStorage.setItem(key, '1');
      }
      setNombre(producto.nombre);
      setDone(true);
    })();
    return () => { alive = false; };
  }, [sku, qty]);

  if (!done) return null;
  return (
    <div className="my-1.5 bg-green-500/20 border border-green-400/40 rounded-lg px-2.5 py-1.5 text-[11px] text-green-100 flex items-center gap-1.5">
      <Check className="w-3 h-3" />
      <span>Agregado: <b>{nombre}</b> × {qty}</span>
    </div>
  );
}

function ChatMessageContent({ content }) {
  if (!content) return null;

  const tokens = [];
  let lastIdx = 0;
  let match;
  const re = new RegExp(TAG_REGEX.source, 'g');
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    }
    tokens.push({ type: match[1], value: (match[2] || '').trim() });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) tokens.push({ type: 'text', value: content.slice(lastIdx) });

  return (
    <div className="space-y-1">
      {tokens.map((tk, i) => {
        if (tk.type === 'PRODUCTO') return <ProductCard key={i} sku={tk.value} />;
        if (tk.type === 'ACTION') return <ActionButton key={i} action={tk.value} />;
        if (tk.type === 'CHECKOUT') return <ChatCheckoutCard key={i} variant="dark" />;
        if (tk.type === 'CART') return <CartInject key={i} spec={tk.value} />;
        if (tk.type === 'NAV') {
          const [to, label] = tk.value.split('|').map(s => s.trim());
          return <ChatNavLink key={i} to={to} label={label} variant="dark" />;
        }
        const text = tk.value.replace(/\n{3,}/g, '\n\n').trim();
        if (!text) return null;
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {text}
          </p>
        );
      })}
    </div>
  );
}

export default memo(ChatMessageContent);
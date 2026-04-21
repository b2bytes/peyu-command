import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';
import { ShoppingCart, Building2, MessageCircle, ArrowRight, Check } from 'lucide-react';
import ChatNavLink from '@/components/chat/ChatNavLink';
import ChatCheckoutCard from '@/components/chat/ChatCheckoutCard';
import ChatProductCard from '@/components/chat/ChatProductCard';

function getChatQty() {
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
  window.dispatchEvent(new CustomEvent('peyu:cart-added', { detail: nuevoItem }));
}

const TAG_REGEX = /\[\[(PRODUCTO|ACTION|NAV|CHECKOUT|CART):?([^\]]*)\]\]/g;

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
    if (match.index > lastIdx) tokens.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    tokens.push({ type: match[1], value: (match[2] || '').trim() });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) tokens.push({ type: 'text', value: content.slice(lastIdx) });

  return (
    <div className="space-y-1">
      {tokens.map((tk, i) => {
        if (tk.type === 'PRODUCTO') return <ChatProductCard key={i} sku={tk.value} variant="dark" />;
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
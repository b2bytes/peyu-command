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

function markAgentNavigation() {
  try { localStorage.setItem('peyu_chat_agent_navigated_at', String(Date.now())); } catch {}
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
    imagen: getProductImage(producto),
  };
  carrito.push(nuevoItem);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  window.dispatchEvent(new CustomEvent('peyu:cart-added', { detail: nuevoItem }));
}

const TAG_REGEX = /\[\[(PRODUCTO|ACTION|NAV|CHECKOUT|CART|NEWSLETTER):?([^\]]*)\]\]/g;

// Limpia artefactos del [BRAIN]/contexto que a veces se fugan a la respuesta
// del agente (numeritos sueltos, paths del vector store, listados crudos).
// Esto evita el "muro negro" ilegible cuando el agente no formatea bien.
function sanitizeAgentText(raw) {
  if (!raw) return '';
  let t = String(raw);
  // Quitar referencias estilo "[7] (products)" / "[12] (customers)"
  t = t.replace(/\[\s*\d+\s*\]\s*\(\s*(products|customers|conversations|policies)[^)]*\)/gi, '');
  // Quitar paths sueltos tipo "(products/PROD-SKU)" o "PROD-XXX|nombre|categoria|precio"
  t = t.replace(/\(\s*(products|customers|conversations|policies)\/[^)]+\)/gi, '');
  t = t.replace(/^[A-Z0-9\-]{4,}\s*\|.*\|.*\|\s*\d+\s*$/gm, '');
  // Etiquetas técnicas que nunca deben llegar al usuario
  t = t.replace(/\[CONTEXTO\][^\n]*/g, '');
  t = t.replace(/\[BRAIN\][^\n]*/g, '');
  // Saltos triples → dobles
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
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

function ActionButtonLight({ action }) {
  const ACTIONS = {
    cotizar_b2b: {
      label: 'Completar cotización B2B',
      icon: Building2,
      to: buildB2BUrlFromChat(),
      color: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    },
    ir_a_shop: {
      label: 'Ver todos los productos',
      icon: ShoppingCart,
      to: '/shop',
      color: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700',
    },
    whatsapp: {
      label: 'Abrir WhatsApp',
      icon: MessageCircle,
      href: 'https://wa.me/56933766573?text=Hola%20Peyu%2C%20vengo%20del%20chat',
      color: 'bg-green-600 hover:bg-green-700',
    },
  };

  const a = ACTIONS[action];
  if (!a) return null;
  const Icon = a.icon;
  const inner = (
    <button className={`my-2 w-full flex items-center justify-between gap-2 ${a.color} text-white text-xs font-bold rounded-xl px-4 py-2.5 transition-all shadow-sm hover:scale-[1.01]`}>
      <span className="flex items-center gap-2">
        <Icon className="w-4 h-4" /> {a.label}
      </span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
  if (a.href) return <a href={a.href} target="_blank" rel="noreferrer">{inner}</a>;
  return <Link to={a.to} onClick={markAgentNavigation}>{inner}</Link>;
}

function CartInjectLight({ spec }) {
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
    <div className="my-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 text-[11px] text-green-700 flex items-center gap-1.5">
      <Check className="w-3 h-3" />
      <span>Agregado: <b>{nombre}</b> × {qty}</span>
    </div>
  );
}

function ChatMessageContentLight({ content }) {
  if (!content) return null;
  // Limpieza preventiva ANTES de parsear los tags, así los textos crudos del
  // brain nunca se renderizan como párrafos negros sin formato.
  const cleanContent = sanitizeAgentText(content);
  if (!cleanContent) return null;
  const tokens = [];
  let lastIdx = 0;
  let match;
  const re = new RegExp(TAG_REGEX.source, 'g');
  while ((match = re.exec(cleanContent)) !== null) {
    if (match.index > lastIdx) tokens.push({ type: 'text', value: cleanContent.slice(lastIdx, match.index) });
    tokens.push({ type: match[1], value: (match[2] || '').trim() });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < cleanContent.length) tokens.push({ type: 'text', value: cleanContent.slice(lastIdx) });

  return (
    <div className="space-y-1">
      {tokens.map((tk, i) => {
        if (tk.type === 'PRODUCTO') return <ChatProductCard key={i} sku={tk.value} variant="light" />;
        if (tk.type === 'ACTION') return <ActionButtonLight key={i} action={tk.value} />;
        if (tk.type === 'CHECKOUT') return <ChatCheckoutCard key={i} variant="light" />;
        if (tk.type === 'CART') return <CartInjectLight key={i} spec={tk.value} />;
        if (tk.type === 'NAV') {
          const [to, label] = tk.value.split('|').map(s => s.trim());
          return <ChatNavLink key={i} to={to} label={label} variant="light" />;
        }
        const text = tk.value.replace(/\n{3,}/g, '\n\n').trim();
        if (!text) return null;
        return <p key={i} className="whitespace-pre-wrap leading-relaxed">{text}</p>;
      })}
    </div>
  );
}

export default memo(ChatMessageContentLight);
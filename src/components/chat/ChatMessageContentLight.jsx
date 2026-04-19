import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';
import { ShoppingCart, Building2, MessageCircle, Star, Sparkles, ArrowRight, Package } from 'lucide-react';

const TAG_REGEX = /\[\[(PRODUCTO|ACTION):([^\]]+)\]\]/g;

function ProductCardLight({ sku }) {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.filter({ sku })
      .then(list => { if (alive) setProducto(list?.[0] || null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sku]);

  if (loading) {
    return (
      <div className="my-2 bg-gray-50 border border-gray-200 rounded-xl p-3 animate-pulse flex gap-3">
        <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!producto) return null;

  const precioOnline = Math.floor((producto.precio_b2c || 9990) * 0.85);
  const img = getProductImage(producto.sku, producto.categoria);

  return (
    <div className="my-2 bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-teal-400 hover:shadow-md transition-all">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
          <img src={img} alt={producto.nombre} className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=400%2C400&ssl=1'; }} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className="bg-teal-50 border border-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-semibold">{producto.categoria}</span>
            <div className="flex gap-0.5 ml-auto">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
            </div>
          </div>
          <p className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug">{producto.nombre}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-gray-400 line-through">${(producto.precio_b2c || 9990).toLocaleString('es-CL')}</span>
            <span className="font-poppins font-bold text-sm text-gray-900">${precioOnline.toLocaleString('es-CL')}</span>
          </div>
          {producto.moq_personalizacion && (
            <p className="text-[10px] text-purple-700 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Láser gratis desde {producto.moq_personalizacion}u
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2.5">
        <Link to={`/producto/${producto.id}`}>
          <button className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg py-1.5 transition-all">
            <Package className="w-3 h-3" /> Ver detalle
          </button>
        </Link>
        <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
          <button className="w-full flex items-center justify-center gap-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-[11px] font-bold rounded-lg py-1.5 transition-all shadow-sm">
            <Building2 className="w-3 h-3" /> Cotizar B2B
          </button>
        </Link>
      </div>
    </div>
  );
}

function ActionButtonLight({ action }) {
  const ACTIONS = {
    cotizar_b2b: {
      label: 'Completar cotización B2B',
      icon: Building2,
      to: '/b2b/contacto',
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
  return <Link to={a.to}>{inner}</Link>;
}

function ChatMessageContentLight({ content }) {
  if (!content) return null;
  const tokens = [];
  let lastIdx = 0;
  let match;
  const re = new RegExp(TAG_REGEX.source, 'g');
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIdx) tokens.push({ type: 'text', value: content.slice(lastIdx, match.index) });
    tokens.push({ type: match[1], value: match[2].trim() });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < content.length) tokens.push({ type: 'text', value: content.slice(lastIdx) });

  return (
    <div className="space-y-1">
      {tokens.map((tk, i) => {
        if (tk.type === 'PRODUCTO') return <ProductCardLight key={i} sku={tk.value} />;
        if (tk.type === 'ACTION') return <ActionButtonLight key={i} action={tk.value} />;
        const text = tk.value.replace(/\n{3,}/g, '\n\n').trim();
        if (!text) return null;
        return <p key={i} className="whitespace-pre-wrap leading-relaxed">{text}</p>;
      })}
    </div>
  );
}

export default memo(ChatMessageContentLight);
import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';
import {
  ShoppingCart, Building2, Sparkles, Package, Check, Recycle,
  Star, Zap, Truck, TrendingDown,
} from 'lucide-react';

/**
 * Tarjeta de producto UNIFICADA para el chat Peyu.
 * - Detecta B2C/B2B según `qtyHint`.
 * - Cuenta mini-historia (material + impacto + fit con cantidad).
 * - Precio adaptativo al volumen.
 * - CTAs coherentes con el flow comercial.
 *
 * Variants:
 *   'dark'  → chat dentro del landing (fondo oscuro translúcido)
 *   'light' → widget flotante (fondo claro)
 */

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
    imagen: getProductImage(producto.sku, producto.categoria),
  };
  carrito.push(nuevoItem);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  window.dispatchEvent(new CustomEvent('peyu:cart-added', { detail: nuevoItem }));
}

// Precio según cantidad — espejo de las reglas del agente
function getPriceForQty(p, qty) {
  if (!p) return { precio: 0, label: '', descuento: null };
  if (qty >= 500 && p.precio_500_mas) return { precio: p.precio_500_mas, label: 'Precio 500+ u', tier: 'maxvol' };
  if (qty >= 200 && p.precio_200_499) return { precio: p.precio_200_499, label: 'Precio 200-499 u', tier: 'vol' };
  if (qty >= 50 && p.precio_50_199) return { precio: p.precio_50_199, label: 'Precio 50-199 u', tier: 'vol' };
  if (qty >= 10 && p.precio_base_b2b) return { precio: p.precio_base_b2b, label: 'Precio B2B', tier: 'b2b' };
  const online = Math.floor((p.precio_b2c || 9990) * 0.85);
  return { precio: online, label: '-15% online', tier: 'b2c' };
}

// Mini-historia contextual del producto (muy breve, 1 frase)
function buildStory(p, isB2B, qty) {
  const material = p.material?.toLowerCase().includes('trigo')
    ? 'fibra de trigo compostable'
    : '100% plástico reciclado';

  if (isB2B && qty >= 200) {
    return `${material} · ideal para eventos masivos con logo grabado`;
  }
  if (isB2B) {
    return `${material} · grabado láser UV con tu logo sin costo extra`;
  }
  if (p.categoria === 'Hogar') return `${material} · pieza única hecha a mano`;
  if (p.categoria === 'Entretenimiento') return `${material} · perfecto para regalar`;
  if (p.categoria === 'Carcasas B2C') return `${material} · protección con estilo`;
  return `${material} · hecho en Chile con garantía 10 años`;
}

function ChatProductCard({ sku, variant = 'dark' }) {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const dark = variant === 'dark';

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.filter({ sku })
      .then(list => { if (alive) setProducto(list?.[0] || null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [sku]);

  // Persistir último producto para CTAs globales
  useEffect(() => {
    if (producto?.id) {
      localStorage.setItem('peyu_chat_last_product', JSON.stringify({
        id: producto.id, nombre: producto.nombre, sku: producto.sku,
      }));
    }
  }, [producto]);

  const qtyHint = getChatQty();
  const isB2B = qtyHint && qtyHint >= 10;

  const handleAdd = () => {
    if (!producto) return;
    addToCart(producto, qtyHint && qtyHint < 10 ? qtyHint : 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`my-2 border rounded-2xl p-3 animate-pulse flex gap-3 ${dark ? 'bg-white/5 border-white/15' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`w-20 h-20 rounded-xl flex-shrink-0 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-3 rounded w-3/4 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-3 rounded w-1/2 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-3 rounded w-1/3 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  if (!producto) return null;

  const img = getProductImage(producto.sku, producto.categoria);
  const { precio, label: priceLabel, tier } = getPriceForQty(producto, qtyHint || 1);
  const precioOnlineB2C = Math.floor((producto.precio_b2c || 9990) * 0.85);
  const story = buildStory(producto, isB2B, qtyHint || 1);

  const b2bUrl = `/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}${qtyHint ? `&qty=${qtyHint}` : ''}${producto.moq_personalizacion ? '&personalizacion=1' : ''}&from=chat&notas=${encodeURIComponent('Solicitud iniciada desde chat Peyu. Producto: ' + producto.nombre + (qtyHint ? ` · Cantidad sugerida: ${qtyHint}u.` : ''))}`;

  // Estilos base
  const cardBg = dark
    ? (isB2B
        ? 'bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-white/5 border-blue-400/40'
        : 'bg-gradient-to-br from-teal-500/15 via-cyan-500/10 to-white/5 border-teal-400/40')
    : (isB2B
        ? 'bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 border-blue-200'
        : 'bg-white border-gray-200');

  const titleColor = dark ? 'text-white' : 'text-gray-900';
  const mutedColor = dark ? 'text-white/55' : 'text-gray-500';
  const accentColor = dark
    ? (isB2B ? 'text-blue-300' : 'text-teal-300')
    : (isB2B ? 'text-blue-700' : 'text-teal-700');
  const catBadgeCls = dark
    ? 'bg-white/10 border-white/20 text-white/80'
    : 'bg-gray-100 border-gray-200 text-gray-700';
  const storyBgCls = dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100';

  return (
    <div className={`my-2 ${cardBg} border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all`}>

      {/* Ribbon B2B (solo visible cuando isB2B) */}
      {isB2B && (
        <div className={`px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${dark ? 'bg-blue-500/25 text-blue-200' : 'bg-blue-600 text-white'}`}>
          <Building2 className="w-3 h-3" />
          <span>Corporativo · {qtyHint}u detectadas</span>
        </div>
      )}

      {/* Cabecera con imagen + info */}
      <div className="p-3 flex gap-3">
        <div className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border ${dark ? 'border-white/10 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
          <img
            src={img}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=400%2C400&ssl=1'; }}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badge + rating */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${catBadgeCls}`}>
              {producto.categoria}
            </span>
            <div className="flex gap-0.5 ml-auto">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
            </div>
          </div>

          {/* Nombre */}
          <p className={`font-semibold text-[13px] leading-tight line-clamp-2 ${titleColor}`}>
            {producto.nombre}
          </p>

          {/* Precio — vuelve a renderizarse según tier */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-poppins font-bold text-base ${titleColor}`}>
              ${precio.toLocaleString('es-CL')}
            </span>
            <span className={`text-[10px] ${mutedColor}`}>por u · {priceLabel}</span>
            {isB2B && qtyHint && (
              <span className={`text-[10px] font-bold ${accentColor} flex items-center gap-0.5`}>
                <TrendingDown className="w-2.5 h-2.5" /> Total ${(precio * qtyHint).toLocaleString('es-CL')}
              </span>
            )}
          </div>

          {/* B2C: precio tachado */}
          {!isB2B && producto.precio_b2c && (
            <p className={`text-[10px] ${mutedColor} line-through`}>
              Normal ${producto.precio_b2c.toLocaleString('es-CL')}
            </p>
          )}
        </div>
      </div>

      {/* Historia / Story strip */}
      <div className={`mx-3 mb-2 px-2.5 py-1.5 rounded-lg border ${storyBgCls} flex items-center gap-1.5`}>
        <Recycle className={`w-3 h-3 flex-shrink-0 ${accentColor}`} />
        <p className={`text-[10.5px] leading-snug ${mutedColor}`}>
          {story}
        </p>
      </div>

      {/* Beneficios (chips) */}
      <div className="px-3 pb-2 flex flex-wrap gap-1">
        {producto.moq_personalizacion && (
          <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${dark ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
            <Sparkles className="w-2.5 h-2.5" /> Láser gratis ≥{producto.moq_personalizacion}u
          </span>
        )}
        {producto.lead_time_con_personal && (
          <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${dark ? 'bg-white/10 text-white/70 border border-white/15' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
            <Truck className="w-2.5 h-2.5" /> {producto.lead_time_con_personal}d lead time
          </span>
        )}
        <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${dark ? 'bg-white/10 text-white/70 border border-white/15' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
          <Zap className="w-2.5 h-2.5" /> {producto.garantia_anios || 10}a garantía
        </span>
      </div>

      {/* CTAs — diferenciados B2B vs B2C */}
      <div className="px-3 pb-3">
        {isB2B ? (
          // FLOW B2B: destacar cotización corporativa
          <>
            <Link to={b2bUrl} onClick={markAgentNavigation} className="block">
              <button className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg py-2.5 shadow-md transition-all ${dark ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'}`}>
                <Building2 className="w-3.5 h-3.5" /> Cotizar {qtyHint}u con mi logo
              </button>
            </Link>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <Link to={`/producto/${producto.id}`} onClick={markAgentNavigation}>
                <button className={`w-full flex items-center justify-center gap-1 text-[11px] font-semibold rounded-lg py-1.5 transition-all border ${dark ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`}>
                  <Package className="w-3 h-3" /> Ver ficha
                </button>
              </Link>
              <button
                onClick={handleAdd}
                className={`w-full flex items-center justify-center gap-1 text-[11px] font-semibold rounded-lg py-1.5 transition-all border ${added ? (dark ? 'bg-green-500/25 border-green-400/50 text-green-100' : 'bg-green-50 border-green-300 text-green-700') : (dark ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700')}`}
              >
                {added ? <><Check className="w-3 h-3" /> Listo</> : <><ShoppingCart className="w-3 h-3" /> Probar 1u</>}
              </button>
            </div>
          </>
        ) : (
          // FLOW B2C: destacar compra directa
          <>
            <button
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg py-2.5 shadow-md transition-all ${added ? (dark ? 'bg-green-500/30 border border-green-400/50 text-green-100' : 'bg-green-50 border border-green-300 text-green-700') : (dark ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white' : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white')}`}
            >
              {added
                ? <><Check className="w-3.5 h-3.5" /> Agregado al carrito</>
                : <><ShoppingCart className="w-3.5 h-3.5" /> Agregar por ${precioOnlineB2C.toLocaleString('es-CL')}</>}
            </button>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <Link to={`/producto/${producto.id}`} onClick={markAgentNavigation}>
                <button className={`w-full flex items-center justify-center gap-1 text-[11px] font-semibold rounded-lg py-1.5 transition-all border ${dark ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`}>
                  <Package className="w-3 h-3" /> Ver ficha
                </button>
              </Link>
              <Link to={b2bUrl} onClick={markAgentNavigation}>
                <button className={`w-full flex items-center justify-center gap-1 text-[11px] font-semibold rounded-lg py-1.5 transition-all border ${dark ? 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-400/30 text-blue-200' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'}`}>
                  <Building2 className="w-3 h-3" /> ¿+10u? Cotizar B2B
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(ChatProductCard);
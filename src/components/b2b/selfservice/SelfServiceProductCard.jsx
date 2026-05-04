import { useState } from 'react';
import { Plus, Minus, Check, TrendingDown, Sparkles } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

/**
 * Card de producto premium para B2B Self-Service.
 * Diseño UI/UX 2027 trend: imagen grande estilo ecommerce, hover lift,
 * badge de categoría flotante, indicador de descuento por volumen,
 * estado "in-cart" con quick-qty controls.
 */
export default function SelfServiceProductCard({ producto, inCart, onAdd, onUpdateQty, onRemove }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageUrl = getProductImage(producto);
  const precioBase = producto.precio_base_b2b || producto.precio_b2c || 5000;

  // Mejor descuento disponible (vs precio_b2c) para mostrar ahorro %
  const ahorroPct = producto.precio_b2c && producto.precio_500_mas
    ? Math.round(((producto.precio_b2c - producto.precio_500_mas) / producto.precio_b2c) * 100)
    : null;

  const cantidad = inCart?.cantidad || 0;

  return (
    <article
      className={`group relative bg-white/[0.04] backdrop-blur-xl rounded-3xl overflow-hidden border transition-all duration-300 ${
        inCart
          ? 'border-teal-400/60 shadow-[0_0_0_1px_rgba(45,212,191,0.3),0_20px_40px_-15px_rgba(45,212,191,0.25)]'
          : 'border-white/10 hover:border-white/25 hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30'
      }`}
    >
      {/* Imagen del producto — protagonista */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-800/50 to-slate-900/50 overflow-hidden">
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer" />
        )}
        <img
          src={imageUrl}
          alt={producto.nombre}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imgLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
          }`}
        />

        {/* Overlay gradient para legibilidad de badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />

        {/* Badge categoría — flotante top-left */}
        {producto.categoria && (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white/90 px-2 py-1 rounded-full border border-white/15">
              {producto.categoria}
            </span>
          </div>
        )}

        {/* Badge ahorro por volumen — flotante top-right */}
        {ahorroPct && ahorroPct > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 px-2 py-1 rounded-full shadow-lg">
              <TrendingDown className="w-2.5 h-2.5" />
              −{ahorroPct}%
            </span>
          </div>
        )}

        {/* Estado "en carrito" overlay */}
        {inCart && (
          <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-bold bg-teal-500/90 backdrop-blur-md text-white px-2 py-1 rounded-full shadow-lg animate-in fade-in zoom-in duration-300">
            <Check className="w-3 h-3" />
            En tu pedido
          </div>
        )}
      </div>

      {/* Info producto */}
      <div className="p-3.5 sm:p-4">
        <h3 className="font-poppins font-bold text-sm text-white leading-tight line-clamp-2 mb-1 min-h-[2.5rem]">
          {producto.nombre}
        </h3>
        <p className="text-[10px] text-white/35 font-mono mb-3">{producto.sku}</p>

        {/* Precio + CTA */}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] text-white/45 leading-none mb-0.5">Desde 10 u.</p>
            <p className="font-poppins font-extrabold text-lg sm:text-xl text-white leading-none tracking-tight">
              ${precioBase.toLocaleString('es-CL')}
            </p>
            {producto.precio_b2c && producto.precio_b2c > precioBase && (
              <p className="text-[10px] text-white/30 line-through mt-0.5">
                ${producto.precio_b2c.toLocaleString('es-CL')}
              </p>
            )}
          </div>

          {/* Acciones — cambia entre "Agregar" y controles +/− cuando está en carrito */}
          {!inCart ? (
            <button
              onClick={() => onAdd(producto)}
              className="inline-flex items-center gap-1 bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 active:from-teal-600 active:to-cyan-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 transition-all hover:shadow-teal-500/50 hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar
            </button>
          ) : (
            <div className="flex items-center bg-teal-500/20 border border-teal-400/40 rounded-xl overflow-hidden">
              <button
                onClick={() => cantidad <= 10 ? onRemove(producto.id) : onUpdateQty(producto.id, -10)}
                className="w-8 h-9 flex items-center justify-center text-white hover:bg-teal-500/30 active:bg-teal-500/40 transition"
                aria-label="Restar 10"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-sm font-bold text-white tabular-nums min-w-[2rem] text-center">
                {cantidad}
              </span>
              <button
                onClick={() => onUpdateQty(producto.id, 10)}
                className="w-8 h-9 flex items-center justify-center text-white hover:bg-teal-500/30 active:bg-teal-500/40 transition"
                aria-label="Sumar 10"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Strip de tier pricing — sutil */}
        {(producto.precio_50_199 || producto.precio_200_499 || producto.precio_500_mas) && (
          <div className="mt-3 pt-3 border-t border-white/8">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Sparkles className="w-3 h-3 text-amber-300/80 flex-shrink-0" />
              <p className="text-[10px] text-white/50 font-medium">
                Precios por volumen disponibles
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

/**
 * Tarjeta de producto del Shop — diseño 2026 (Apple/Allbirds inspired).
 * Memoizada para evitar re-renders en scroll. Animación de entrada con
 * skeleton hasta que la imagen carga (evita layout shift y "flash" feo).
 */
function ProductCard({ producto, onAddToCart, agregandoId, index = 0 }) {
  const p = producto;
  const precioOnline = Math.floor((p.precio_b2c || 9990) * 0.85);
  const isAdding = agregandoId === p.id;
  const [imgLoaded, setImgLoaded] = useState(false);

  // Stagger animation — primeros 12 productos animan en cascada
  const animDelay = index < 12 ? `${index * 40}ms` : '0ms';

  return (
    <Link
      to={`/producto/${p.id}`}
      style={{ animationDelay: animDelay }}
      className="peyu-card-enter group bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden hover:border-teal-400/40 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 will-change-transform"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {/* Skeleton shimmer mientras carga la imagen */}
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer" aria-hidden="true" />
        )}
        <img
          src={getProductImage(p)}
          alt={p.nombre}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop'; setImgLoaded(true); }}
        />
        {/* Floating badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-white/20">
            {p.categoria}
          </span>
          {p.material?.includes('Trigo') && (
            <span className="bg-green-600/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              🌾 Compostable
            </span>
          )}
        </div>
        {/* Discount pill */}
        <div className="absolute top-3 right-3">
          <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            −15%
          </span>
        </div>
        {/* Quick add — siempre visible en mobile (touch), hover en desktop */}
        <button
          onClick={(e) => onAddToCart(e, p)}
          className={`absolute bottom-3 right-3 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
            isAdding
              ? 'bg-green-500 scale-110'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 hover:from-teal-600 hover:to-cyan-600 active:scale-90'
          }`}
          aria-label="Agregar al carrito"
        >
          {isAdding ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-4 h-4" />}
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-[10px] text-white/50 font-medium hidden sm:inline">(4.9)</span>
        </div>
        <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors min-h-[40px]">
          {p.nombre}
        </h3>
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <p className="text-[10px] text-white/40 line-through font-medium">
              ${(p.precio_b2c || 9990).toLocaleString('es-CL')}
            </p>
            <p className="font-poppins font-bold text-lg text-white leading-none">
              ${precioOnline.toLocaleString('es-CL')}
            </p>
          </div>
          <span className="text-[10px] text-white/40 font-medium">Envío 7 días</span>
        </div>
      </div>
    </Link>
  );
}

// Memoizar: solo re-renderiza si cambia el producto o el estado "agregando" para este id
export default memo(ProductCard, (prev, next) => {
  return (
    prev.producto.id === next.producto.id &&
    prev.index === next.index &&
    (prev.agregandoId === prev.producto.id) === (next.agregandoId === next.producto.id)
  );
});
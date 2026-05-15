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
  const precio = p.precio_b2c || 9990;
  const isAdding = agregandoId === p.id;
  const [imgLoaded, setImgLoaded] = useState(false);

  // Stagger animation — primeros 12 productos animan en cascada
  const animDelay = index < 12 ? `${index * 40}ms` : '0ms';

  return (
    <Link
      to={`/producto/${p.id}`}
      style={{ animationDelay: animDelay }}
      className="peyu-card-enter ld-card group overflow-hidden hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 will-change-transform"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--ld-bg-soft)' }}>
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer" aria-hidden="true" />
        )}
        <img
          src={getProductImage(p)}
          alt={`${p.nombre} · ${p.categoria || 'PEYU'} · ${p.material?.includes('Trigo') ? 'Fibra de trigo compostable' : 'Plástico 100% reciclado'} · Hecho en Chile`}
          width="600"
          height="600"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          style={{
            opacity: imgLoaded ? 1 : 0,
            color: 'transparent', // oculta alt text si falla la carga
          }}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchpriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            // Guard anti-loop: si el fallback también falla, NO seguimos cambiando src
            // (evita el "infinite error" cuando Unsplash u otro CDN está caído).
            if (e.target.dataset.fallbackTried === '1') {
              setImgLoaded(true);
              return;
            }
            e.target.dataset.fallbackTried = '1';
            e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop';
            setImgLoaded(true);
          }}
        />
        {/* Floating badges glass */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="ld-glass text-ld-fg text-[10px] font-bold px-2.5 py-1 rounded-full">
            {p.categoria}
          </span>
          {p.material?.includes('Trigo') && (
            <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'var(--ld-action)' }}>
              🌾 Compostable
            </span>
          )}
        </div>
        {/* Quick add */}
        <button
          onClick={(e) => onAddToCart(e, p)}
          className={`absolute bottom-3 right-3 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
            isAdding
              ? 'scale-110'
              : 'ld-btn-primary opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 active:scale-90'
          }`}
          style={isAdding ? { background: 'var(--ld-action)' } : undefined}
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
          <span className="text-[10px] text-ld-fg-muted font-medium hidden sm:inline">(4.9)</span>
        </div>
        <h3 className="font-semibold text-sm text-ld-fg line-clamp-2 leading-snug group-hover:opacity-80 transition-colors min-h-[40px]">
          {p.nombre}
        </h3>
        <div className="flex items-baseline justify-between mt-3">
          <p className="font-jakarta font-bold text-lg text-ld-fg leading-none">
            ${precio.toLocaleString('es-CL')}
          </p>
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
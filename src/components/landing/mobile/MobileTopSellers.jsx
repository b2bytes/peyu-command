import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, ArrowRight } from 'lucide-react';

/**
 * Carrusel horizontal "Lo más regalado" — productos reales destacados.
 * Scroll horizontal nativo móvil, snap a cada card.
 */
export default function MobileTopSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Producto.filter({ activo: true }, '-created_date', 50);
        // Priorizar los que tienen imagen + stock
        const ranked = all
          .filter(p => p.imagen_url && p.activo !== false)
          .sort((a, b) => (b.stock_actual || 0) - (a.stock_actual || 0))
          .slice(0, 8);
        setProducts(ranked);
      } catch (e) {
        console.warn('TopSellers load:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="pb-5">
      <div className="flex items-center justify-between px-4 mb-3">
        <div>
          <h2 className="text-white font-poppins font-bold text-base flex items-center gap-1.5">
            <span className="text-yellow-400">⭐</span> Lo más regalado
          </h2>
          <p className="text-white/55 text-[10px] font-medium">Top elegidos por clientes PEYU</p>
        </div>
        <Link to="/shop" className="text-teal-300 text-[11px] font-semibold flex items-center gap-1 hover:text-teal-200">
          Ver todo →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory pb-1">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[150px] aspect-[3/4] rounded-2xl bg-white/5 peyu-shimmer snap-start" />
            ))
          : products.map((p) => (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                className="flex-shrink-0 w-[150px] snap-start group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-2 active:scale-95 transition-transform">
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Badge categoria */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
                    {p.categoria}
                  </div>
                  {/* Stars */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-[9px] font-bold">4.8</span>
                  </div>
                </div>
                <p className="text-white text-[12px] font-semibold leading-tight line-clamp-2 mb-1 px-0.5">
                  {p.nombre}
                </p>
                <p className="text-teal-300 text-[13px] font-bold px-0.5">
                  ${(p.precio_b2c || 0).toLocaleString('es-CL')}
                </p>
              </Link>
            ))}
        {/* Card final "Ver todo" */}
        {!loading && products.length > 0 && (
          <Link
            to="/shop"
            className="flex-shrink-0 w-[150px] aspect-[3/4] rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-400/30 flex flex-col items-center justify-center gap-2 snap-start active:scale-95 transition"
          >
            <ArrowRight className="w-6 h-6 text-teal-300" />
            <span className="text-white text-[12px] font-bold">Ver toda la tienda</span>
            <span className="text-white/60 text-[10px]">+50 productos</span>
          </Link>
        )}
      </div>
    </section>
  );
}
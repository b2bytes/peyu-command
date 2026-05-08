import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, ArrowRight } from 'lucide-react';

/**
 * Grid 4-columnas de top sellers para desktop.
 * Mismos productos REALES del top sellers móvil pero con cards más grandes y hover.
 */
export default function DesktopTopSellers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.Producto.filter({ activo: true }, '-created_date', 50);
        const ranked = all
          .filter(p => p.imagen_url && p.activo !== false)
          .sort((a, b) => (b.stock_actual || 0) - (a.stock_actual || 0))
          .slice(0, 8);
        setProducts(ranked);
      } catch (e) {
        console.warn('Desktop TopSellers:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-yellow-300 text-[11px] font-bold tracking-[0.2em] uppercase mb-1">⭐ Top Sellers</p>
          <h2 className="text-white font-poppins font-black text-3xl">Lo más regalado</h2>
          <p className="text-white/55 text-sm mt-1">Los favoritos de nuestros clientes</p>
        </div>
        <Link to="/shop" className="text-teal-300 text-sm font-semibold hover:text-teal-200 flex items-center gap-1 transition">
          Ver toda la tienda →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 peyu-shimmer" />
            ))
          : products.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-3 hover:border-teal-400/40 hover:scale-[1.02] transition-all duration-300">
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    {p.categoria}
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-[10px] font-bold">4.8</span>
                  </div>
                  {/* Quick view overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-center pb-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      Ver detalle <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <p className="text-white text-sm font-semibold leading-tight line-clamp-2 mb-1">
                  {p.nombre}
                </p>
                <p className="text-teal-300 text-base font-bold">
                  ${(p.precio_b2c || 0).toLocaleString('es-CL')}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
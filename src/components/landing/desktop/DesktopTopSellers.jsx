import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Star, ArrowUpRight } from 'lucide-react';

/**
 * Top sellers Liquid Dual — cards editoriales con vidrio auto-adaptativo.
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
    <section className="px-6 py-12">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: 'var(--ld-highlight)' }}>
            ★ Top Sellers
          </p>
          <h2 className="ld-display text-4xl xl:text-5xl text-ld-fg">
            Lo más <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>regalado</span>
          </h2>
          <p className="text-ld-fg-muted text-sm mt-2">Los favoritos de nuestros clientes</p>
        </div>
        <Link
          to="/shop"
          className="text-sm font-semibold flex items-center gap-1 transition hover:opacity-80"
          style={{ color: 'var(--ld-action)' }}
        >
          Ver toda la tienda <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl peyu-shimmer" style={{ background: 'var(--ld-bg-soft)' }} />
            ))
          : products.slice(0, 8).map((p) => (
              <Link key={p.id} to={`/producto/${p.id}`} className="group block">
                <div
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 transition-all duration-300 group-hover:-translate-y-1"
                  style={{
                    background: 'var(--ld-bg-soft)',
                    border: '1px solid var(--ld-border)',
                    boxShadow: 'var(--ld-shadow-sm)',
                  }}
                >
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div
                    className="absolute top-3 left-3 backdrop-blur-md text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--ld-glass-strong)', color: 'var(--ld-fg)', border: '1px solid var(--ld-glass-border)' }}
                  >
                    {p.categoria}
                  </div>
                  <div
                    className="absolute bottom-3 left-3 flex items-center gap-1 backdrop-blur-md rounded-md px-2 py-1"
                    style={{ background: 'var(--ld-glass-strong)', border: '1px solid var(--ld-glass-border)' }}
                  >
                    <Star className="w-3 h-3" style={{ color: 'var(--ld-highlight)', fill: 'var(--ld-highlight)' }} />
                    <span className="text-[10px] font-bold text-ld-fg">4.8</span>
                  </div>
                </div>
                <p className="text-sm font-semibold leading-tight line-clamp-2 mb-1 text-ld-fg">{p.nombre}</p>
                <p className="text-base font-bold" style={{ color: 'var(--ld-action)' }}>
                  ${(p.precio_b2c || 0).toLocaleString('es-CL')}
                </p>
              </Link>
            ))}
      </div>
    </section>
  );
}
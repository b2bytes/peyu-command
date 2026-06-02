import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { isCyberActive, tieneOfertaCyber, descuentoCyberPct } from '@/lib/cyber-campaign';

/**
 * Sección "🔥 Destacados Cyber" — carrusel horizontal limpio arriba del grid.
 * Muestra productos en oferta real; si no hay ofertas cargadas, cae a los
 * best-sellers que reciba por prop. No renderiza si la campaña está apagada
 * o no hay productos.
 */
export default function CyberFeaturedRow({ productos = [] }) {
  if (!isCyberActive() || !productos.length) return null;

  const enOferta = productos.filter(tieneOfertaCyber);
  const lista = (enOferta.length ? enOferta : productos).slice(0, 12);
  if (!lista.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4" style={{ color: 'var(--ld-highlight)' }} />
        <h2 className="font-jakarta font-bold text-ld-fg text-base sm:text-lg">Destacados Cyber</h2>
        <span className="text-xs text-ld-fg-muted">· selección con causa</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {lista.map((p) => {
          const oferta = tieneOfertaCyber(p);
          const pct = descuentoCyberPct(p);
          return (
            <Link
              key={p.id}
              to={`/producto/${p.id}`}
              className="ld-card group flex-shrink-0 w-[150px] sm:w-[170px] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--ld-highlight)]/40"
            >
              <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--ld-bg-soft)' }}>
                <img
                  src={getProductImage(p)}
                  alt={p.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                {oferta && pct && (
                  <span
                    className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow"
                    style={{ background: 'var(--ld-highlight)' }}
                  >
                    ⚡ -{pct}%
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-ld-fg line-clamp-2 leading-snug min-h-[32px]">{p.nombre}</p>
                {oferta ? (
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-[11px] line-through text-ld-fg-subtle">${(p.precio_b2c || 0).toLocaleString('es-CL')}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--ld-highlight)' }}>${(p.precio_oferta || 0).toLocaleString('es-CL')}</span>
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm font-bold text-ld-fg">${(p.precio_b2c || 0).toLocaleString('es-CL')}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
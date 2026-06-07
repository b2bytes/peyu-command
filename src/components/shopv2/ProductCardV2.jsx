import { Link } from 'react-router-dom';
import { Recycle, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Card de producto del Shop v2 (Tema 6 Conversion Machine). Limpia, CTA claro
// "Ver" que aparece en hover sin solaparse con el precio. Linkea a /ProductoNuevo.
export default function ProductCardV2({ producto, index = 0 }) {
  if (!producto) return null;
  const precio = producto.precio_b2c || 9990;
  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  return (
    <Link
      to={`/ProductoNuevo?id=${producto.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 50}ms`, borderColor: '#D4C4B0' }}
      className="peyu-card-enter group flex flex-col bg-white rounded-3xl border overflow-hidden transition-all hover:-translate-y-1"
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 20px 48px -16px rgba(44,24,16,.18)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: '#F2EBE1' }}>
        <img
          src={getProductImage(producto)}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
        />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full shadow-sm" style={{ color: '#8BAD8A' }}>
          <Recycle className="w-3 h-3" />
          {esCompostable ? 'Compostable' : 'Reciclado'}
        </span>
      </div>
      <div className="p-3.5 flex flex-col flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: '#A08070' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: '#2C1810' }}>
          {producto.nombre}
        </h3>
        <div className="flex items-center justify-between mt-2 pt-0.5">
          <p className="font-poppins font-bold" style={{ color: '#C0785C' }}>{fmtCLP(precio)}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all" style={{ color: '#C0785C' }}>
            Ver <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
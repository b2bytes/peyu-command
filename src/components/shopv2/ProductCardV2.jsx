import { Link } from 'react-router-dom';
import { Leaf, Recycle, ArrowUpRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Card de producto 2027 — Neo-minimalista con icono eco tintado, tipografía editorial,
// hover CTA con ArrowUpRight (tendencia plataforma inteligente).
export default function ProductCardV2({ producto, index = 0 }) {
  if (!producto) return null;
  const precio = producto.precio_b2c || 9990;
  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  return (
    <Link
      to={`/ProductoNuevo?id=${producto.id}`}
      className="peyu-card-enter group flex flex-col bg-white rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
      onMouseOver={e => { e.currentTarget.style.boxShadow = '0 20px 48px -12px rgba(44,24,16,.14)'; e.currentTarget.style.borderColor = '#C8B89A'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E8DDD0'; }}
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,120,92,.25)'; }}
      onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
      style={{ border: '1.5px solid #E8DDD0', animationDelay: `${Math.min(index, 11) * 50}ms` }}
    >
      {/* Imagen: object-contain para ver el producto completo, con fondo cálido */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)', aspectRatio: '1/1' }}>
        <img
          src={getProductImage(producto)}
          alt={producto.nombre}
          className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          style={{ objectFit: 'contain', objectPosition: 'center', padding: '6px' }}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png';
            e.target.onerror = null;
          }}
        />

        {/* Eco badge — pill sofisticado con icono thin */}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 backdrop-blur-md text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: esCompostable ? 'rgba(139,173,138,.85)' : 'rgba(15,139,108,.80)',
            color: 'white',
            border: '1px solid rgba(255,255,255,.3)',
          }}>
          {esCompostable
            ? <Leaf className="w-3 h-3" strokeWidth={2} />
            : <Recycle className="w-3 h-3" strokeWidth={2} />
          }
          {esCompostable ? 'Eco' : '100% reciclado'}
        </span>

        {/* CTA hover overlay — esquina superior derecha */}
        <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
          style={{ background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', border: '1px solid rgba(212,196,176,.5)' }}>
          <ArrowUpRight className="w-4 h-4" style={{ color: '#C0785C' }} strokeWidth={2.5} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A08070' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="font-jakarta font-semibold text-[13px] sm:text-sm leading-snug line-clamp-2 flex-1" style={{ color: '#2C1810' }}>
          {producto.nombre}
        </h3>
        <div className="flex items-center justify-between mt-3 pt-2.5" style={{ borderTop: '1px solid #F2EBE0' }}>
          <p className="font-fraunces font-bold text-base sm:text-lg" style={{ color: '#C0785C' }}>{fmtCLP(precio)}</p>
          <span className="text-[11px] sm:text-xs font-semibold sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-0.5" style={{ color: '#C0785C' }}>
            Ver <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </Link>
  );
}
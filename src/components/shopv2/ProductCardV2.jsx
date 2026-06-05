import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Card de producto del Shop v2 (estética crema). Linkea a /ProductoNuevo?id=
export default function ProductCardV2({ producto }) {
  if (!producto) return null;
  const precio = producto.precio_b2c || 9990;
  const esCompostable = producto.material?.includes('Trigo') || producto.categoria === 'Carcasas B2C';

  return (
    <Link
      to={`/ProductoNuevo?id=${producto.id}`}
      className="group block bg-white rounded-2xl border border-[#E7D8C6] overflow-hidden hover:shadow-lg hover:border-[#0F8B6C]/40 transition-all hover:-translate-y-0.5"
    >
      <div className="relative aspect-square bg-[#FBF7EF] overflow-hidden">
        <img
          src={getProductImage(producto)}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
        />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-full text-[#0F8B6C] shadow-sm">
          <Recycle className="w-3 h-3" />
          {esCompostable ? 'Compostable' : 'Reciclado'}
        </span>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A78B6F] mb-0.5">
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="font-semibold text-sm text-[#2A2420] leading-snug line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </h3>
        <p className="font-poppins font-bold text-[#0F8B6C] mt-1.5">{fmtCLP(precio)}</p>
      </div>
    </Link>
  );
}
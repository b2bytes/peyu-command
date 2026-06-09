// Card de producto para el catálogo empresarial B2B
import { Link } from 'react-router-dom';
import { TrendingDown, Sparkles, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

export default function B2BCatalogCard({ producto }) {
  const img = getProductImage(producto);
  const basePrice = getUnitBasePrice(producto);
  const precio50 = getB2BPriceForQty(producto, 50);
  const precio100 = getB2BPriceForQty(producto, 100);
  const precio500 = getB2BPriceForQty(producto, 500);
  const maxDiscount = getB2BPriceForQty(producto, 1000);
  const ahorroMax = maxDiscount?.ahorroPct || 0;
  const moq = producto.personalizacion_gratis_desde || producto.moq_personalizacion || 10;

  return (
    <Link
      to={`/EmpresaProducto?id=${producto.id}`}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1"
      style={{ border: '1.5px solid #D4C4B0' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)' }}>
        <img
          src={img}
          alt={producto.nombre}
          loading="lazy"
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.05]"
          style={{ objectFit: 'contain', objectPosition: 'center', padding: '8px' }}
          onError={(e) => { e.target.style.opacity = '0.3'; }}
        />
        {ahorroMax > 0 && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: '#D96B4D', color: 'white' }}>
            <TrendingDown className="w-2.5 h-2.5" /> -{ahorroMax}%
          </span>
        )}
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: 'rgba(248,243,237,.92)', color: '#7A6050', border: '1px solid #D4C4B0' }}>
          {producto.material?.includes('Trigo') ? 'Compostable' : '100% Reciclado'}
        </span>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(44,24,16,.4)' }}>
          <div className="text-center text-white">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-full"
              style={{ background: 'rgba(15,139,108,.9)' }}>
              Ver producto <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <p className="text-[10px] mt-2 opacity-90">Tabla de precios por volumen</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-5">
        <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#A08070' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="font-fraunces text-base sm:text-lg leading-snug mb-2 sm:mb-3 flex-1" style={{ color: '#2C1810' }}>
          {producto.nombre}
        </h3>

        {/* Tabla de precios compacta */}
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
            <div className="px-2 py-1 rounded-lg" style={{ background: '#F2ECE2', color: '#7A6050' }}>
              <p className="font-bold">1–49u</p>
              <p style={{ color: '#0F8B6C', fontWeight: 'bold' }}>{fmtCLP(basePrice)}</p>
            </div>
            <div className="px-2 py-1 rounded-lg" style={{ background: '#F2ECE2', color: '#7A6050' }}>
              <p className="font-bold">50–99u</p>
              <p style={{ color: '#0F8B6C', fontWeight: 'bold' }}>{fmtCLP(precio50?.precio || basePrice)}</p>
            </div>
            <div className="px-2 py-1 rounded-lg" style={{ background: '#F2ECE2', color: '#7A6050' }}>
              <p className="font-bold">100–499u</p>
              <p style={{ color: '#0F8B6C', fontWeight: 'bold' }}>{fmtCLP(precio100?.precio || basePrice)}</p>
            </div>
            <div className="px-2 py-1 rounded-lg" style={{ background: '#D96B4D', color: 'white' }}>
              <p className="font-bold">500+u</p>
              <p className="font-bold">{fmtCLP(precio500?.precio || basePrice)}</p>
            </div>
          </div>
        </div>

        {ahorroMax > 0 && (
          <p className="text-[10px] sm:text-[11px] mb-2" style={{ color: '#D96B4D', fontWeight: 'bold' }}>
            ↓ Hasta -{ahorroMax}% en grandes volúmenes
          </p>
        )}

        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold pt-2"
          style={{ borderTop: '1px solid #EDE3D6', color: '#0F8B6C' }}>
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
          Logo gratis desde {moq}u
        </div>
      </div>
    </Link>
  );
}
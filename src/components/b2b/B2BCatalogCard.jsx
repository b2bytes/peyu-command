// Card de producto para el catálogo empresarial B2B
import { Link } from 'react-router-dom';
import { TrendingDown, Sparkles, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

export default function B2BCatalogCard({ producto }) {
  const img = getProductImage(producto);
  const basePrice = getUnitBasePrice(producto);
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
      <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', background: '#F2ECE2' }}>
        <img
          src={img}
          alt={producto.nombre}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2 rounded-full"
            style={{ background: 'rgba(15,139,108,.9)' }}>
            Ver producto <ArrowRight className="w-3.5 h-3.5" />
          </span>
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

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] sm:text-xs" style={{ color: '#A08070' }}>desde</span>
            <span className="font-poppins font-extrabold text-base sm:text-lg" style={{ color: '#0F8B6C' }}>{fmtCLP(basePrice)}/u</span>
          </div>
          {ahorroMax > 0 && (
            <p className="text-[10px] sm:text-[11px]" style={{ color: '#A08070' }}>
              Hasta <strong style={{ color: '#D96B4D' }}>-{ahorroMax}%</strong> por volumen
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold mt-2 pt-2 sm:mt-3 sm:pt-3"
            style={{ borderTop: '1px solid #EDE3D6', color: '#0F8B6C' }}>
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            Logo gratis desde {moq}u
          </div>
        </div>
      </div>
    </Link>
  );
}
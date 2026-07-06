// Card COMPACTA de producto para el catálogo empresarial B2B.
// Simplificada: imagen + nombre + precio "desde" + CTA directo a cotizar.
// El detalle completo (tabla de 8 tramos, specs, colores) vive en /EmpresaProducto.
// Flujo lineal: "Cotizar" lleva directo a /CotizacionRapida con el producto cargado.
import { Link, useNavigate } from 'react-router-dom';
import { TrendingDown, Plus, ShoppingCart } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { getB2BPriceForQty, getUnitBasePrice } from '@/lib/catalog-pricing';
import { fmtCLP } from '@/lib/shop-v2-cart';

export default function B2BCatalogCard({ producto }) {
  const navigate = useNavigate();
  const img = getProductImage(producto);
  const precioDesde = getB2BPriceForQty(producto, 50)?.precio ?? getUnitBasePrice(producto);
  const ahorroMax = getB2BPriceForQty(producto, 1000)?.ahorroPct || 0;

  // Botón cotizar: va directo a la ficha de detalle B2B.
  const cotizar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/EmpresaProducto?id=${producto.id}&qty=50`);
  };

  // Botón compra rápida: lleva al checkout B2C con el producto cargado.
  // Joaquín: "muchas veces solo quieren comprar rápido" — sin pasar por cotización.
  const comprar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/ProductoNuevo?id=${producto.id}`);
  };

  return (
    <Link
      to={`/EmpresaProducto?id=${producto.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ border: '1.5px solid #D4C4B0' }}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: 'linear-gradient(145deg,#F7F2EC,#EDE3D6)' }}>
        <img
          src={img}
          alt={producto.nombre}
          loading="lazy"
          className="w-full h-full transition-transform duration-500 group-hover:scale-[1.04]"
          style={{ objectFit: 'contain', objectPosition: 'center', padding: '6px' }}
          onError={(e) => { e.target.style.opacity = '0.3'; }}
        />
        {ahorroMax > 0 && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: '#D96B4D', color: 'white' }}>
            <TrendingDown className="w-2.5 h-2.5" /> hasta -{ahorroMax}%
          </span>
        )}
      </div>

      {/* Info compacta */}
      <div className="flex flex-col flex-1 p-2">
        <p className="text-[7px] font-bold uppercase tracking-wider mb-0.5 truncate" style={{ color: '#A08070' }}>
          {producto.categoria?.replace(' B2C', '')}
        </p>
        <h3 className="font-fraunces text-xs leading-tight mb-1 flex-1 line-clamp-2" style={{ color: '#2C1810' }}>
          {producto.nombre}
        </h3>

        {/* Precio desde + doble CTA: Comprar + Cotizar */}
        <div className="flex items-center justify-between gap-1 pt-1" style={{ borderTop: '1px solid #EDE3D6' }}>
          <div className="min-w-0">
            <p className="text-[8px] leading-none" style={{ color: '#A08070' }}>desde 50u</p>
            <p className="font-bold text-xs leading-tight truncate" style={{ color: '#0F8B6C' }}>{fmtCLP(precioDesde)}/u</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={comprar}
              className="flex items-center gap-0.5 text-[10px] font-bold px-2 h-7 rounded-lg flex-shrink-0 transition-all active:scale-95"
              style={{ border: '1.5px solid #D4C4B0', background: 'white', color: '#C0785C' }}
              aria-label={`Comprar ${producto.nombre}`}
              title="Compra rápida — directo al carrito"
            >
              <ShoppingCart className="w-3 h-3" />
            </button>
            <button
              onClick={cotizar}
              className="flex items-center gap-0.5 text-[10px] font-bold px-2 h-7 rounded-lg text-white flex-shrink-0 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
              aria-label={`Cotizar ${producto.nombre}`}
              title="Solicitar cotización formal"
            >
              <Plus className="w-3 h-3" /> Cotizar
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
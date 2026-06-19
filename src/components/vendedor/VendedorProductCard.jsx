import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Sparkles, Leaf } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// VendedorProductCard — Tarjeta de producto rica dentro del chat. Imagen
// grande tipo retail, badge eco, precio prominente, IVA y personalización,
// con CTAs de agregar/personalizar. Reemplaza el listado de texto plano.
// ════════════════════════════════════════════════════════════════════════
export default function VendedorProductCard({ producto }) {
  const [added, setAdded] = useState(false);
  if (!producto) return null;

  const img = getProductImage(producto);
  const precio = producto.precio_b2c || 0;
  const compostable = producto.material?.includes('Trigo');
  const ecoBadge = compostable ? 'Compostable' : '100% Reciclado';

  const handleAdd = () => {
    if (added) return;
    addToCartV2({
      productoId: producto.id,
      sku: producto.sku || null,
      nombre: producto.nombre,
      precio,
      cargo_personalizacion: 0,
      cantidad: 1,
      color: null,
      personalizacion: null,
      imagen: img,
      imagen_base: img,
    });
    setAdded(true);
  };

  return (
    <div className="w-full max-w-[300px] rounded-2xl overflow-hidden bg-white border border-[#E7D8C6] shadow-sm hover:shadow-md transition-shadow">
      {/* Imagen grande tipo retail */}
      <Link to={`/ProductoNuevo?id=${producto.id}`} className="block relative">
        <div className="aspect-[16/10] bg-[#F8F3ED] overflow-hidden">
          <img
            src={img}
            alt={producto.nombre}
            referrerPolicy="no-referrer"
            onError={(e) => { e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png'; e.target.onerror = null; }}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur"
          style={{ background: 'rgba(255,255,255,.92)', color: '#5B7D5A' }}
        >
          <Leaf className="w-2.5 h-2.5" /> {ecoBadge}
        </span>
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link to={`/ProductoNuevo?id=${producto.id}`}>
          <p className="text-[13px] font-bold text-[#2C1810] leading-tight line-clamp-2 hover:underline">{producto.nombre}</p>
        </Link>

        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-lg font-poppins font-bold" style={{ color: '#C0785C' }}>{fmtCLP(precio)}</span>
          <span className="text-[9px] font-semibold" style={{ color: '#A08070' }}>IVA incl.</span>
        </div>

        {producto.personalizacion_gratis_desde && (
          <p className="inline-flex items-center gap-1 text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(15,139,108,.08)', color: '#0F8B6C' }}>
            <Sparkles className="w-2.5 h-2.5" /> Logo láser gratis desde {producto.personalizacion_gratis_desde}u
          </p>
        )}

        <div className="flex gap-1.5 mt-2.5">
          <button
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl text-white transition-all active:scale-95 ${added ? 'opacity-90' : ''}`}
            style={{ background: added ? '#0F8B6C' : 'linear-gradient(135deg,#C0785C,#A86440)' }}>
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {added ? 'En el carro' : 'Agregar'}
          </button>
          <Link
            to={`/ProductoNuevo?id=${producto.id}`}
            className="flex items-center justify-center gap-1 text-[11px] font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: 'white' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#C0785C' }} /> Personalizar
          </Link>
        </div>
      </div>
    </div>
  );
}
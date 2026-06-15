import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Sparkles, Star } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';

export default function VendedorProductCard({ producto }) {
  const [added, setAdded] = useState(false);
  if (!producto) return null;
  const img = getProductImage(producto);
  const precio = producto.precio_b2c || 0;
  const ecoBadge = producto.material?.includes('Trigo') ? '♻️ Compostable' : '♻️ 100% Reciclado';

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
    <div className="flex gap-3 bg-white rounded-2xl p-3 border border-[#E7D8C6] shadow-sm max-w-sm hover:shadow-md transition-shadow">
      <Link to={`/ProductoNuevo?id=${producto.id}`} className="flex-shrink-0">
        <img src={img} alt={producto.nombre} referrerPolicy="no-referrer"
          onError={(e) => { e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png'; e.target.onerror = null; }}
          className="w-[72px] h-[72px] rounded-xl object-cover bg-[#F8F3ED] border border-[#EBE3D6]" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-xs font-bold text-[#2C1810] leading-tight line-clamp-2">{producto.nombre}</p>
          <p className="text-[9px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: '#5B7D5A' }}>
            <Star className="w-2.5 h-2.5" /> {ecoBadge}
          </p>
          <p className="text-sm font-poppins font-bold mt-0.5" style={{ color: '#C0785C' }}>{fmtCLP(precio)}</p>
          {producto.personalizacion_gratis_desde && (
            <p className="text-[9px] font-semibold mt-0.5" style={{ color: '#0F8B6C' }}>
              Logo gratis desde {producto.personalizacion_gratis_desde}u
            </p>
          )}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          <button
            onClick={handleAdd}
            className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all active:scale-95 ${added ? 'opacity-80' : ''}`}
            style={{ background: added ? '#0F8B6C' : 'linear-gradient(135deg,#C0785C,#A86440)' }}>
            {added ? <Check className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
            {added ? 'En el carro' : 'Agregar'}
          </button>
          <Link
            to={`/ProductoNuevo?id=${producto.id}`}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: 'white' }}>
            <Sparkles className="w-3 h-3" style={{ color: '#C0785C' }} /> Personalizar
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check, Sparkles, Leaf, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { addToCartV2, fmtCLP } from '@/lib/shop-v2-cart';

// ════════════════════════════════════════════════════════════════════════
// VendedorProductCard — Tarjeta de producto rica dentro del chat. Imagen
// grande tipo retail, badge eco flotante, precio prominente, personalización
// y CTAs claros. Diseño fluido con feedback de "agregado" animado.
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
    <div
      className="group w-full max-w-[320px] rounded-3xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5"
      style={{ border: '1.5px solid #E7D8C6', boxShadow: '0 4px 20px rgba(44,24,16,.06)' }}
    >
      {/* Imagen grande tipo retail con overlay eco */}
      <Link to={`/ProductoNuevo?id=${producto.id}`} className="block relative">
        <div className="aspect-[4/3] overflow-hidden" style={{ background: '#F8F3ED' }}>
          <img
            src={img}
            alt={producto.nombre}
            referrerPolicy="no-referrer"
            onError={(e) => { e.target.src = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4a2230d61_generated_image.png'; e.target.onerror = null; }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        {/* Badge eco */}
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur"
          style={{ background: 'rgba(255,255,255,.92)', color: '#5B7D5A', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}
        >
          <Leaf className="w-2.5 h-2.5" /> {ecoBadge}
        </span>
        {/* Precio flotante sobre la imagen (jerarquía retail) */}
        <span
          className="absolute bottom-2.5 right-2.5 inline-flex items-baseline gap-1 px-2.5 py-1 rounded-full backdrop-blur"
          style={{ background: 'rgba(255,255,255,.95)', boxShadow: '0 2px 10px rgba(44,24,16,.12)' }}
        >
          <span className="text-[15px] font-poppins font-bold" style={{ color: '#C0785C' }}>{fmtCLP(precio)}</span>
          <span className="text-[8px] font-bold" style={{ color: '#A08070' }}>IVA</span>
        </span>
      </Link>

      {/* Info */}
      <div className="p-3.5">
        <Link to={`/ProductoNuevo?id=${producto.id}`}>
          <p className="text-[14px] font-bold leading-snug line-clamp-2 hover:underline" style={{ color: '#2C1810' }}>{producto.nombre}</p>
        </Link>

        {producto.personalizacion_gratis_desde && (
          <p className="inline-flex items-center gap-1 text-[9px] font-bold mt-2 px-2 py-1 rounded-full" style={{ background: 'rgba(15,139,108,.08)', color: '#0F8B6C' }}>
            <Sparkles className="w-2.5 h-2.5" /> Logo láser gratis desde {producto.personalizacion_gratis_desde}u
          </p>
        )}

        <div className="flex gap-1.5 mt-3">
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold px-3 py-2.5 rounded-2xl text-white transition-all active:scale-95"
            style={{ background: added ? 'linear-gradient(135deg,#0F8B6C,#0B6E55)' : 'linear-gradient(135deg,#C0785C,#A86440)' }}>
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {added ? 'En el carro' : 'Agregar'}
          </button>
          <Link
            to={`/ProductoNuevo?id=${producto.id}`}
            className="flex items-center justify-center gap-1 text-[12px] font-bold px-3 py-2.5 rounded-2xl transition-all active:scale-95"
            style={{ border: '1.5px solid #D4C4B0', color: '#2C1810', background: 'white' }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
          </Link>
        </div>

        {added && (
          <Link
            to="/CarritoNuevo"
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-2xl transition-all active:scale-95"
            style={{ background: 'rgba(15,139,108,.08)', color: '#0F8B6C' }}>
            Ir a pagar <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
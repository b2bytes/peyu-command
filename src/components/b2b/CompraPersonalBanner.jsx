import { Link } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';

// Aviso NO intrusivo para el visitante que llega a la ficha de empresas desde
// un anuncio (Instagram/Facebook). La ficha B2B sigue funcionando igual: esto
// solo le ofrece el camino de compra por unidad si compra para sí mismo.
export default function CompraPersonalBanner({ productoId, precioB2C, fmt }) {
  if (!productoId) return null;
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3.5 py-3 mb-3"
      style={{ background: 'white', border: '1.5px solid #D4C4B0' }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(192,120,92,.12)' }}
      >
        <User className="w-4 h-4" style={{ color: '#C0785C' }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight" style={{ color: '#2C1810' }}>
          ¿Lo compras para ti?
        </p>
        <p className="text-[11px] leading-tight" style={{ color: '#7A6050' }}>
          Llévalo desde 1 unidad{precioB2C ? ` · ${fmt(precioB2C)}` : ''}
        </p>
      </div>
      <Link
        to={`/ProductoNuevo?id=${productoId}`}
        className="flex-shrink-0 h-10 px-3.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 active:scale-[0.97] transition-transform"
        style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
      >
        Comprar 1 <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Recycle } from 'lucide-react';
import { cartCountV2, subscribeCartV2 } from '@/lib/shop-v2-cart';

// Header sticky crema del Shop v2. Logo PEYU + cart bubble reactivo (carrito_v2).
export default function ShopV2Header() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    setCount(cartCountV2());
    return subscribeCartV2(() => setCount(cartCountV2()));
  }, []);

  // Pulso del bubble cuando cambia el contador (salta al agregar al carrito).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 400);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <header className="sticky top-0 z-40 bg-[#F8F3ED]/90 backdrop-blur-xl border-b border-[#D4C4B0]/60" style={{ boxShadow: '0 1px 20px rgba(44,24,16,.06)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/TiendaNueva" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}>
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-fraunces text-xl" style={{ color: '#2C1810' }}>PEYU</span>
            <span className="block text-[10px] font-bold -mt-0.5 tracking-wide" style={{ color: '#A08070' }}>PLÁSTICO RECICLADO</span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link to="/TiendaNueva" className="px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Inicio</Link>
          <Link to="/CatalogoNuevo" className="px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Tienda</Link>
          <Link to="/CotizacionRapida" className="px-3 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Empresas</Link>
        </nav>

        <button
          onClick={() => navigate('/CarritoNuevo')}
          className="relative flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-2xl transition-all hover:shadow-md"
          style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810' }}
        >
          <ShoppingBag className="w-4 h-4" style={{ color: '#C0785C' }} />
          <span className="hidden sm:inline">Carrito</span>
          {count > 0 && (
            <span className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow transition-transform ${pulse ? 'scale-125' : 'scale-100'}`} style={{ background: '#C0785C' }}>
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
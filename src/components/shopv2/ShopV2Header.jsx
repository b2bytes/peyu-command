import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        <Link to="/TiendaNueva" className="flex items-center group">
          <img
            src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
            alt="PEYU"
            className="h-8 w-auto object-contain group-hover:scale-105 transition-transform select-none"
            draggable={false}
            loading="eager"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          <Link to="/TiendaNueva" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Inicio</Link>
          <Link to="/CatalogoNuevo" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Tienda</Link>
          <Link to="/EmpresasNuevo" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Empresas</Link>
          <Link to="/blog" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Blog</Link>
          <Link to="/nosotros" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Nosotros</Link>
          <Link to="/contacto" className="px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors hover:bg-[#EDE3D6]" style={{ color: '#7A6050' }}>Contacto</Link>
        </nav>

        <button
          onClick={() => navigate('/CarritoNuevo')}
          className="relative flex items-center gap-1.5 sm:gap-2 font-bold text-sm px-3 sm:px-4 py-2.5 rounded-2xl transition-all hover:shadow-md active:scale-[0.97]"
          style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#2C1810', minHeight: '42px' }}
        >
          <ShoppingBag className="w-4 h-4 flex-shrink-0" style={{ color: '#C0785C' }} />
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
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Recycle } from 'lucide-react';
import { cartCountV2, subscribeCartV2 } from '@/lib/shop-v2-cart';

// Header sticky crema del Shop v2. Logo PEYU + cart bubble reactivo (carrito_v2).
export default function ShopV2Header() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(cartCountV2());
    return subscribeCartV2(() => setCount(cartCountV2()));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FBF7EF]/85 backdrop-blur-xl border-b border-[#E7D8C6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/TiendaNueva" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#0F8B6C] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-fraunces text-xl text-[#2A2420]">PEYU</span>
            <span className="block text-[10px] font-bold text-[#A78B6F] -mt-0.5 tracking-wide">PLÁSTICO RECICLADO</span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          <Link to="/TiendaNueva" className="px-3 py-2 text-sm font-semibold text-[#4B4F54] hover:text-[#0F8B6C] rounded-lg transition-colors">Inicio</Link>
          <Link to="/CatalogoNuevo" className="px-3 py-2 text-sm font-semibold text-[#4B4F54] hover:text-[#0F8B6C] rounded-lg transition-colors">Tienda</Link>
        </nav>

        <button
          onClick={() => navigate('/CarritoNuevo')}
          className="relative flex items-center gap-2 bg-white border border-[#E7D8C6] hover:border-[#0F8B6C] text-[#2A2420] font-bold text-sm px-4 py-2.5 rounded-xl transition-all hover:shadow-sm"
        >
          <ShoppingBag className="w-4 h-4 text-[#0F8B6C]" />
          <span className="hidden sm:inline">Carrito</span>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#D96B4D] text-white text-[11px] font-bold flex items-center justify-center shadow">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
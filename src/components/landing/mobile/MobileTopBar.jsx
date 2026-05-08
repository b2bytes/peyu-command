import { Link } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';
import MobileMenu from '@/components/MobileMenu';

/**
 * Top bar móvil compacto del home e-commerce.
 * Sticky, glassmorphism, con menú + logo + buscar + carrito.
 */
export default function MobileTopBar({ menuItems, cartCount }) {
  return (
    <div
      className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 px-3 py-2.5 flex items-center justify-between gap-2"
      style={{ background: 'rgba(15,23,42,0.85)' }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileMenu items={menuItems} />
        <PEYULogo size="sm" showText={true} />
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Link to="/shop" aria-label="Buscar productos">
          <button className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95">
            <Search className="w-4 h-4" />
          </button>
        </Link>
        <Link to="/cart" aria-label="Ver carrito">
          <button className="relative w-9 h-9 inline-flex items-center justify-center rounded-full bg-teal-500 hover:bg-teal-600 border border-teal-400/50 text-white transition active:scale-95 shadow-md">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-950">
                {cartCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </div>
  );
}
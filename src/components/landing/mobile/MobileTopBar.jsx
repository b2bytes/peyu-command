import { Link } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';
import MobileMenu from '@/components/MobileMenu';
import LiquidDualToggle from '@/components/LiquidDualToggle';

/**
 * Top bar mobile Liquid Dual — vidrio auto-adaptativo (día/noche).
 * Sticky con menú + logo + toggle + buscar + carrito.
 */
export default function MobileTopBar({ menuItems, cartCount }) {
  return (
    <div className="sticky top-0 z-40 ld-glass-strong border-b border-ld-border px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileMenu items={menuItems} />
        <PEYULogo size="sm" />
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <LiquidDualToggle compact />
        <Link to="/shop" aria-label="Buscar productos">
          <button className="ld-btn-ghost w-9 h-9 inline-flex items-center justify-center rounded-full text-ld-fg transition active:scale-95">
            <Search className="w-4 h-4" />
          </button>
        </Link>
        <Link to="/cart" aria-label="Ver carrito">
          <button className="ld-btn-primary relative w-9 h-9 inline-flex items-center justify-center rounded-full text-white transition active:scale-95">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2"
                style={{ background: 'var(--ld-highlight)', borderColor: 'var(--ld-bg)' }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </div>
  );
}
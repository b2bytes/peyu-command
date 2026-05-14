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
    <div className="sticky top-0 z-40 ld-glass-strong border-b border-ld-border px-2.5 py-2 flex items-center justify-between gap-1.5 max-w-full overflow-hidden">
      {/* Izquierda: menú + logo. flex-1 con min-w-0 para que el logo tenga espacio
          real. PEYULogo tiene flex-shrink-0 dentro, así nunca se comprime. */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <MobileMenu items={menuItems} />
        <Link to="/" aria-label="Inicio PEYU" className="flex items-center">
          <PEYULogo size="sm" />
        </Link>
      </div>
      {/* Derecha: controles compactos. Botones 8x8 (32px) para ahorrar espacio
          y dejar respirar al logo. Cumplen tap target con padding visual. */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <LiquidDualToggle compact />
        <Link to="/shop" aria-label="Buscar productos">
          <button className="ld-btn-ghost w-8 h-8 inline-flex items-center justify-center rounded-full text-ld-fg transition active:scale-95">
            <Search className="w-3.5 h-3.5" />
          </button>
        </Link>
        <Link to="/cart" aria-label="Ver carrito">
          <button className="ld-btn-primary relative w-8 h-8 inline-flex items-center justify-center rounded-full text-white transition active:scale-95">
            <ShoppingCart className="w-3.5 h-3.5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2"
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
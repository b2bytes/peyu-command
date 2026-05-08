import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShoppingCart } from 'lucide-react';
import PublicMobileDrawer from './PublicMobileDrawer';
import PEYULogo from './PEYULogo';
import LiquidDualToggle from './LiquidDualToggle';

/**
 * Header sticky para móvil (<lg) en las páginas públicas internas.
 * Liquid Dual: glass auto-adaptativo día/noche.
 * Logo PEYU + botón hamburguesa + toggle día/noche + acceso al carrito.
 */
export default function PublicMobileHeader() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem('carrito');
        const cart = raw ? JSON.parse(raw) : [];
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } catch { setCartCount(0); }
    };
    update();
    window.addEventListener('storage', update);
    window.addEventListener('peyu:cart-added', update);
    window.addEventListener('peyu:cart-cleared', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('peyu:cart-added', update);
      window.removeEventListener('peyu:cart-cleared', update);
    };
  }, []);

  return (
    <>
      <header
        className="lg:hidden sticky top-0 z-30 ld-glass-strong border-b border-ld-border flex items-center justify-between px-3 h-14 flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-xl ld-glass-soft flex items-center justify-center text-ld-fg active:scale-95 transition"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center" aria-label="PEYU Chile - Inicio">
          <PEYULogo size="sm" />
        </Link>

        <div className="flex items-center gap-1.5">
          <LiquidDualToggle compact />
          <Link
            to="/cart"
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-full ld-btn-primary text-white"
            aria-label="Ver carrito"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white ring-2"
                style={{ background: 'var(--ld-highlight)', borderColor: 'var(--ld-bg)' }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <PublicMobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, ShoppingCart } from 'lucide-react';
import PublicMobileDrawer from './PublicMobileDrawer';

/**
 * Header sticky para móvil (<lg) en las páginas públicas internas.
 * Muestra logo PEYU + botón hamburguesa + acceso directo al carrito.
 * El drawer es el mismo que abre el botón "Más" del bottom nav.
 */
export default function PublicMobileHeader() {
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Sincronizar contador del carrito desde localStorage.
  // Usamos la key 'carrito' (la misma que usa el resto del sitio: ShopLanding,
  // Carrito.js, ProductoDetalle, etc.) y escuchamos los eventos que emiten.
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
        className="lg:hidden sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 h-14 flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow p-0.5">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="55" rx="28" ry="32" fill="white" />
              <circle cx="50" cy="28" r="16" fill="white" />
              <ellipse cx="28" cy="72" rx="6" ry="10" fill="white" />
              <ellipse cx="72" cy="72" rx="6" ry="10" fill="white" />
              <circle cx="45" cy="24" r="2" fill="#0F8B6C" />
              <circle cx="55" cy="24" r="2" fill="#0F8B6C" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-poppins font-black text-white leading-none">PEYU</span>
            <span className="text-[9px] text-white/50 leading-none">Chile</span>
          </div>
        </Link>

        <Link
          to="/cart"
          className="relative w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-600 active:bg-teal-700 flex items-center justify-center text-white transition"
          aria-label="Ver carrito"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      <PublicMobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
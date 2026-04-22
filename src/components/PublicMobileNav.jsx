import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Grid3x3, Building2, MoreHorizontal } from 'lucide-react';
import PublicMobileDrawer from './PublicMobileDrawer';

// Bottom navigation para móvil — solo se muestra en pantallas < lg.
// Pensado para facilitar la navegación con el pulgar en iOS/Android.
// El botón "Más" abre un drawer lateral con TODOS los items del menú.
const ITEMS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/shop', label: 'Tienda', icon: ShoppingCart },
  { to: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { to: '/b2b/contacto', label: 'B2B', icon: Building2 },
];

export default function PublicMobileNav() {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        aria-label="Navegación principal móvil"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-teal-300' : 'text-white/60 hover:text-white active:text-teal-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-white/60 hover:text-white active:text-teal-300 transition-colors"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>Más</span>
          </button>
        </div>
      </nav>

      <PublicMobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
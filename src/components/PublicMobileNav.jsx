import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Grid3x3, Building2, MoreHorizontal } from 'lucide-react';
import PublicMobileDrawer from './PublicMobileDrawer';

// Bottom navigation Liquid Dual para móvil — glass auto-adaptativo.
// Visible solo < lg. Pulgar-friendly con safe area iOS.
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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 ld-glass-strong border-t border-ld-border pb-[env(safe-area-inset-bottom)]"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}
        aria-label="Navegación principal móvil"
      >
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          {ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                  active ? '' : 'text-ld-fg-muted active:scale-95'
                }`}
                style={active ? { color: 'var(--ld-action)' } : undefined}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold text-ld-fg-muted active:scale-95 transition"
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
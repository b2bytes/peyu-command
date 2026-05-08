import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Grid3x3, Building2, HelpCircle, Heart, BookOpen, Sparkles, Package, Gift } from 'lucide-react';
import WhatsAppFloat from './WhatsAppFloat';
import AsistenteChat from './AsistenteChat';
import ChatCartToast from './chat/ChatCartToast';
import PublicMobileNav from './PublicMobileNav';
import PublicMobileHeader from './PublicMobileHeader';
import LiquidDualToggle from './LiquidDualToggle';

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/personalizar', label: 'Personalizar', icon: Sparkles },
  { href: '/regalar-giftcard', label: 'Gift Cards', icon: Gift },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
  { href: '/seguimiento', label: 'Seguimiento', icon: Package },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

export default function PublicLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  return (
    // Liquid Dual canvas — auto día/noche, sin imágenes de fondo dinámicas.
    <div className="relative h-screen w-full overflow-hidden ld-canvas">
      {/* SIDEBAR Liquid Dual */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-[60] ld-glass-strong border-r border-ld-border transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarExpanded ? 'w-48 shadow-2xl' : 'w-14'
        }`}
      >
        {/* macOS Header */}
        <div className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0 border-b border-ld-border">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/90" />
          </div>
          {sidebarExpanded && (
            <span className="text-[10px] text-ld-fg-muted ml-auto font-bold tracking-[0.18em]">PEYU</span>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col items-stretch gap-0.5 px-1.5 py-3 flex-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                title={item.label}
                className={`flex items-center rounded-xl transition-colors h-11 ${
                  sidebarExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'
                } ${
                  isActive
                    ? 'text-ld-fg ring-1'
                    : 'text-ld-fg-muted hover:text-ld-fg'
                }`}
                style={isActive ? { background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' } : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {sidebarExpanded && (
                  <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Liquid Dual al pie del sidebar */}
        <div className={`flex-shrink-0 border-t border-ld-border p-2 flex ${sidebarExpanded ? 'justify-start px-3' : 'justify-center'}`}>
          <LiquidDualToggle compact />
        </div>
      </aside>

      {/* MAIN CONTENT — sin backgroundImage propio, reserva espacio solo para el sidebar colapsado en desktop */}
      <main className="absolute inset-0 overflow-auto pb-16 lg:pb-0 lg:pl-14 flex flex-col">
        <PublicMobileHeader />
        <Outlet />
      </main>

      {/* Navegación inferior móvil */}
      <PublicMobileNav />

      {/* WhatsApp flotante */}
      <WhatsAppFloat />

      {/* Peyu chat flotante */}
      <AsistenteChat />

      {/* Toast global de "agregado al carrito" desde el chat */}
      <ChatCartToast />

    </div>
  );
}
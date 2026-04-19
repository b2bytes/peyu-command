import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Grid3x3, Building2, HelpCircle, Heart } from 'lucide-react';
import PEYULogo from './PEYULogo';
import WhatsAppFloat from './WhatsAppFloat';

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home, color: 'bg-teal-500' },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart, color: 'bg-teal-500' },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3, color: 'bg-teal-500' },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2, color: 'bg-teal-500' },
  { href: '/nosotros', label: 'Nosotros', icon: Heart, color: 'bg-teal-500' },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle, color: 'bg-teal-500' },
];

export default function PublicLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 78, 137, 0.80) 50%, rgba(15, 23, 42, 0.85) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* SIDEBAR - macOS style */}
      <div 
        className={`hidden lg:flex flex-col bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 overflow-hidden ${
          sidebarExpanded ? 'w-48' : 'w-16'
        }`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* macOS Header */}
        <div className="bg-white/5 border-b border-white/10 px-3 py-2.5 flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow"></div>
          </div>
          {sidebarExpanded && <span className="text-xs text-white/50 ml-auto font-medium">PEYU</span>}
        </div>

        {/* Menu Items */}
        <div className="flex flex-col items-center gap-1 px-2 py-4 flex-1 justify-start">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center text-white transition-all rounded-lg group relative ${
                  sidebarExpanded ? 'w-full px-3 py-2.5 justify-start gap-3' : 'w-12 h-12 justify-center'
                } ${
                  isActive ? 'bg-teal-500/30 border border-teal-500/50' : 'hover:bg-white/20'
                }`}
                title={item.label}
              >
                <Icon className={`flex-shrink-0 ${
                  sidebarExpanded ? 'w-4 h-4' : 'w-6 h-6'
                }`} />
                {sidebarExpanded && <span className="text-xs font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto w-full" style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.80) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.80) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}>
        <Outlet />
      </div>

      {/* WhatsApp flotante */}
      <WhatsAppFloat />
    </div>
  );
}
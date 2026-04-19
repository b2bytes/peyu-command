import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Grid3x3, Building2, HelpCircle, Heart } from 'lucide-react';
import WhatsAppFloat from './WhatsAppFloat';

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

// Rutas con tema CLARO (embudo B2C de compra)
const LIGHT_ROUTES = ['/shop', '/producto', '/cart'];

export default function PublicLayout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const location = useLocation();

  const isLightTheme = LIGHT_ROUTES.some(r => location.pathname.startsWith(r));

  const darkBg = {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 78, 137, 0.80) 50%, rgba(15, 23, 42, 0.85) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={isLightTheme ? { backgroundColor: '#FAFAF8' } : darkBg}>
      {/* SIDEBAR - adapta al tema */}
      <div 
        className={`hidden lg:flex flex-col transition-all duration-300 overflow-hidden border-r ${
          sidebarExpanded ? 'w-48' : 'w-16'
        } ${isLightTheme ? 'bg-white border-gray-200' : 'bg-white/10 backdrop-blur-md border-white/20'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={isLightTheme ? {} : {
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* macOS Header */}
        <div className={`px-3 py-2.5 flex items-center gap-2 flex-shrink-0 border-b ${isLightTheme ? 'border-gray-100' : 'bg-white/5 border-white/10'}`}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow"></div>
          </div>
          {sidebarExpanded && <span className={`text-xs ml-auto font-medium ${isLightTheme ? 'text-gray-400' : 'text-white/50'}`}>PEYU</span>}
        </div>

        {/* Menu Items */}
        <div className="flex flex-col items-center gap-1 px-2 py-4 flex-1 justify-start">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center transition-all rounded-lg group relative ${
                  sidebarExpanded ? 'w-full px-3 py-2.5 justify-start gap-3' : 'w-12 h-12 justify-center'
                } ${
                  isLightTheme
                    ? (isActive ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')
                    : (isActive ? 'bg-teal-500/30 text-white border border-teal-500/50' : 'text-white hover:bg-white/20')
                }`}
                title={item.label}
              >
                <Icon className={`flex-shrink-0 ${sidebarExpanded ? 'w-4 h-4' : 'w-6 h-6'}`} />
                {sidebarExpanded && <span className="text-xs font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto w-full" style={isLightTheme ? { backgroundColor: '#FAFAF8' } : {
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
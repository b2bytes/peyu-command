import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingBag, Building2, BookOpen, Users, LifeBuoy, Phone, ChevronRight, ShoppingCart, User } from 'lucide-react';
import { cartCountV2, subscribeCartV2 } from '@/lib/shop-v2-cart';

// Menú profesional para todas las páginas públicas de PEYU
export default function PublicNavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const location = useLocation();

  // Contador del carrito EN VIVO: se actualiza al instante cuando se agrega
  // un producto desde cualquier página (evento carrito_v2_updated).
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    setCartCount(cartCountV2());
    return subscribeCartV2(() => setCartCount(cartCountV2()));
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const mainLinks = [
    { label: 'Inicio', path: '/' },
    { label: 'Tienda', path: '/CatalogoNuevo', icon: ShoppingBag },
    {
      label: 'Empresas',
      path: '/EmpresasNuevo',
      icon: Building2,
      submenu: [
        { label: 'Catálogo B2B', path: '/EmpresasNuevo' },
        { label: '⚡ Propuesta rápida en 24h', path: '/empresas/propuesta-rapida' },
      ]
    },
    { label: 'Blog', path: '/blog', icon: BookOpen },
    { label: 'Nosotros', path: '/nosotros', icon: Users },
  ];

  const helpLinks = [
    { label: 'Mi cuenta', path: '/mi-cuenta', icon: User },
    { label: 'Soporte', path: '/soporte', icon: LifeBuoy },
    { label: 'Seguimiento', path: '/seguimiento' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Contacto', path: '/contacto', icon: Phone },
  ];

  return (
    <>
      {/* DESKTOP NAV */}
      <nav className="hidden md:block sticky top-0 z-50" style={{ background: 'rgba(248,243,237,.96)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderBottom: '1.5px solid #D4C4B0', boxShadow: '0 1px 12px rgba(44,24,16,.08)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU"
              className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
              draggable={false}
              loading="eager"
            />
          </Link>

          {/* Main Menu */}
          <div className="flex items-center gap-0.5 ml-12">
            {mainLinks.map((item) => {
              const active = isActive(item.path);
              const hasSubmenu = item.submenu && item.submenu.length > 0;

              return (
                <div key={item.path} className="relative group">
                  <Link
                    to={item.path}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      active
                        ? 'text-[#0F8B6C] bg-[#0F8B6C]/8'
                        : 'text-[#7A6050] hover:text-[#2C1810] hover:bg-[#F8F3ED]'
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4" />}
                    {item.label}
                    {hasSubmenu && <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />}
                  </Link>

                  {/* Submenu */}
                  {hasSubmenu && (
                    <div className="absolute left-0 mt-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:z-50">
                      <div className="bg-white border border-[#E0D5C8] rounded-xl shadow-lg overflow-hidden">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.path}
                            to={subitem.path}
                            className="block px-4 py-3 text-sm text-[#4B4F54] hover:bg-[#F8F3ED] hover:text-[#0F8B6C] font-semibold transition-colors first:border-b-0 border-t border-[#E0D5C8]/40"
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side: Help + Cart */}
          <div className="flex items-center gap-1 ml-6">
            <div className="relative group">
              <button className="px-4 py-2.5 text-sm font-semibold rounded-lg text-[#7A6050] hover:text-[#2C1810] hover:bg-[#F8F3ED] transition-all flex items-center gap-1.5">
                Ayuda <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>

              {/* Help Submenu */}
              <div className="absolute right-0 mt-0 pt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:z-50">
                <div className="bg-white border border-[#E0D5C8] rounded-xl shadow-lg overflow-hidden">
                  {helpLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-[#4B4F54] hover:bg-[#F8F3ED] hover:text-[#0F8B6C] font-semibold transition-colors border-t border-[#E0D5C8]/40 first:border-t-0"
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mi cuenta */}
            <Link
              to="/mi-cuenta"
              className="ml-1 p-2.5 rounded-lg hover:bg-[#F8F3ED] transition-colors"
              aria-label="Mi cuenta"
            >
              <User className="w-5 h-5 text-[#2C1810]" />
            </Link>

            {/* Cart Button */}
            <Link
              to="/CarritoNuevo"
              className="relative ml-1 p-2.5 rounded-lg hover:bg-[#F8F3ED] transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-5 h-5 text-[#2C1810]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#C0785C' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <nav className="md:hidden sticky top-0 z-50" style={{ background: 'rgba(248,243,237,.97)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', borderBottom: '1.5px solid #D4C4B0', boxShadow: '0 1px 8px rgba(44,24,16,.07)' }}>
        <div className="px-4 h-14 flex items-center justify-between gap-2">
          {/* Logo — siempre lleva a inicio */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img
              src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
              alt="PEYU"
              className="h-7 w-auto object-contain"
              draggable={false}
              loading="eager"
            />
          </Link>

          {/* Tagline — la navegación principal vive en los tabs inferiores */}
          <p className="flex-1 text-center text-[10px] font-semibold truncate px-1" style={{ color: '#A08070' }}>
            Plástico 100% reciclado 🇨🇱
          </p>

          {/* Cart + Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              to="/CarritoNuevo"
              onClick={() => setMobileOpen(false)}
              className="relative p-2 rounded-lg hover:bg-[#F8F3ED] transition-colors"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-5 h-5 text-[#2C1810]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-0.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: '#C0785C' }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg hover:bg-[#F8F3ED] transition-colors"
              aria-label="Menú"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-[#2C1810]" />
              ) : (
                <Menu className="w-5 h-5 text-[#2C1810]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: '#FBF8F3', borderTop: '1px solid #E0D5C8' }}>
            <div className="px-4 py-3 space-y-1">
              {/* Main Links */}
              {mainLinks.map((item) => {
                const active = isActive(item.path);
                const hasSubmenu = item.submenu && item.submenu.length > 0;

                return (
                  <div key={item.path}>
                    {/* div (no button) — evita botones anidados inválidos que rompían los taps */}
                    <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 flex-1 ${
                          active ? 'text-[#0F8B6C]' : 'text-[#7A6050]'
                        }`}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {item.label}
                      </Link>
                      {hasSubmenu && (
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === item.path ? null : item.path)}
                          className="p-1 hover:bg-[#F8F3ED] rounded"
                          aria-label={`Abrir submenú ${item.label}`}
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${dropdownOpen === item.path ? 'rotate-90' : ''}`} />
                        </button>
                      )}
                    </div>

                    {/* Mobile Submenu */}
                    {hasSubmenu && dropdownOpen === item.path && (
                      <div className="ml-3 mt-1 space-y-1 border-l-2 border-[#0F8B6C]/20 pl-3">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.path}
                            to={subitem.path}
                            className="block px-3 py-2 text-sm text-[#4B4F54] hover:text-[#0F8B6C] font-semibold rounded-lg hover:bg-[#F8F3ED] transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            {subitem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Divider */}
              <div className="my-2 border-t border-[#E0D5C8]/40" />

              {/* Help Links */}
              {helpLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[#7A6050] hover:text-[#0F8B6C] font-semibold hover:bg-[#F8F3ED] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
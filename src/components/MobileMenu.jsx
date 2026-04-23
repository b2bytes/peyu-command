import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Phone } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';

export default function MobileMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = () => setIsOpen(false);

  // Lock body scroll + cerrar al cambiar de ruta
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden w-11 h-11 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-all active:bg-white/30 flex-shrink-0"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-[9998] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[82vw] max-w-[340px] sm:max-w-[380px] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out z-[9999] lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        {/* Header con logo + cerrar */}
        <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-4 flex items-center justify-between flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-teal-500/15 to-cyan-500/15">
          <PEYULogo size="sm" />
          <button
            onClick={() => setIsOpen(false)}
            className="w-10 h-10 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 rounded-full transition-all active:bg-white/25"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección título */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Navegación</p>
        </div>

        {/* Menú */}
        <nav className="flex-1 overflow-y-auto peyu-scrollbar-light px-3 pb-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98] text-[15px] font-medium ${
                  isActive
                    ? 'bg-teal-500/25 text-white ring-1 ring-teal-400/40 shadow-lg'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-teal-500/40' : 'bg-white/10'
                }`}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* CTAs rápidos */}
        <div className="px-5 pb-3 space-y-2 flex-shrink-0 border-t border-white/10 pt-4">
          <Link
            to="/cart"
            onClick={handleNavClick}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold shadow-lg active:scale-[0.98] transition"
          >
            <ShoppingCart className="w-4 h-4" />
            Ver carrito
          </Link>
          <a
            href="https://wa.me/56912345678"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold active:scale-[0.98] transition"
          >
            <Phone className="w-4 h-4" />
            Hablar por WhatsApp
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 flex-shrink-0 text-white/40 text-[11px] text-center">
          PEYU · Regalos corporativos sostenibles
        </div>
      </aside>
    </>
  );
}
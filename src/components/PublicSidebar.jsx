import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, ShoppingBag, Building2, BookOpen, HelpCircle } from 'lucide-react';

export default function PublicSidebar() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/shop', label: 'Tienda', icon: ShoppingBag },
    { href: '/b2b/catalogo', label: 'Catálogo Corporativo', icon: BookOpen },
    { href: '/b2b/contacto', label: 'Cotización B2B', icon: Building2 },
    { href: '/soporte', label: 'Soporte', icon: HelpCircle },
  ];

  return (
    <>
      {/* FAB Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 left-6 z-40 w-12 h-12 bg-gradient-to-br from-[#0F8B6C] to-[#06634D] rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white"
        aria-label="Menú"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      {open && (
        <div className="fixed inset-0 z-30 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          
          {/* Panel */}
          <div className="w-64 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0F8B6C] to-[#06634D] text-white p-6">
              <h3 className="text-xl font-poppins font-bold">PEYU Chile</h3>
              <p className="text-xs text-white/70 mt-1">Regalos Corporativos Sostenibles</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-[#0F8B6C]/10 hover:text-[#0F8B6C] transition-all group"
                  >
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 space-y-2 text-xs text-gray-600">
              <p className="font-semibold text-gray-700">Contacto</p>
              <a href="tel:+56935040242" className="flex items-center gap-2 hover:text-[#0F8B6C]">
                📱 +56 9 3504 0242
              </a>
              <a href="mailto:ventas@peyuchile.cl" className="flex items-center gap-2 hover:text-[#0F8B6C]">
                📧 ventas@peyuchile.cl
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
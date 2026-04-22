import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ShoppingCart, Grid3x3, Building2, HelpCircle, Heart, BookOpen,
  Sparkles, Package, X, Menu, Phone, Instagram, MapPin
} from 'lucide-react';
import BackgroundSwitcher from './BackgroundSwitcher';

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/personalizar', label: 'Personalizar', icon: Sparkles },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/b2b/contacto', label: 'B2B Corporativo', icon: Building2 },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
  { href: '/seguimiento', label: 'Seguimiento pedido', icon: Package },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

/**
 * Drawer lateral para móvil (<lg). Se abre desde el bottom nav al tocar "Más".
 * Incluye menú completo + contacto rápido. Respeta safe-area de iOS.
 */
export default function PublicMobileDrawer({ open, onClose }) {
  const { pathname } = useLocation();

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg p-0.5">
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
              <span className="text-sm font-poppins font-black text-white leading-none">PEYU</span>
              <span className="text-[10px] text-white/50 leading-none">Chile</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white transition"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MENU_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                to={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500/20 border border-teal-400/40 text-teal-200'
                    : 'text-white/80 hover:bg-white/10 active:bg-white/15'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Fondo de la app */}
        <div className="border-t border-white/10 px-3 py-2 flex-shrink-0">
          <BackgroundSwitcher expanded />
        </div>

        {/* Contact footer */}
        <div className="border-t border-white/10 p-4 space-y-2 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-2">Contáctanos</p>
          <a
            href="https://wa.me/56935040242"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 text-sm text-white/80 hover:text-teal-300 transition"
          >
            <Phone className="w-4 h-4" /> +56 9 3504 0242
          </a>
          <a
            href="https://instagram.com/peyu.chile"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 text-sm text-white/80 hover:text-teal-300 transition"
          >
            <Instagram className="w-4 h-4" /> @peyu.chile
          </a>
          <p className="flex items-start gap-2.5 text-xs text-white/60">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Providencia · Macul, Santiago
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Botón hamburguesa flotante para páginas que quieran reutilizarlo.
 * (Opcional — el bottom nav ya trae su propio acceso al drawer.)
 */
export function PublicMobileDrawerButton({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="lg:hidden w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
      aria-label="Abrir menú"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
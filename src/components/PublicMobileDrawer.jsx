import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, ShoppingCart, Grid3x3, Building2, HelpCircle, Heart, BookOpen,
  Sparkles, Package, X, Menu, Phone, Instagram, MapPin
} from 'lucide-react';
import PEYULogo from './PEYULogo';

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

      {/* Drawer Liquid Dual */}
      <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm ld-glass-strong border-r border-ld-border flex flex-col animate-in slide-in-from-left duration-300" style={{ boxShadow: '8px 0 32px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ld-border flex-shrink-0 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to="/" onClick={onClose} className="flex items-center" aria-label="PEYU Chile - Inicio">
            <PEYULogo size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full ld-glass-soft flex items-center justify-center text-ld-fg active:scale-95 transition"
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  active ? 'text-ld-fg ring-1' : 'text-ld-fg-muted hover:text-ld-fg active:scale-95'
                }`}
                style={active ? { background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' } : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Contact footer */}
        <div className="border-t border-ld-border p-4 space-y-2 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ld-fg-muted font-bold mb-2">Contáctanos</p>
          <a
            href="https://wa.me/56935040242"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 text-sm text-ld-fg-soft hover:text-ld-fg transition"
          >
            <Phone className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> +56 9 3504 0242
          </a>
          <a
            href="https://instagram.com/peyu.chile"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 text-sm text-ld-fg-soft hover:text-ld-fg transition"
          >
            <Instagram className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> @peyu.chile
          </a>
          <p className="flex items-start gap-2.5 text-xs text-ld-fg-muted">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-action)' }} />
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
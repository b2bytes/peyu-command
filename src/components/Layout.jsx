// ============================================================================
// Layout · Panel Admin PEYU
// ----------------------------------------------------------------------------
// Sidebar con animación fluida de colapso/expansión, persistencia del estado,
// tipografías premium (Plus Jakarta Sans + Inter) y navegación reorganizada
// por frecuencia de uso. La nav vive en components/admin/SidebarNav.jsx.
// ============================================================================
import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ShoppingCart, Building2, Turtle, Menu, X,
} from 'lucide-react';
import SEO from '@/components/SEO';
import SidebarNav from '@/components/admin/SidebarNav';
import CommandCenterFAB from '@/components/admin/CommandCenterFAB';
import PeyuCompanion from '@/components/admin/PeyuCompanion';

const COLLAPSED_KEY = 'peyu_sidebar_collapsed';

export default function Layout() {
  // Estado persistente del colapso del sidebar (desktop)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
  });
  // Drawer móvil (siempre cerrado por defecto)
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  // Cerrar drawer al cambiar de ruta
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SEO
        title="Panel Admin · PEYU Chile"
        description="Panel interno de gestión PEYU. Acceso restringido."
        noindex
      />

      {/* ─── TOP BAR MÓVIL (sólo < lg) ─── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-3 border-b border-white/[0.06] backdrop-blur-md" style={{ background: 'rgba(15,18,28,0.85)' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10 active:scale-95 transition"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-teal-500 to-cyan-600">
            <Turtle className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-jakarta font-extrabold text-white text-sm tracking-tight">PEYU</span>
          <span className="text-[10px] text-teal-300/80 font-medium">· Comando</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Backdrop drawer móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`flex flex-col border-r border-white/[0.06] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] z-50
          lg:flex-shrink-0 lg:relative lg:translate-x-0
          fixed inset-y-0 left-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, hsl(220,22%,11%) 0%, hsl(222,20%,9%) 100%)',
          width: collapsed ? 68 : 240,
        }}
      >
        {/* Logo / Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] h-[60px]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-teal-500 to-cyan-600 shadow-[0_4px_12px_rgba(14,165,164,0.35)]">
            <Turtle className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            <div className="font-jakarta font-extrabold text-white text-[17px] leading-none tracking-tight">PEYU</div>
            <div className="text-[11px] mt-1 truncate text-teal-300/90 font-inter font-medium">Centro de Comando</div>
          </div>
          {/* Cerrar drawer (sólo móvil) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 active:scale-95 transition"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation (focal component) */}
        <SidebarNav collapsed={collapsed} />

        {/* Botón de colapsar (sólo desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-[52px] w-6 h-6 rounded-full items-center justify-center border z-10 transition-all hover:bg-teal-500/20 hover:border-teal-400 hover:scale-110 active:scale-95 shadow-lg"
          style={{ background: 'hsl(220,18%,13%)', borderColor: 'hsl(220,14%,24%)', color: '#9ca3af' }}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Footer: accesos a tienda pública */}
        <div className="border-t border-white/[0.06] p-2 space-y-0.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title={collapsed ? 'Tienda B2C' : undefined}
            className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[12px] font-inter font-medium text-white/55 hover:text-teal-300 hover:bg-teal-500/[0.08] transition-all ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <ShoppingCart className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={1.8} />
            {!collapsed && <span>Tienda B2C</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                Tienda B2C
              </span>
            )}
          </a>
          <a
            href="/b2b/catalogo"
            target="_blank"
            rel="noreferrer"
            title={collapsed ? 'Catálogo B2B' : undefined}
            className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg text-[12px] font-inter font-medium text-white/55 hover:text-teal-300 hover:bg-teal-500/[0.08] transition-all ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <Building2 className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={1.8} />
            {!collapsed && <span>Catálogo B2B</span>}
            {collapsed && (
              <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                Catálogo B2B
              </span>
            )}
          </a>

          {!collapsed && (
            <div className="px-3 pt-3 pb-1 text-[10px] text-white/30 font-inter">
              <div className="font-jakarta font-bold text-white/50 tracking-wide">B2BYTES</div>
              <div className="text-white/25">v1.0 · Peyu Chile SPA</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main · canvas Liquid Dual (respeta día/noche) */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ld-canvas relative pt-14 lg:pt-0">
        <Outlet />
        {/* FAB flotante: vuelve al Centro de Comando desde cualquier vista admin */}
        <CommandCenterFAB />
        {/* Peyu Companion: asistente omnipresente en TODO el admin.
            Responde data viva, knowledge RAG y ejecuta comandos backend. */}
        <PeyuCompanion />
      </main>
    </div>
  );
}
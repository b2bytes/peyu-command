// ============================================================================
// Layout · Panel Admin PEYU
// ----------------------------------------------------------------------------
// Sidebar con animación fluida de colapso/expansión, persistencia del estado,
// tipografías premium (Plus Jakarta Sans + Inter) y navegación reorganizada
// por frecuencia de uso. La nav vive en components/admin/SidebarNav.jsx.
// ============================================================================
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, ShoppingCart, Building2, Turtle,
} from 'lucide-react';
import SEO from '@/components/SEO';
import SidebarNav from '@/components/admin/SidebarNav';
import CommandCenterFAB from '@/components/admin/CommandCenterFAB';

const COLLAPSED_KEY = 'peyu_sidebar_collapsed';

export default function Layout() {
  // Estado persistente del colapso del sidebar
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SEO
        title="Panel Admin · PEYU Chile"
        description="Panel interno de gestión PEYU. Acceso restringido."
        noindex
      />

      {/* ─── SIDEBAR ─── */}
      <aside
        className="flex-shrink-0 flex flex-col relative border-r border-white/[0.06] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
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
        </div>

        {/* Navigation (focal component) */}
        <SidebarNav collapsed={collapsed} />

        {/* Botón de colapsar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[52px] w-6 h-6 rounded-full flex items-center justify-center border z-10 transition-all hover:bg-teal-500/20 hover:border-teal-400 hover:scale-110 active:scale-95 shadow-lg"
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

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative">
        <Outlet />
        {/* FAB flotante: vuelve al Centro de Comando desde cualquier vista admin */}
        <CommandCenterFAB />
      </main>
    </div>
  );
}
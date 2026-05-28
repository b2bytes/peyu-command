import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';

/**
 * FAB flotante "Centro de Comando" — visible en cualquier ruta admin
 * (excepto el propio dashboard). Permite volver al hub en 1 click.
 */
export default function CommandCenterFAB() {
  const { pathname } = useLocation();

  // No mostrar en el propio dashboard (/admin o /admin/)
  if (pathname === '/admin' || pathname === '/admin/') return null;

  return (
    <Link
      to="/admin/"
      title="Volver al Centro de Comando"
      aria-label="Centro de Comando"
      className="fixed bottom-4 right-4 z-40 group flex items-center gap-1.5 h-10 pl-2.5 pr-3 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-[0_6px_20px_rgba(14,165,164,0.4)] hover:shadow-[0_10px_28px_rgba(14,165,164,0.55)] hover:scale-105 active:scale-95 transition-all border border-white/20 backdrop-blur-md"
    >
      <LayoutDashboard className="w-4 h-4" strokeWidth={2.2} />
      <span className="text-[11px] font-poppins font-semibold whitespace-nowrap">
        Comando
      </span>
    </Link>
  );
}
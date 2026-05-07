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
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 h-12 pl-3 pr-4 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white shadow-[0_8px_24px_rgba(14,165,164,0.45)] hover:shadow-[0_12px_32px_rgba(14,165,164,0.6)] hover:scale-105 active:scale-95 transition-all border border-white/20 backdrop-blur-md"
    >
      <LayoutDashboard className="w-5 h-5" strokeWidth={2.2} />
      <span className="text-xs font-poppins font-semibold whitespace-nowrap">
        Centro de Comando
      </span>
    </Link>
  );
}
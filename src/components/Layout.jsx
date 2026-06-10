// ============================================================================
// Layout · Panel Admin PEYU sin Sidebar (Top Nav unificado)
// Navegación limpia en el header, sidebar eliminado completamente.
// ============================================================================
import { Outlet, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import CommandCenterFAB from '@/components/admin/CommandCenterFAB';
import PeyuCompanion from '@/components/admin/PeyuCompanion';
import AdminTopNav from '@/components/admin/AdminTopNav';

export default function Layout() {
  // En las páginas de agente conversacional, los FABs flotantes (Comando +
  // Companion) tapaban el input del chat en móvil — y son redundantes ahí.
  const { pathname } = useLocation();
  const esAgente = pathname.includes('/agente');
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <SEO
        title="Panel Admin · PEYU Chile"
        description="Panel interno de gestión PEYU. Acceso restringido."
        noindex
      />

      {/* Top Navigation — unificado en todas las páginas */}
      <AdminTopNav />

      {/* Main · canvas Liquid Dual (respeta día/noche) */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ld-canvas relative">
        <Outlet />
        {/* FAB flotante: vuelve al Centro de Comando desde cualquier vista admin */}
        {!esAgente && <CommandCenterFAB />}
        {/* Peyu Companion: asistente omnipresente en TODO el admin.
            Responde data viva, knowledge RAG y ejecuta comandos backend. */}
        {!esAgente && <PeyuCompanion />}
      </main>
    </div>
  );
}
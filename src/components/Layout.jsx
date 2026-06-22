// ============================================================================
// Layout · Panel Admin PEYU sin Sidebar (Top Nav unificado)
// Navegación limpia en el header, sidebar eliminado completamente.
// ============================================================================
import { Outlet, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import PeyuCompanion from '@/components/admin/PeyuCompanion';
import AdminTopNav from '@/components/admin/AdminTopNav';

export default function Layout() {
  // En las páginas de agente conversacional, los FABs flotantes (Comando +
  // Companion) tapaban el input del chat en móvil — y son redundantes ahí.
  const { pathname } = useLocation();
  const esAgente = pathname.includes('/agente');
  return (
    // height 100dvh: en iOS Safari, 100vh incluye la zona de la barra de URL y
    // cortaba el fondo de las páginas (ej. el input del Agent OS). Los
    // navegadores sin soporte dvh ignoran el style y usan h-screen.
    <div className="flex flex-col h-screen bg-background overflow-hidden" style={{ height: '100dvh' }}>
      <SEO
        title="Panel Admin · PEYU Chile"
        description="Panel interno de gestión PEYU. Acceso restringido."
        noindex
      />

      {/* Top Navigation — unificado en todas las páginas EXCEPTO el Agent OS,
          que es el epicentro conversacional a pantalla completa: tiene su propio
          header + sidebar de hilos, y la barra admin rompía la sensación de
          "una sola pantalla" e invitaba a saltar a otras páginas. */}
      {!esAgente && <AdminTopNav />}

      {/* Main · canvas Liquid Dual (respeta día/noche) */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ld-canvas relative">
        <Outlet />
        {/* El antiguo FAB "Comando" (volver a /admin) se eliminó: el nuevo centro
            de comandos general es la página Agente, no el dashboard. */}
        {/* Peyu Companion: asistente omnipresente en TODO el admin.
            Responde data viva, knowledge RAG y ejecuta comandos backend. */}
        {!esAgente && <PeyuCompanion />}
      </main>
    </div>
  );
}
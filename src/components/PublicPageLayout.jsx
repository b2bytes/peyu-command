import { Outlet, useLocation } from 'react-router-dom';
import PublicNavBar from '@/components/PublicNavBar';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import VendedorChatBar from '@/components/vendedor/VendedorChatBar';

// Rutas que renderizan su PROPIA MobileNavBarV2 en modo acción (CTA comprar/pagar).
// En ellas NO mostramos los tabs de navegación para no tapar el botón de compra.
const ACTION_ROUTES = ['/ProductoNuevo', '/CarritoNuevo', '/CheckoutNuevo', '/EmpresaProducto'];

/**
 * PublicPageLayout — wrapper universal para TODAS las páginas públicas.
 * Garantiza: PublicNavBar (top, sticky) + MobileNavBarV2 (bottom mobile) + footer.
 * Cada página hija solo renderiza su contenido, sin preocuparse del nav.
 */
export default function PublicPageLayout() {
  const { pathname } = useLocation();
  const isActionRoute = ACTION_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="min-h-screen flex flex-col font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <PublicNavBar />
      <main className="flex-1 pb-24 lg:pb-0">
        <Outlet />
      </main>
      {/* MobileNavBarV2 en modo exploración (sin props = NavTabs).
          En rutas de acción la página renderiza su propia barra CTA. */}
      {!isActionRoute && <MobileNavBarV2 />}
      {/* Vendedor IA persistente: input central fijo abajo en TODAS las páginas públicas */}
      <VendedorChatBar />
    </div>
  );
}
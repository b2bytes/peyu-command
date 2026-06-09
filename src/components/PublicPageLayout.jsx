import { Outlet } from 'react-router-dom';
import PublicNavBar from '@/components/PublicNavBar';
import MobileNavBarV2 from '@/components/shopv2/MobileNavBarV2';
import PublicFooter from '@/components/PublicFooter';

/**
 * PublicPageLayout — wrapper universal para TODAS las páginas públicas.
 * Garantiza: PublicNavBar (top, sticky) + MobileNavBarV2 (bottom mobile) + footer.
 * Cada página hija solo renderiza su contenido, sin preocuparse del nav.
 */
export default function PublicPageLayout() {
  return (
    <div className="min-h-screen flex flex-col font-inter" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      <PublicNavBar />
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MobileNavBarV2 />
    </div>
  );
}
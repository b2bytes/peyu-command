import { Suspense } from 'react';
import { lazyWithRetry } from '@/lib/lazy-with-retry';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import CookieBanner from '@/components/CookieBanner';

// ── PUBLIC PAGES (eager) ─────────────────────────────────────────────
// Cargadas inmediatamente porque son la cara pública del sitio:
// crawlers, primer LCP, conversión. NO van a ser lazy.
import PublicLayout from './components/PublicLayout';
import ShopLanding from './pages/ShopLanding';
import Shop from './pages/Shop';
import ProductoDetalle from './pages/ProductoDetalle';
import Carrito from './pages/Carrito';
import B2BContacto from './pages/B2BContacto';
import B2BPropuesta from './pages/B2BPropuesta';
import B2BSelfService from './pages/B2BSelfService';
import B2BMiCuenta from './pages/B2BMiCuenta';
import CatalogoCorporativo from './pages/CatalogoCorporativo';
import PersonalizacionFlow from './pages/PersonalizacionFlow';
import SoportePublico from './pages/SoportePublico';
import SeguimientoPedido from './pages/SeguimientoPedido';
import CatalogoVisual from './pages/CatalogoVisual';
import Nosotros from './pages/Nosotros';
import Blog from './pages/Blog';
import BlogPostPage from './pages/BlogPost';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import Cookies from './pages/Cookies';
import Cambios from './pages/Cambios';
import Envios from './pages/Envios';
import FAQ from './pages/FAQ';
import Contacto from './pages/Contacto';
import Lanzamiento from './pages/Lanzamiento';
import Canjear from './pages/Canjear';
import RegalarGiftCard from './pages/RegalarGiftCard';
import Gracias from './pages/Gracias';

// ── ADMIN PAGES (lazy + retry) ───────────────────────────────────────
// Cargadas on-demand. Cada lazy() está envuelto en lazyWithRetry para
// recuperarse automáticamente de stale chunks tras un deploy nuevo.
const Layout = lazyWithRetry(() => import('./components/Layout'), { name: 'Layout' });
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), { name: 'Dashboard' });
const PipelineB2B = lazyWithRetry(() => import('./pages/PipelineB2B'), { name: 'PipelineB2B' });
const Operaciones = lazyWithRetry(() => import('./pages/Operaciones'), { name: 'Operaciones' });
const Marketing = lazyWithRetry(() => import('./pages/Marketing'), { name: 'Marketing' });
const MarketingHub = lazyWithRetry(() => import('./pages/MarketingHub'), { name: 'MarketingHub' });
const Analitica = lazyWithRetry(() => import('./pages/Analitica'), { name: 'Analitica' });
const Catalogo = lazyWithRetry(() => import('./pages/Catalogo'), { name: 'Catalogo' });
const CPQCalculator = lazyWithRetry(() => import('./pages/CPQCalculator'), { name: 'CPQCalculator' });
const Soporte = lazyWithRetry(() => import('./pages/Soporte'), { name: 'Soporte' });
const Financiero = lazyWithRetry(() => import('./pages/Financiero'), { name: 'Financiero' });
const Clientes = lazyWithRetry(() => import('./pages/Clientes'), { name: 'Clientes' });
const Tiendas = lazyWithRetry(() => import('./pages/Tiendas'), { name: 'Tiendas' });
const Proveedores = lazyWithRetry(() => import('./pages/Proveedores'), { name: 'Proveedores' });
const Equipo = lazyWithRetry(() => import('./pages/Equipo'), { name: 'Equipo' });
const OKRs = lazyWithRetry(() => import('./pages/OKRs'), { name: 'OKRs' });
const Inventario = lazyWithRetry(() => import('./pages/Inventario'), { name: 'Inventario' });
const Ecommerce = lazyWithRetry(() => import('./pages/Ecommerce'), { name: 'Ecommerce' });
const FlujoCaja = lazyWithRetry(() => import('./pages/FlujoCaja'), { name: 'FlujoCaja' });
const Trazabilidad = lazyWithRetry(() => import('./pages/Trazabilidad'), { name: 'Trazabilidad' });
const Compras = lazyWithRetry(() => import('./pages/Compras'), { name: 'Compras' });
const ESG = lazyWithRetry(() => import('./pages/ESG'), { name: 'ESG' });
const PlanAccion = lazyWithRetry(() => import('./pages/PlanAccion'), { name: 'PlanAccion' });
const AsistenteIA = lazyWithRetry(() => import('./pages/AsistenteIA'), { name: 'AsistenteIA' });
const Cotizaciones = lazyWithRetry(() => import('./pages/Cotizaciones'), { name: 'Cotizaciones' });
const Calendario = lazyWithRetry(() => import('./pages/Calendario'), { name: 'Calendario' });
const Reportes = lazyWithRetry(() => import('./pages/Reportes'), { name: 'Reportes' });
const Configuracion = lazyWithRetry(() => import('./pages/Configuracion'), { name: 'Configuracion' });
const Alertas = lazyWithRetry(() => import('./pages/Alertas'), { name: 'Alertas' });
const AdminPropuestas = lazyWithRetry(() => import('./pages/AdminPropuestas'), { name: 'AdminPropuestas' });
const EstadoActual = lazyWithRetry(() => import('./pages/EstadoActual'), { name: 'EstadoActual' });
const EmbudoVentas = lazyWithRetry(() => import('./pages/EmbudoVentas'), { name: 'EmbudoVentas' });
const ImportarClientes = lazyWithRetry(() => import('./pages/ImportarClientes'), { name: 'ImportarClientes' });
const Backlinks = lazyWithRetry(() => import('./pages/Backlinks'), { name: 'Backlinks' });
const IntegracionWoo = lazyWithRetry(() => import('./pages/IntegracionWoo'), { name: 'IntegracionWoo' });
const ProcesarPedidos = lazyWithRetry(() => import('./pages/ProcesarPedidos'), { name: 'ProcesarPedidos' });
const Cliente360 = lazyWithRetry(() => import('./pages/Cliente360'), { name: 'Cliente360' });
const PineconeBrain = lazyWithRetry(() => import('./pages/PineconeBrain'), { name: 'PineconeBrain' });
const GoogleWorkspace = lazyWithRetry(() => import('./pages/GoogleWorkspace'), { name: 'GoogleWorkspace' });
const Indexacion = lazyWithRetry(() => import('./pages/Indexacion'), { name: 'Indexacion' });
const AdsCommand = lazyWithRetry(() => import('./pages/AdsCommand'), { name: 'AdsCommand' });
const LaunchMap = lazyWithRetry(() => import('./pages/LaunchMap'), { name: 'LaunchMap' });
const GA4Realtime = lazyWithRetry(() => import('./pages/GA4Realtime'), { name: 'GA4Realtime' });
const AdminProducts = lazyWithRetry(() => import('./pages/AdminProducts'), { name: 'AdminProducts' });
const TarifasEnvio = lazyWithRetry(() => import('./pages/TarifasEnvio'), { name: 'TarifasEnvio' });
const MonitoreoIA = lazyWithRetry(() => import('./pages/MonitoreoIA'), { name: 'MonitoreoIA' });
const Trazabilidad360 = lazyWithRetry(() => import('./pages/Trazabilidad360'), { name: 'Trazabilidad360' });
const CentroCostosReal = lazyWithRetry(() => import('./pages/CentroCostosReal'), { name: 'CentroCostosReal' });
const CentroLogistico = lazyWithRetry(() => import('./pages/CentroLogistico'), { name: 'CentroLogistico' });
const PipelineB2C = lazyWithRetry(() => import('./pages/PipelineB2C'), { name: 'PipelineB2C' });
const Cockpit = lazyWithRetry(() => import('./pages/Cockpit'), { name: 'Cockpit' });

const AdminLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AdminLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<AdminLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pipeline" element={<PipelineB2B />} />
          <Route path="cpq" element={<CPQCalculator />} />
          <Route path="soporte" element={<Soporte />} />
          <Route path="financiero" element={<Financiero />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="tiendas" element={<Tiendas />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="equipo" element={<Equipo />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="okrs" element={<OKRs />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="ecommerce" element={<Ecommerce />} />
          <Route path="flujo-caja" element={<FlujoCaja />} />
          <Route path="trazabilidad" element={<Trazabilidad />} />
          <Route path="compras" element={<Compras />} />
          <Route path="esg" element={<ESG />} />
          <Route path="plan" element={<PlanAccion />} />
          <Route path="ia" element={<AsistenteIA />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="calendario" element={<Calendario />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="operaciones" element={<Operaciones />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="marketing-hub" element={<MarketingHub />} />
          <Route path="analitica" element={<Analitica />} />
          <Route path="propuestas" element={<AdminPropuestas />} />
          <Route path="estado-actual" element={<EstadoActual />} />
          <Route path="embudo" element={<EmbudoVentas />} />
          <Route path="importar-clientes" element={<ImportarClientes />} />
          <Route path="backlinks" element={<Backlinks />} />
          <Route path="woocommerce" element={<IntegracionWoo />} />
          <Route path="procesar-pedidos" element={<ProcesarPedidos />} />
          <Route path="cliente-360" element={<Cliente360 />} />
          <Route path="brain" element={<PineconeBrain />} />
          <Route path="google" element={<GoogleWorkspace />} />
          <Route path="indexacion" element={<Indexacion />} />
          <Route path="ads-command" element={<AdsCommand />} />
          <Route path="launch-map" element={<LaunchMap />} />
          <Route path="ga-realtime" element={<GA4Realtime />} />
          <Route path="admin-products" element={<AdminProducts />} />
          <Route path="tarifas-envio" element={<TarifasEnvio />} />
          <Route path="monitoreo-ia" element={<MonitoreoIA />} />
          <Route path="trazabilidad-360" element={<Trazabilidad360 />} />
          <Route path="centro-costos" element={<CentroCostosReal />} />
          <Route path="bluex" element={<CentroLogistico />} />
          <Route path="pipeline-b2c" element={<PipelineB2C />} />
          <Route path="cockpit" element={<Cockpit />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  )
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              {/* Landing Page - Standalone */}
              <Route path="/" element={<ShopLanding />} />

              {/* /lanzamiento - Pure conversion landing (standalone, sin PublicLayout) */}
              <Route path="/lanzamiento" element={<Lanzamiento />} />

              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/shop" element={<Shop />} />
                <Route path="/producto/:id" element={<ProductoDetalle />} />
                <Route path="/cart" element={<Carrito />} />
                <Route path="/b2b/contacto" element={<B2BContacto />} />
                <Route path="/b2b/propuesta" element={<B2BPropuesta />} />
                <Route path="/b2b/self-service" element={<B2BSelfService />} />
                <Route path="/b2b/mi-cuenta" element={<B2BMiCuenta />} />
                <Route path="/b2b/catalogo" element={<CatalogoCorporativo />} />
                <Route path="/personalizar" element={<PersonalizacionFlow />} />
                <Route path="/soporte" element={<SoportePublico />} />
                <Route path="/seguimiento" element={<SeguimientoPedido />} />
                <Route path="/catalogo-visual" element={<CatalogoVisual />} />
                <Route path="/nosotros" element={<Nosotros />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/envios" element={<Envios />} />
                <Route path="/cambios" element={<Cambios />} />
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/canjear" element={<Canjear />} />
                <Route path="/regalar-giftcard" element={<RegalarGiftCard />} />
                <Route path="/gracias" element={<Gracias />} />
              </Route>

              {/* Admin Routes - Protected (lazy-loaded) */}
              <Route path="/admin/*" element={<AuthenticatedApp />} />
            </Routes>
            <Toaster />
            <PWAInstallBanner />
            <CookieBanner />
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
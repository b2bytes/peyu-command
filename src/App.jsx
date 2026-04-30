import { lazy, Suspense } from 'react';
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

// ── ADMIN PAGES (lazy) ───────────────────────────────────────────────
// Cargadas on-demand. Reduce ~70% del bundle inicial (público nunca las ve).
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PipelineB2B = lazy(() => import('./pages/PipelineB2B'));
const Operaciones = lazy(() => import('./pages/Operaciones'));
const Marketing = lazy(() => import('./pages/Marketing'));
const MarketingHub = lazy(() => import('./pages/MarketingHub'));
const Analitica = lazy(() => import('./pages/Analitica'));
const Catalogo = lazy(() => import('./pages/Catalogo'));
const CPQCalculator = lazy(() => import('./pages/CPQCalculator'));
const Soporte = lazy(() => import('./pages/Soporte'));
const Financiero = lazy(() => import('./pages/Financiero'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Tiendas = lazy(() => import('./pages/Tiendas'));
const Proveedores = lazy(() => import('./pages/Proveedores'));
const Equipo = lazy(() => import('./pages/Equipo'));
const OKRs = lazy(() => import('./pages/OKRs'));
const Inventario = lazy(() => import('./pages/Inventario'));
const Ecommerce = lazy(() => import('./pages/Ecommerce'));
const FlujoCaja = lazy(() => import('./pages/FlujoCaja'));
const Trazabilidad = lazy(() => import('./pages/Trazabilidad'));
const Compras = lazy(() => import('./pages/Compras'));
const ESG = lazy(() => import('./pages/ESG'));
const PlanAccion = lazy(() => import('./pages/PlanAccion'));
const AsistenteIA = lazy(() => import('./pages/AsistenteIA'));
const Cotizaciones = lazy(() => import('./pages/Cotizaciones'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Alertas = lazy(() => import('./pages/Alertas'));
const AdminPropuestas = lazy(() => import('./pages/AdminPropuestas'));
const EstadoActual = lazy(() => import('./pages/EstadoActual'));
const EmbudoVentas = lazy(() => import('./pages/EmbudoVentas'));
const ImportarClientes = lazy(() => import('./pages/ImportarClientes'));
const Backlinks = lazy(() => import('./pages/Backlinks'));
const IntegracionWoo = lazy(() => import('./pages/IntegracionWoo'));
const ProcesarPedidos = lazy(() => import('./pages/ProcesarPedidos'));
const Cliente360 = lazy(() => import('./pages/Cliente360'));
const PineconeBrain = lazy(() => import('./pages/PineconeBrain'));
const GoogleWorkspace = lazy(() => import('./pages/GoogleWorkspace'));
const Indexacion = lazy(() => import('./pages/Indexacion'));
const AdsCommand = lazy(() => import('./pages/AdsCommand'));
const LaunchMap = lazy(() => import('./pages/LaunchMap'));
const GA4Realtime = lazy(() => import('./pages/GA4Realtime'));

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
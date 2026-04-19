import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import Dashboard from './pages/Dashboard';
import ShopLanding from './pages/ShopLanding';
import PipelineB2B from './pages/PipelineB2B';
import Operaciones from './pages/Operaciones';
import Marketing from './pages/Marketing';
import Analitica from './pages/Analitica';
import Catalogo from './pages/Catalogo';
import CPQCalculator from './pages/CPQCalculator';
import Soporte from './pages/Soporte';
import Financiero from './pages/Financiero';
import Clientes from './pages/Clientes';
import Tiendas from './pages/Tiendas';
import Proveedores from './pages/Proveedores';
import Equipo from './pages/Equipo';
import OKRs from './pages/OKRs';
import Inventario from './pages/Inventario';
import Ecommerce from './pages/Ecommerce';
import FlujoCaja from './pages/FlujoCaja';
import Trazabilidad from './pages/Trazabilidad';
import Compras from './pages/Compras';
import ESG from './pages/ESG';
import PlanAccion from './pages/PlanAccion';
import AsistenteIA from './pages/AsistenteIA';
import Cotizaciones from './pages/Cotizaciones';
import Calendario from './pages/Calendario';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import Alertas from './pages/Alertas';
import Shop from './pages/Shop';
import ProductoDetalle from './pages/ProductoDetalle';
import Carrito from './pages/Carrito';
import B2BContacto from './pages/B2BContacto';
import AdminPropuestas from './pages/AdminPropuestas';
import B2BPropuesta from './pages/B2BPropuesta';
import B2BSelfService from './pages/B2BSelfService';
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
import EstadoActual from './pages/EstadoActual';
import EmbudoVentas from './pages/EmbudoVentas';
import ImportarClientes from './pages/ImportarClientes';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
        <Route path="analitica" element={<Analitica />} />
        <Route path="propuestas" element={<AdminPropuestas />} />
        <Route path="estado-actual" element={<EstadoActual />} />
        <Route path="embudo" element={<EmbudoVentas />} />
        <Route path="importar-clientes" element={<ImportarClientes />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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

              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/shop" element={<Shop />} />
                <Route path="/producto/:id" element={<ProductoDetalle />} />
                <Route path="/cart" element={<Carrito />} />
                <Route path="/b2b/contacto" element={<B2BContacto />} />
                <Route path="/b2b/propuesta" element={<B2BPropuesta />} />
                <Route path="/b2b/self-service" element={<B2BSelfService />} />
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
              </Route>

              {/* Admin Routes - Protected */}
              <Route path="/admin/*" element={<AuthenticatedApp />} />
            </Routes>
            <Toaster />
            <PWAInstallBanner />
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
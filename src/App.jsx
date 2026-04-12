import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
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
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<PipelineB2B />} />
        <Route path="/cpq" element={<CPQCalculator />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/financiero" element={<Financiero />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/tiendas" element={<Tiendas />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/okrs" element={<OKRs />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ecommerce" element={<Ecommerce />} />
        <Route path="/flujo-caja" element={<FlujoCaja />} />
        <Route path="/trazabilidad" element={<Trazabilidad />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/esg" element={<ESG />} />
        <Route path="/plan" element={<PlanAccion />} />
        <Route path="/operaciones" element={<Operaciones />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/analitica" element={<Analitica />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Settings, BarChart3, Megaphone, Turtle, Package, Calculator, MessageSquare, TrendingUp, Store, UserCheck, Truck, HardHat, Flag, Archive } from "lucide-react";

const navItems = [
  { path: "/", label: "Centro de Comando", icon: LayoutDashboard },
  { path: "/soporte", label: "Soporte & WhatsApp", icon: MessageSquare },
  { path: "/pipeline", label: "Pipeline B2B", icon: Users },
  { path: "/cpq", label: "CPQ Cotizador", icon: Calculator },
  { path: "/catalogo", label: "Catálogo SKUs", icon: Package },
  { path: "/operaciones", label: "Operaciones", icon: Settings },
  { path: "/marketing", label: "Marketing", icon: Megaphone },
  { path: "/analitica", label: "Analítica", icon: BarChart3 },
  { path: "/financiero", label: "Financiero", icon: TrendingUp },
  { path: "/clientes", label: "Clientes / LTV", icon: UserCheck },
  { path: "/tiendas", label: "Tiendas Físicas", icon: Store },
  { path: "/proveedores", label: "Proveedores", icon: Truck },
  { path: "/equipo", label: "Equipo / RRHH", icon: HardHat },
  { path: "/okrs", label: "OKRs & Metas", icon: Flag },
  { path: "/inventario", label: "Inventario", icon: Archive },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: '#2C3340' }}>
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: '#3a4252' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#0F8B6C' }}>
              <Turtle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-poppins font-bold text-white text-lg leading-none">PEYU</div>
              <div className="text-xs mt-0.5" style={{ color: '#A7D9C9' }}>Centro de Comando</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={isActive ? { background: '#0F8B6C', color: 'white' } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-xs" style={{ borderColor: '#3a4252', color: '#6b7280' }}>
          <div className="font-medium" style={{ color: '#9ca3af' }}>B2BYTES</div>
          <div>Enterprise as a Service</div>
          <div className="mt-1" style={{ color: '#4b5563' }}>v1.0 • Peyu Chile SPA</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
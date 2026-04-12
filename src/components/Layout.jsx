import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, BarChart3, Megaphone, Turtle, Package,
  Calculator, MessageSquare, TrendingUp, Store, UserCheck, Truck,
  HardHat, Flag, Archive, ShoppingCart, Settings, ChevronLeft, ChevronRight, Leaf, ListChecks, Sparkles, FileText, CalendarDays, PieChart
} from "lucide-react";

const navGroups = [
  {
    label: "Operaciones",
    items: [
      { path: "/", label: "Centro de Comando", icon: LayoutDashboard },
      { path: "/pipeline", label: "Pipeline B2B", icon: Users },
      { path: "/cotizaciones", label: "Cotizaciones", icon: FileText },
      { path: "/cpq", label: "CPQ Cotizador", icon: Calculator },
      { path: "/soporte", label: "Soporte & WhatsApp", icon: MessageSquare },
    ]
  },
  {
    label: "Comercial",
    items: [
      { path: "/ecommerce", label: "E-commerce", icon: ShoppingCart },
      { path: "/tiendas", label: "Tiendas Físicas", icon: Store },
      { path: "/clientes", label: "Clientes / LTV", icon: UserCheck },
      { path: "/catalogo", label: "Catálogo SKUs", icon: Package },
    ]
  },
  {
    label: "Producción",
    items: [
      { path: "/operaciones", label: "Operaciones", icon: Settings },
      { path: "/trazabilidad", label: "Trazabilidad", icon: HardHat },
      { path: "/inventario", label: "Inventario", icon: Archive },
      { path: "/proveedores", label: "Proveedores", icon: Truck },
      { path: "/compras", label: "Compras & Supply", icon: ShoppingCart },
      { path: "/esg", label: "Sostenibilidad ESG", icon: Leaf },
    ]
  },
  {
    label: "Estrategia",
    items: [
      { path: "/financiero", label: "Financiero", icon: TrendingUp },
      { path: "/flujo-caja", label: "Flujo de Caja", icon: Store },
      { path: "/marketing", label: "Marketing", icon: Megaphone },
      { path: "/analitica", label: "Analítica", icon: BarChart3 },
      { path: "/equipo", label: "Equipo / RRHH", icon: HardHat },
      { path: "/okrs", label: "OKRs & Metas", icon: Flag },
      { path: "/calendario", label: "Agenda Comercial", icon: CalendarDays },
      { path: "/plan", label: "Plan de Acción", icon: ListChecks },
      { path: "/ia", label: "Asistente IA", icon: Sparkles },
      { path: "/reportes", label: "Reportes & Análisis", icon: PieChart },
    ]
  }
];

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-300 relative"
        style={{ background: 'hsl(220,16%,14%)', width: collapsed ? 64 : 220 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'hsl(220,14%,20%)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0F8B6C' }}>
            <Turtle className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-poppins font-bold text-white text-base leading-none">PEYU</div>
              <div className="text-xs mt-0.5 truncate" style={{ color: '#A7D9C9' }}>Centro de Comando</div>
            </div>
          )}
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(220,14%,25%) transparent' }}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(220,10%,40%)' }}>
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 mx-2 px-2.5 py-2 rounded-lg transition-all duration-150 text-sm font-medium ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    } ${collapsed ? 'justify-center' : ''}`}
                    style={isActive ? { background: '#0F8B6C' } : {}}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
              {!collapsed && <div className="mx-4 mt-1 mb-1 border-t" style={{ borderColor: 'hsl(220,14%,20%)' }} />}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-14 w-6 h-6 rounded-full flex items-center justify-center border z-10 transition-colors hover:bg-white/10"
          style={{ background: 'hsl(220,16%,14%)', borderColor: 'hsl(220,14%,28%)', color: '#9ca3af' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'hsl(220,14%,20%)', color: 'hsl(220,10%,40%)' }}>
            <div className="font-semibold" style={{ color: '#9ca3af' }}>B2BYTES</div>
            <div>Enterprise as a Service</div>
            <div className="mt-0.5" style={{ color: 'hsl(220,10%,30%)' }}>v1.0 • Peyu Chile SPA</div>
          </div>
        )}
      </aside>

      {/* Main content — full scroll */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
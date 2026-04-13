import { Link, useLocation, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Users, BarChart3, Megaphone, Turtle, Package,
  Calculator, MessageSquare, TrendingUp, Store, UserCheck, Truck,
  HardHat, Flag, Archive, ShoppingCart, Settings as SettingsIcon, ChevronLeft, ChevronRight, Leaf, ListChecks, Sparkles, FileText, CalendarDays, PieChart, AlertTriangle, Building2
} from "lucide-react";

const navGroups = [
  {
    label: "B2B Web",
    items: [
      { path: "/admin/propuestas", label: "Pipeline B2B Leads", icon: Building2 },
    ]
  },
  {
    label: "Operaciones",
    items: [
      { path: "/admin/", label: "Centro de Comando", icon: LayoutDashboard },
      { path: "/admin/pipeline", label: "Pipeline B2B", icon: Users },
      { path: "/admin/cotizaciones", label: "Cotizaciones", icon: FileText },
      { path: "/admin/cpq", label: "CPQ Cotizador", icon: Calculator },
      { path: "/admin/soporte", label: "Soporte & WhatsApp", icon: MessageSquare },
    ]
  },
  {
    label: "Comercial",
    items: [
      { path: "/admin/ecommerce", label: "E-commerce", icon: ShoppingCart },
      { path: "/admin/tiendas", label: "Tiendas Físicas", icon: Store },
      { path: "/admin/clientes", label: "Clientes / LTV", icon: UserCheck },
      { path: "/admin/catalogo", label: "Catálogo SKUs", icon: Package },
    ]
  },
  {
    label: "Producción",
    items: [
      { path: "/admin/operaciones", label: "Operaciones", icon: SettingsIcon },
      { path: "/admin/trazabilidad", label: "Trazabilidad", icon: HardHat },
      { path: "/admin/inventario", label: "Inventario", icon: Archive },
      { path: "/admin/proveedores", label: "Proveedores", icon: Truck },
      { path: "/admin/compras", label: "Compras & Supply", icon: ShoppingCart },
      { path: "/admin/esg", label: "Sostenibilidad ESG", icon: Leaf },
    ]
  },
  {
    label: "Estrategia",
    items: [
      { path: "/admin/financiero", label: "Financiero", icon: TrendingUp },
      { path: "/admin/flujo-caja", label: "Flujo de Caja", icon: Store },
      { path: "/admin/marketing", label: "Marketing", icon: Megaphone },
      { path: "/admin/analitica", label: "Analítica", icon: BarChart3 },
      { path: "/admin/equipo", label: "Equipo / RRHH", icon: HardHat },
      { path: "/admin/okrs", label: "OKRs & Metas", icon: Flag },
      { path: "/admin/calendario", label: "Agenda Comercial", icon: CalendarDays },
      { path: "/admin/plan", label: "Plan de Acción", icon: ListChecks },
      { path: "/admin/ia", label: "Asistente IA", icon: Sparkles },
      { path: "/admin/reportes", label: "Reportes & Análisis", icon: PieChart },
      { path: "/admin/configuracion", label: "Configuración", icon: SettingsIcon },
      { path: "/admin/alertas", label: "Centro de Alertas", icon: AlertTriangle },
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
        className="flex-shrink-0 flex flex-col transition-all duration-300 relative border-r border-white/10"
        style={{ background: 'linear-gradient(180deg, hsl(220,20%,12%) 0%, hsl(220,18%,10%) 100%)', width: collapsed ? 64 : 220 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
            <Turtle className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-poppins font-bold text-white text-base leading-none">PEYU</div>
              <div className="text-xs mt-0.5 truncate text-teal-300">Centro de Comando</div>
            </div>
          )}
        </div>

        {/* Navigation — scrollable */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(220,14%,25%) transparent' }}>
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-teal-300/70">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium touch-target ${
                      isActive
                        ? "text-white bg-gradient-to-r from-teal-600/40 to-cyan-600/40 border border-teal-400/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
              {!collapsed && <div className="mx-2 mt-1 mb-1 border-t border-white/10" />}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-14 w-6 h-6 rounded-full flex items-center justify-center border z-10 transition-all hover:bg-teal-500/20 hover:border-teal-400 active:scale-95"
          style={{ background: 'hsl(220,16%,14%)', borderColor: 'hsl(220,14%,28%)', color: '#9ca3af' }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Accesos tienda pública */}
        {!collapsed && (
          <div className="px-3 py-2 border-t border-white/10">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2 text-teal-300/70">Tienda Pública</div>
            <a href="/" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all touch-target">
              <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Tienda B2C</span>
            </a>
            <a href="/b2b/catalogo" target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-teal-300 hover:bg-teal-500/10 transition-all touch-target">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Catálogo B2B</span>
            </a>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-500">
            <div className="font-semibold text-gray-400">B2BYTES</div>
            <div>Enterprise as a Service</div>
            <div className="mt-0.5 text-gray-600">v1.0 • Peyu Chile SPA</div>
          </div>
        )}
      </aside>

      {/* Main content — full scroll */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <Outlet />
      </main>
    </div>
  );
}
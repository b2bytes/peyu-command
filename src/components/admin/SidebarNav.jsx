// ============================================================================
// SidebarNav · Navegación del panel admin PEYU
// ----------------------------------------------------------------------------
// Componente focal de la navegación: grupos colapsables, tooltips cuando está
// el sidebar cerrado, iconos semánticos consistentes, orden por frecuencia
// de uso real (lo más usado arriba).
// ============================================================================
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart3, Megaphone, Package, ShoppingCart, Store,
  UserCheck, Truck, Boxes, Flag, ListChecks, FileText, Calculator, MessageSquare,
  CalendarDays, PieChart, Settings, AlertTriangle, Building2, ClipboardList, Zap,
  Radar, Crosshair, Map as MapIcon, Sparkles, Leaf, Banknote, TrendingUp,
  ChevronDown, Cpu, Wand2, Globe, Wallet, Factory, Receipt, BookOpen, Brain,
} from 'lucide-react';

// ─── Estructura de navegación reorganizada por frecuencia de uso ─────────────
// El primer grupo "Hoy" está siempre abierto. Los demás se pueden colapsar.
export const NAV_GROUPS = [
  {
    key: 'hoy',
    label: 'Hoy',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { path: '/admin/',              label: 'Centro de Comando',  icon: LayoutDashboard },
      { path: '/admin/alertas',       label: 'Alertas',            icon: AlertTriangle },
      { path: '/admin/calendario',    label: 'Agenda',             icon: CalendarDays },
      { path: '/admin/plan',          label: 'Plan de Acción',     icon: ListChecks },
    ],
  },
  {
    key: 'ventas',
    label: 'Ventas & Pipeline',
    icon: TrendingUp,
    defaultOpen: true,
    items: [
      { path: '/admin/propuestas',    label: 'Propuestas B2B',     icon: FileText },
      { path: '/admin/pipeline',      label: 'Pipeline B2B',       icon: Users },
      { path: '/admin/cotizaciones',  label: 'Cotizaciones',       icon: Receipt },
      { path: '/admin/cpq',           label: 'CPQ Cotizador',      icon: Calculator },
      { path: '/admin/embudo',        label: 'Embudo Conversión',  icon: TrendingUp },
      { path: '/admin/soporte',       label: 'Soporte WhatsApp',   icon: MessageSquare },
    ],
  },
  {
    key: 'comercial',
    label: 'Comercial',
    icon: ShoppingCart,
    defaultOpen: false,
    items: [
      { path: '/admin/ecommerce',     label: 'E-commerce',         icon: ShoppingCart },
      { path: '/admin/clientes',      label: 'Clientes & LTV',     icon: UserCheck },
      { path: '/admin/cliente-360',   label: 'Cliente 360°',       icon: UserCheck },
      { path: '/admin/tiendas',       label: 'Tiendas Físicas',    icon: Store },
      { path: '/admin/catalogo',      label: 'Catálogo SKUs',      icon: Package },
      { path: '/admin/admin-products',label: 'Mejora Productos IA',icon: Wand2 },
      { path: '/admin/importar-clientes', label: 'Importar Clientes', icon: Users },
    ],
  },
  {
    key: 'produccion',
    label: 'Producción & Supply',
    icon: Factory,
    defaultOpen: false,
    items: [
      { path: '/admin/operaciones',   label: 'Operaciones',        icon: Factory },
      { path: '/admin/procesar-pedidos', label: 'Procesar Pedidos',icon: ClipboardList },
      { path: '/admin/trazabilidad',  label: 'Trazabilidad',       icon: Boxes },
      { path: '/admin/inventario',    label: 'Inventario',         icon: Boxes },
      { path: '/admin/proveedores',   label: 'Proveedores',        icon: Truck },
      { path: '/admin/tarifas-envio', label: 'Tarifas Bluex',      icon: Truck },
      { path: '/admin/compras',       label: 'Compras & Supply',   icon: ShoppingCart },
      { path: '/admin/esg',           label: 'Sostenibilidad ESG', icon: Leaf },
    ],
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    icon: Banknote,
    defaultOpen: false,
    items: [
      { path: '/admin/financiero',    label: 'Financiero',         icon: Banknote },
      { path: '/admin/flujo-caja',    label: 'Flujo de Caja',      icon: Wallet },
      { path: '/admin/reportes',      label: 'Reportes',           icon: PieChart },
      { path: '/admin/analitica',     label: 'Analítica',          icon: BarChart3 },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & Growth',
    icon: Megaphone,
    defaultOpen: false,
    items: [
      { path: '/admin/marketing',     label: 'Marketing',          icon: Megaphone },
      { path: '/admin/marketing-hub', label: 'Marketing Hub IA',   icon: Sparkles },
      { path: '/admin/backlinks',     label: 'Backlinks SEO',      icon: Globe },
      { path: '/admin/indexacion',    label: 'Indexación',         icon: Radar },
      { path: '/admin/ads-command',   label: 'Ads Command',        icon: Crosshair },
      { path: '/admin/ga-realtime',   label: 'GA4 Realtime',       icon: BarChart3 },
      { path: '/admin/launch-map',    label: 'Launch Map',         icon: MapIcon },
    ],
  },
  {
    key: 'estrategia',
    label: 'Estrategia & Equipo',
    icon: Flag,
    defaultOpen: false,
    items: [
      { path: '/admin/okrs',          label: 'OKRs & Metas',       icon: Flag },
      { path: '/admin/equipo',        label: 'Equipo / RRHH',      icon: Users },
      { path: '/admin/estado-actual', label: 'Estado General',     icon: ClipboardList },
    ],
  },
  {
    key: 'ia',
    label: 'IA & Brain',
    icon: Brain,
    defaultOpen: false,
    items: [
      { path: '/admin/ia',            label: 'Asistente IA',       icon: Sparkles },
      { path: '/admin/brain',         label: 'Pinecone Brain',     icon: Brain },
    ],
  },
  {
    key: 'integraciones',
    label: 'Integraciones',
    icon: Cpu,
    defaultOpen: false,
    items: [
      { path: '/admin/google',        label: 'Google Workspace',   icon: Cpu },
      { path: '/admin/woocommerce',   label: 'WooCommerce',        icon: Zap },
      { path: '/admin/configuracion', label: 'Configuración',      icon: Settings },
    ],
  },
];

const STORAGE_KEY = 'peyu_sidebar_open_groups';

export default function SidebarNav({ collapsed }) {
  const location = useLocation();

  // Estado persistente: qué grupos están abiertos
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(NAV_GROUPS.map(g => [g.key, g.defaultOpen]));
  });

  // Auto-abrir el grupo que contiene la ruta activa
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find(g => g.items.some(i => i.path === location.pathname));
    if (activeGroup && !openGroups[activeGroup.key]) {
      setOpenGroups(prev => ({ ...prev, [activeGroup.key]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups)); } catch {}
  }, [openGroups]);

  const toggleGroup = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 peyu-scrollbar-light">
      {NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = openGroups[group.key];
        const hasActive = group.items.some(i => i.path === location.pathname);

        return (
          <div key={group.key} className="mb-1">
            {/* Header del grupo */}
            {collapsed ? (
              // Modo colapsado: ícono del grupo como divisor visual
              <div className="flex items-center justify-center py-1.5 mb-0.5 mt-2">
                <div className={`h-px w-6 ${hasActive ? 'bg-teal-400/40' : 'bg-white/8'}`} />
              </div>
            ) : (
              <button
                onClick={() => toggleGroup(group.key)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-jakarta font-bold uppercase tracking-[0.08em] transition-colors ${
                  hasActive ? 'text-teal-300' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <GroupIcon className="w-3 h-3" />
                  {group.label}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            )}

            {/* Items */}
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                collapsed || isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-lg transition-all duration-150 text-[13px] font-inter font-medium ${
                        isActive
                          ? 'text-white bg-gradient-to-r from-teal-500/25 to-cyan-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      {/* Indicador de activo (barrita izquierda) */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-gradient-to-b from-teal-400 to-cyan-400" />
                      )}
                      <Icon className={`w-[16px] h-[16px] flex-shrink-0 ${isActive ? 'text-teal-300' : ''}`} strokeWidth={isActive ? 2.2 : 1.8} />
                      {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}

                      {/* Tooltip cuando está colapsado */}
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
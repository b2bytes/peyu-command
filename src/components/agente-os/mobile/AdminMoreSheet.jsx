import { Link } from 'react-router-dom';
import { X, Home, Megaphone, Boxes, Users, Truck, FileText, BarChart3,
  Building2, Image as ImageIcon, Search, DollarSign, MessageSquare, Sparkles,
  GitBranch, Package, ShoppingCart } from 'lucide-react';

// ── Sheet "Más" (móvil) ─────────────────────────────────────────────────────
// Overlay con TODOS los módulos del centro de mando en grilla táctil grande,
// estilo app 2027. Se abre desde el tab "Más" del bottom bar.
const GRUPOS = [
  {
    titulo: 'Inicio',
    items: [
      { to: '/admin/movil', label: 'Home App', icon: Home, color: 'from-teal-500 to-emerald-600' },
      { to: '/admin/agente', label: 'Agente', icon: MessageSquare, color: 'from-emerald-500 to-teal-600' },
      { to: '/admin', label: 'Dashboard', icon: BarChart3, color: 'from-slate-500 to-slate-700' },
    ],
  },
  {
    titulo: 'Ventas y pedidos',
    items: [
      { to: '/admin/procesar-pedidos', label: 'Procesar pedidos', icon: Truck, color: 'from-blue-500 to-indigo-600' },
      { to: '/admin/operaciones', label: 'Pedidos', icon: Package, color: 'from-sky-500 to-blue-600' },
      { to: '/admin/pipeline', label: 'Pipeline B2B', icon: GitBranch, color: 'from-violet-500 to-purple-600' },
      { to: '/admin/cotizaciones', label: 'Cotizaciones', icon: FileText, color: 'from-amber-500 to-orange-600' },
      { to: '/admin/clientes', label: 'Clientes', icon: Users, color: 'from-pink-500 to-rose-600' },
    ],
  },
  {
    titulo: 'Marketing',
    items: [
      { to: '/admin/social-studio', label: 'Social Studio', icon: Sparkles, color: 'from-fuchsia-500 to-pink-600' },
      { to: '/admin/marketing-hub', label: 'Marketing', icon: Megaphone, color: 'from-orange-500 to-red-600' },
      { to: '/admin/seo-keywords', label: 'SEO', icon: Search, color: 'from-cyan-500 to-teal-600' },
      { to: '/admin/imagenes', label: 'Imágenes', icon: ImageIcon, color: 'from-purple-500 to-violet-600' },
    ],
  },
  {
    titulo: 'Catálogo y negocio',
    items: [
      { to: '/admin/catalogo', label: 'Catálogo', icon: Boxes, color: 'from-green-500 to-emerald-600' },
      { to: '/admin/inventario', label: 'Inventario', icon: ShoppingCart, color: 'from-lime-500 to-green-600' },
      { to: '/admin/financiero', label: 'Financiero', icon: DollarSign, color: 'from-emerald-500 to-green-700' },
      { to: '/admin/proveedores', label: 'Proveedores', icon: Building2, color: 'from-stone-500 to-stone-700' },
    ],
  },
];

export default function AdminMoreSheet({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute left-0 right-0 bottom-0 ld-canvas border-t border-ld-border rounded-t-3xl shadow-2xl max-h-[88vh] overflow-y-auto peyu-scrollbar animate-in slide-in-from-bottom duration-250"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Handle + cerrar */}
        <div className="sticky top-0 ld-glass-strong z-10 flex items-center justify-between px-5 pt-3 pb-3 border-b border-ld-border rounded-t-3xl">
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-ld-border-strong" />
          <h2 className="font-bold text-ld-fg text-base mt-1">Todos los módulos</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {GRUPOS.map((g) => (
            <div key={g.titulo}>
              <p className="text-[11px] font-bold text-ld-fg-subtle uppercase tracking-wider px-1 mb-2">{g.titulo}</p>
              <div className="grid grid-cols-3 gap-2.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={onClose}
                      className="ld-card rounded-2xl p-3 flex flex-col items-center gap-2 text-center active:scale-95 transition-transform"
                    >
                      <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${it.color} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                      </span>
                      <span className="text-[11px] font-semibold text-ld-fg-soft leading-tight">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-ld-fg-subtle italic pb-2">Hasta que el plástico deje de ser basura</p>
      </div>
    </div>
  );
}
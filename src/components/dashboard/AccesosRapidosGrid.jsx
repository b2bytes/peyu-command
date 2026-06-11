import { Link } from 'react-router-dom';
import {
  ShoppingBag, Truck, Tag, Factory, Users, Package,
  Megaphone, BarChart2, GraduationCap, Bot, ArrowRight,
} from 'lucide-react';

// ── Accesos rápidos del Dashboard: las 10 páginas que más se usan,
//    en una grilla compacta y clickeable. ──
const LINKS = [
  { to: '/admin/procesar-pedidos', icon: ShoppingBag, label: 'Procesar Pedidos', desc: 'Pagos, estados, detalle' },
  { to: '/admin/despacho', icon: Tag, label: 'Despacho Rápido', desc: 'Etiquetas BlueExpress' },
  { to: '/admin/bluex', icon: Truck, label: 'Centro Logístico', desc: 'Tracking de envíos' },
  { to: '/admin/pipeline', icon: Users, label: 'Pipeline B2B', desc: 'Leads y propuestas' },
  { to: '/admin/operaciones', icon: Factory, label: 'Producción', desc: 'Trabajos láser' },
  { to: '/admin/catalogo', icon: Package, label: 'Catálogo', desc: 'Productos y stock' },
  { to: '/admin/social-studio', icon: Megaphone, label: 'Social Studio', desc: 'Marketing y redes' },
  { to: '/admin/analitica', icon: BarChart2, label: 'Analítica', desc: 'Métricas y embudo' },
  { to: '/admin/agente', icon: Bot, label: 'Agent OS', desc: 'Centro de comandos IA' },
  { to: '/admin/guia-fundadores', icon: GraduationCap, label: 'Guía Fundadores', desc: 'Paso a paso del sistema' },
];

export default function AccesosRapidosGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {LINKS.map(({ to, icon: Icon, label, desc }) => (
        <Link
          key={to}
          to={to}
          className="ld-card p-3.5 group flex flex-col gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--ld-grad-action)' }}>
              <Icon className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-ld-fg-subtle group-hover:translate-x-0.5 group-hover:text-ld-action transition-all" />
          </div>
          <div>
            <p className="font-bold text-sm text-ld-fg leading-tight">{label}</p>
            <p className="text-[11px] text-ld-fg-muted mt-0.5">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
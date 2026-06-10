import { Zap, Truck, Package, CreditCard, TrendingUp, ShoppingCart, BarChart3, Users, CheckCircle2 } from 'lucide-react';

const LinkCard = ({ href, icon: Icon, color, titulo, sub }) => (
  <a href={href} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors group">
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs sm:text-sm font-bold text-slate-50">{titulo}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
    <span className="text-slate-500">→</span>
  </a>
);

/** AccesosRapidos — Bloque oscuro de navegación a los módulos clave del admin. */
export default function AccesosRapidos() {
  return (
    <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
        <h2 className="text-slate-50 font-bold text-sm sm:text-base flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" /> Accesos Rápidos al Sistema
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">Navega por las funcionalidades clave de operaciones y ventas</p>
      </div>
      <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h3 className="text-slate-50 font-bold text-sm mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-400" /> Envío · Despacho
          </h3>
          <div className="space-y-2">
            <LinkCard href="/admin/bluex" icon={Package} color="bg-blue-500/20 text-blue-400" titulo="Centro Logístico" sub="Dashboard Bluex, tracking, KPIs" />
            <LinkCard href="/admin/procesar-pedidos" icon={CreditCard} color="bg-cyan-500/20 text-cyan-400" titulo="Procesar Pedidos" sub="Kanban, etiquetas, tracking" />
            <LinkCard href="/admin/despacho" icon={Zap} color="bg-amber-500/20 text-amber-400" titulo="Despacho Rápido" sub="Genera etiqueta, imprime" />
          </div>
        </div>
        <div>
          <h3 className="text-slate-50 font-bold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" /> Pipeline de Ventas
          </h3>
          <div className="space-y-2">
            <LinkCard href="/admin/pipeline" icon={Truck} color="bg-purple-500/20 text-purple-400" titulo="Pipeline B2B" sub="Leads, propuestas, Kanban" />
            <LinkCard href="/admin/pipeline-b2c" icon={ShoppingCart} color="bg-pink-500/20 text-pink-400" titulo="Pipeline B2C" sub="Carritos, conversiones, RFM" />
            <LinkCard href="/admin/embudo" icon={TrendingUp} color="bg-indigo-500/20 text-indigo-400" titulo="Embudo Ventas" sub="Funnels, segmentación" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <h3 className="text-slate-50 font-bold text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Análisis · Operaciones
          </h3>
          <div className="grid sm:grid-cols-3 gap-2">
            <LinkCard href="/admin/operaciones" icon={Truck} color="bg-slate-600/50 text-slate-400" titulo="Operaciones" sub="Control general" />
            <LinkCard href="/admin/analitica" icon={BarChart3} color="bg-slate-600/50 text-slate-400" titulo="Analítica" sub="Métricas y datos" />
            <LinkCard href="/admin/clientes" icon={Users} color="bg-slate-600/50 text-slate-400" titulo="Clientes" sub="Base datos CRM" />
          </div>
        </div>
      </div>
    </section>
  );
}
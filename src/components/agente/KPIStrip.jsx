// KPIStrip · Tira de KPIs del Centro de Comando. Glass premium sobre fondo
// oscuro fijo. Cada card tiene acento de color legible y micro-animación.
import { Users, FileText, Package, Target, DollarSign, Percent } from 'lucide-react';

const fmtCLP = (n) => n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—';
const fmtNum = (n) => n != null ? Number(n).toLocaleString('es-CL') : '0';

const ACCENTS = {
  teal:   { ring: 'ring-teal-400/20',   glow: 'bg-teal-500/10',   icon: 'text-teal-300',   val: 'text-teal-50' },
  purple: { ring: 'ring-violet-400/20', glow: 'bg-violet-500/10', icon: 'text-violet-300', val: 'text-violet-50' },
  blue:   { ring: 'ring-sky-400/20',    glow: 'bg-sky-500/10',    icon: 'text-sky-300',    val: 'text-sky-50' },
  amber:  { ring: 'ring-amber-400/25',  glow: 'bg-amber-500/12',  icon: 'text-amber-300',  val: 'text-amber-50' },
  green:  { ring: 'ring-emerald-400/20',glow: 'bg-emerald-500/10',icon: 'text-emerald-300',val: 'text-emerald-50' },
};

function KPICard({ label, value, sub, icon: Icon, color = 'teal', loading }) {
  const a = ACCENTS[color] || ACCENTS.teal;
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 ring-1 ${a.ring} p-3.5 sm:p-4 flex flex-col gap-1 min-w-0 backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:-translate-y-0.5`}>
      <div className={`pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl ${a.glow}`} />
      <div className="relative flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] text-white/45 font-bold uppercase tracking-wider truncate">{label}</span>
        {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${a.icon}`} />}
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-white/10 rounded animate-pulse mt-1" />
      ) : (
        <span className={`relative text-xl sm:text-2xl font-extrabold leading-none ${a.val} tabular-nums`}>{value}</span>
      )}
      {sub && <span className="relative text-[10px] sm:text-xs text-white/35 truncate capitalize">{sub}</span>}
    </div>
  );
}

export default function KPIStrip({ k, loading }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3 px-4 sm:px-6 py-4">
      <KPICard label="Pipeline B2B" value={fmtNum(k.leadsActivos)} sub="leads activos" icon={Users} color="teal" loading={loading} />
      <KPICard label="Cotizaciones" value={fmtNum(k.cotAbiertas)} sub="enviadas abiertas" icon={FileText} color="purple" loading={loading} />
      <KPICard label="Pedidos" value={fmtNum(k.pedidosEnCurso)} sub="en curso" icon={Package} color="blue" loading={loading} />
      <KPICard label="Leads nuevos" value={fmtNum(k.leadsNuevos)} sub="sin contactar" icon={Target} color={k.leadsNuevos > 0 ? 'amber' : 'green'} loading={loading} />
      <KPICard label="Ventas mes" value={fmtCLP(k.ventasMes)} sub={new Date().toLocaleString('es-CL', { month: 'long' })} icon={DollarSign} color="green" loading={loading} />
      <KPICard label="Tasa cierre" value={`${k.tasaCierre}%`} sub="B2B histórico" icon={Percent} color="teal" loading={loading} />
    </div>
  );
}
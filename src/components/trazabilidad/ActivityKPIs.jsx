// KPIs agregados del log de actividad
import { Users, ShoppingCart, FileText, DollarSign, Eye, Activity } from 'lucide-react';

function Kpi({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black font-poppins text-white leading-none">{value}</p>
      <p className="text-[11px] text-white/50 uppercase tracking-wide mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ActivityKPIs({ logs = [] }) {
  const sessions = new Set(logs.map((l) => l.session_id).filter(Boolean)).size;
  const knownUsers = new Set(logs.map((l) => l.user_email).filter(Boolean)).size;
  const productViews = logs.filter((l) => l.event_type === 'product_view').length;
  const addsToCart = logs.filter((l) => l.event_type === 'add_to_cart').length;
  const checkouts = logs.filter((l) => l.event_type === 'checkout_complete').length;
  const b2bForms = logs.filter((l) => l.event_type === 'b2b_form_submit').length;
  const totalGMV = logs
    .filter((l) => l.event_type === 'checkout_complete')
    .reduce((s, l) => s + (l.value_clp || 0), 0);

  const fmt = (n) => n.toLocaleString('es-CL');
  const fmtClp = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <Kpi icon={Activity} label="Eventos" value={fmt(logs.length)} color="bg-slate-500" />
      <Kpi icon={Users} label="Sesiones" value={fmt(sessions)} color="bg-blue-500" sub={`${knownUsers} identificadas`} />
      <Kpi icon={Eye} label="Product views" value={fmt(productViews)} color="bg-cyan-500" />
      <Kpi icon={ShoppingCart} label="Add to cart" value={fmt(addsToCart)} color="bg-amber-500" sub={productViews > 0 ? `${((addsToCart/productViews)*100).toFixed(0)}% conv.` : ''} />
      <Kpi icon={DollarSign} label="GMV B2C" value={fmtClp(totalGMV)} color="bg-emerald-500" sub={`${checkouts} pedidos`} />
      <Kpi icon={FileText} label="Forms B2B" value={fmt(b2bForms)} color="bg-violet-500" />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Inbox, AlertTriangle, Flame, FileText, Truck, Package,
  Clock, ArrowRight, CheckCircle2, MessageSquare,
} from 'lucide-react';

/**
 * ActionInbox · Bandeja unificada de acciones del día priorizadas.
 *
 * Reemplaza el ruido de tener leads / propuestas / pedidos / consultas
 * desperdigados en distintas tarjetas. Consolida TODO lo que requiere acción
 * humana hoy en una sola lista, ordenada por urgencia.
 *
 * Reglas de prioridad (de más urgente a menos):
 *  1. CRÍTICO   → propuestas vencidas, pedidos atrasados >5 días sin despachar
 *  2. ALTO      → leads B2B con score ≥70 sin contactar
 *  3. MEDIO     → propuestas enviadas hace 5+ días sin respuesta, pedidos en
 *                 producción listos para despachar
 *  4. NORMAL    → leads B2B nuevos, consultas sin responder
 */
const PRIORITY_STYLE = {
  critical: { dot: 'bg-red-400',     ring: 'ring-red-400/30',     label: 'text-red-300',     bg: 'bg-red-500/10' },
  high:     { dot: 'bg-orange-400',  ring: 'ring-orange-400/30',  label: 'text-orange-300',  bg: 'bg-orange-500/10' },
  medium:   { dot: 'bg-amber-400',   ring: 'ring-amber-400/30',   label: 'text-amber-300',   bg: 'bg-amber-500/10' },
  normal:   { dot: 'bg-cyan-400',    ring: 'ring-cyan-400/30',    label: 'text-cyan-300',    bg: 'bg-cyan-500/10' },
};

const daysSince = (d) => {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
};

export default function ActionInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    try {
      const [leads, propuestas, pedidos, consultas] = await Promise.all([
        base44.entities.B2BLead.list('-created_date', 50),
        base44.entities.CorporateProposal.list('-created_date', 50),
        base44.entities.PedidoWeb.list('-fecha', 100),
        base44.entities.Consulta.list('-created_date', 50),
      ]);

      const list = [];

      // 1. Leads B2B con score ≥70 sin gestionar
      leads.forEach(l => {
        if (['Aceptado', 'Perdido'].includes(l.status)) return;
        const score = l.lead_score || 0;
        const isHot = score >= 70;
        const isNew = l.status === 'Nuevo';
        if (!isNew && !isHot) return;
        list.push({
          id: `lead-${l.id}`,
          type: 'lead',
          priority: isHot ? 'high' : 'normal',
          icon: Flame,
          title: l.company_name || 'Lead sin empresa',
          subtitle: `${l.contact_name || ''} · ${l.product_interest || 'Sin producto'}`,
          meta: isHot ? `🔥 ${score}pts · ${l.status}` : l.status,
          link: '/admin/pipeline',
          age: daysSince(l.created_date),
        });
      });

      // 2. Propuestas vencidas o esperando respuesta
      propuestas.forEach(p => {
        if (p.status !== 'Enviada') return;
        const enviadaHace = daysSince(p.fecha_envio || p.created_date);
        const vencida = p.fecha_vencimiento && new Date(p.fecha_vencimiento) < new Date();
        if (vencida) {
          list.push({
            id: `prop-v-${p.id}`,
            type: 'proposal',
            priority: 'critical',
            icon: AlertTriangle,
            title: `${p.empresa} · Propuesta vencida`,
            subtitle: `${p.numero || p.id.slice(0, 8)} · $${(p.total || 0).toLocaleString('es-CL')}`,
            meta: `Venció hace ${daysSince(p.fecha_vencimiento)}d`,
            link: '/admin/propuestas',
            age: enviadaHace,
          });
        } else if (enviadaHace >= 5) {
          list.push({
            id: `prop-${p.id}`,
            type: 'proposal',
            priority: 'medium',
            icon: FileText,
            title: `${p.empresa} · Sin respuesta`,
            subtitle: `${p.numero || p.id.slice(0, 8)} · $${(p.total || 0).toLocaleString('es-CL')}`,
            meta: `Enviada hace ${enviadaHace}d`,
            link: '/admin/propuestas',
            age: enviadaHace,
          });
        }
      });

      // 3. Pedidos atrasados o listos para despacho
      pedidos.forEach(p => {
        const dias = daysSince(p.created_date);
        if (p.estado === 'Listo para Despacho') {
          list.push({
            id: `ped-r-${p.id}`,
            type: 'order',
            priority: 'medium',
            icon: Truck,
            title: `${p.numero_pedido || p.id.slice(0, 8)} · Listo para despacho`,
            subtitle: `${p.cliente_nombre} · $${(p.total || 0).toLocaleString('es-CL')}`,
            meta: 'Generar etiqueta Bluex',
            link: '/admin/procesar-pedidos',
            age: dias,
          });
        } else if (['Nuevo', 'Confirmado'].includes(p.estado) && dias >= 5) {
          list.push({
            id: `ped-${p.id}`,
            type: 'order',
            priority: 'critical',
            icon: AlertTriangle,
            title: `${p.numero_pedido || p.id.slice(0, 8)} · Atrasado`,
            subtitle: `${p.cliente_nombre} · ${p.estado}`,
            meta: `${dias}d sin avanzar`,
            link: '/admin/procesar-pedidos',
            age: dias,
          });
        } else if (p.estado === 'Nuevo' && dias < 5) {
          list.push({
            id: `ped-n-${p.id}`,
            type: 'order',
            priority: 'normal',
            icon: Package,
            title: `${p.numero_pedido || p.id.slice(0, 8)} · Nuevo`,
            subtitle: `${p.cliente_nombre} · $${(p.total || 0).toLocaleString('es-CL')}`,
            meta: 'Confirmar pago',
            link: '/admin/procesar-pedidos',
            age: dias,
          });
        }
      });

      // 4. Consultas sin responder
      consultas.forEach(c => {
        if (c.estado !== 'Sin responder') return;
        const dias = daysSince(c.created_date);
        list.push({
          id: `cons-${c.id}`,
          type: 'consulta',
          priority: dias >= 1 ? 'high' : 'normal',
          icon: MessageSquare,
          title: c.nombre || 'Consulta',
          subtitle: `${c.tipo || 'General'} · ${c.canal}`,
          meta: dias > 0 ? `Hace ${dias}d` : 'Hoy',
          link: '/admin/soporte',
          age: dias,
        });
      });

      // Ordenar: priority crítico→normal, luego edad descendente
      const order = { critical: 0, high: 1, medium: 2, normal: 3 };
      list.sort((a, b) => (order[a.priority] - order[b.priority]) || (b.age - a.age));

      setItems(list);
      setLoading(false);
    } catch (e) {
      console.warn('ActionInbox load error:', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 1600); // stagger: evita pico de requests al montar
    const id = setInterval(load, 90_000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.priority === filter);
  const counts = {
    all: items.length,
    critical: items.filter(i => i.priority === 'critical').length,
    high: items.filter(i => i.priority === 'high').length,
    medium: items.filter(i => i.priority === 'medium').length,
    normal: items.filter(i => i.priority === 'normal').length,
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Inbox className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-poppins font-semibold text-white text-sm">Bandeja del día</h3>
            <p className="text-[10px] text-orange-200/70">{counts.all} acciones priorizadas</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          {[
            { key: 'all', label: 'Todo', count: counts.all },
            { key: 'critical', label: 'Crítico', count: counts.critical },
            { key: 'high', label: 'Alto', count: counts.high },
            { key: 'medium', label: 'Medio', count: counts.medium },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2 py-1 rounded-full font-medium transition ${
                filter === f.key
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {f.label} {f.count > 0 && <span className="ml-0.5 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 peyu-scrollbar-light">
        {loading && (
          <div className="text-center py-8 text-white/40 text-xs">Cargando bandeja...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400/60" />
            <p className="text-sm text-white/70 font-medium">¡Todo al día!</p>
            <p className="text-xs text-white/40 mt-1">No hay acciones pendientes.</p>
          </div>
        )}

        {!loading && filtered.map(it => {
          const Icon = it.icon;
          const style = PRIORITY_STYLE[it.priority];
          return (
            <Link
              key={it.id}
              to={it.link}
              className={`flex items-center gap-3 p-2.5 rounded-xl ${style.bg} hover:bg-white/10 transition border border-white/5 group`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
              <Icon className={`w-4 h-4 ${style.label} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-white truncate">{it.title}</p>
                  <span className={`text-[9px] font-medium uppercase tracking-wide ${style.label} shrink-0`}>
                    {it.priority === 'critical' ? 'Crítico' : it.priority === 'high' ? 'Alto' : it.priority === 'medium' ? 'Medio' : 'Normal'}
                  </span>
                </div>
                <p className="text-[10px] text-white/50 truncate">{it.subtitle}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/40">
                  <Clock className="w-2.5 h-2.5" />
                  {it.meta}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
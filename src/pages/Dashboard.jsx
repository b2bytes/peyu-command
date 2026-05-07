import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, TrendingDown, Users, Package, DollarSign,
  MessageSquare, Factory, AlertTriangle, CheckCircle2,
  Clock, Target, Zap, ArrowRight,
  Store, UserCheck, Flag
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import RealtimeKPIs from "@/components/command-center/RealtimeKPIs";
import QuickActions from "@/components/command-center/QuickActions";
import BrainConsole from "@/components/command-center/BrainConsole";
import LiveConversations from "@/components/command-center/LiveConversations";

const COLORS = ['#14b8a6', '#06b6d4', '#0F8B6C', '#D96B4D', '#A7D9C9'];

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "#14b8a6", bg = "rgba(20,184,166,0.1)" }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20 hover:border-white/40 transition-all hover:bg-white/15">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-teal-300/80 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-poppins font-bold mt-1 text-white" style={{ color: 'white' }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-300/70 mt-1">{subtitle}</p>}
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center ml-3 flex-shrink-0 bg-gradient-to-br" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// Helpers para construir series temporales reales a partir de las entidades
function buildIngresosMensuales(pedidosWeb, proposals) {
  const meses = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-CL', { month: 'short' });
    const b2c = pedidosWeb
      .filter(p => p.fecha?.startsWith(key))
      .reduce((s, p) => s + (p.total || 0), 0);
    const b2b = proposals
      .filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(key))
      .reduce((s, p) => s + (p.total || 0), 0);
    meses.push({ mes: label.charAt(0).toUpperCase() + label.slice(1, 3), b2b: Math.round(b2b / 1000), b2c: Math.round(b2c / 1000) });
  }
  return meses;
}

function buildCanalMix(pedidosWeb, ventasTienda, proposals) {
  const web = pedidosWeb.reduce((s, p) => s + (p.total || 0), 0);
  const tiendas = ventasTienda.reduce((s, v) => s + (v.total || 0), 0);
  const b2b = proposals.filter(p => p.status === 'Aceptada').reduce((s, p) => s + (p.total || 0), 0);
  return [
    { name: 'Web B2C', value: Math.round(web / 1000) },
    { name: 'B2B Directo', value: Math.round(b2b / 1000) },
    { name: 'Tiendas Físicas', value: Math.round(tiendas / 1000) },
  ].filter(x => x.value > 0);
}

function buildKpiSemanal(b2bLeads, proposals, pedidosWeb) {
  const semanas = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const inRange = (d) => {
      if (!d) return false;
      const t = new Date(d).getTime();
      return t >= start.getTime() && t < end.getTime();
    };
    semanas.push({
      sem: `S${4 - i}`,
      leads: b2bLeads.filter(l => inRange(l.created_date)).length,
      cotizaciones: proposals.filter(p => inRange(p.created_date)).length,
      pedidos: pedidosWeb.filter(p => inRange(p.created_date)).length,
    });
  }
  return semanas;
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [b2bLeads, setB2bLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [pedidosWeb, setPedidosWeb] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.Cotizacion.list('-created_date', 100),
      base44.entities.OrdenProduccion.list('-created_date', 100),
      base44.entities.OKR.list('-created_date', 50),
      base44.entities.Cliente.list('-created_date', 100),
      base44.entities.VentaTienda.list('-created_date', 200),
      base44.entities.Colaborador.list('-created_date', 50),
      base44.entities.MovimientoCaja.list('-fecha', 200),
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 100),
      base44.entities.PedidoWeb.list('-fecha', 300),
    ]).then(([l, c, o, ok, cl, vt, col, mov, bl, props, pw]) => {
      setLeads(l);
      setCotizaciones(c);
      setOrdenes(o);
      setOkrs(ok);
      setClientes(cl);
      setVentas(vt);
      setColaboradores(col);
      setMovimientos(mov);
      setB2bLeads(bl);
      setProposals(props);
      setPedidosWeb(pw);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const leadsActivos = leads.filter(l => !['Ganado','Perdido'].includes(l.estado)).length;
  const leadsCalientes = leads.filter(l => l.calidad_lead === 'Caliente').length;
  const cotEnviadas = cotizaciones.filter(c => c.estado === 'Enviada').length;
  const cotAceptadas = cotizaciones.filter(c => c.estado === 'Aceptada').length;
  const ordenesActivas = ordenes.filter(o => !['Despachado'].includes(o.estado)).length;
  const ordenesUrgentes = ordenes.filter(o => o.prioridad === 'Alta (urgente)').length;

  // Tiendas
  const ventasHoy = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0]);
  const totalVentasHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const totalVentasMes = ventas.reduce((s, v) => s + (v.total || 0), 0);

  // Clientes
  const clientesVIP = clientes.filter(c => c.estado === 'VIP').length;
  const clientesEnRiesgo = clientes.filter(c => c.estado === 'En Riesgo').length;
  const totalLTV = clientes.reduce((s, c) => s + (c.total_compras_clp || 0), 0);

  // Equipo
  const equipoActivo = colaboradores.filter(c => c.estado === 'Activo').length;
  const inyectorasUsadas = [...new Set(ordenes.filter(o => o.inyectora && o.inyectora !== 'Sin asignar' && o.estado !== 'Despachado').map(o => o.inyectora))].length;

  // OKRs
  const getPct = (o) => {
    if (!o.valor_meta || o.valor_meta === o.valor_inicial) return 0;
    const dir = o.valor_meta > o.valor_inicial ? 1 : -1;
    const range = Math.abs(o.valor_meta - o.valor_inicial);
    const progress = dir * ((o.valor_actual || 0) - (o.valor_inicial || 0));
    return Math.min(100, Math.max(0, Math.round(progress / range * 100)));
  };
  const avgOKR = okrs.length > 0 ? Math.round(okrs.reduce((s, o) => s + getPct(o), 0) / okrs.length) : 0;
  const okrsEnRiesgo = okrs.filter(o => o.estado === 'En riesgo').length;
  const topOKRs = okrs.slice(0, 4);

  // Caja real del mes
  const mesActual = new Date().toISOString().slice(0, 7);
  const movMes = movimientos.filter(m => m.fecha?.startsWith(mesActual));
  const ingresosMes = movMes.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const egresosMes = movMes.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);
  const saldoCaja = ingresosMes - egresosMes;

  // B2B Web pipeline
  const b2bLeadsNuevos = b2bLeads.filter(l => l.status === 'Nuevo').length;
  const b2bLeadsCalientes = b2bLeads.filter(l => (l.lead_score || 0) >= 70).length;
  const propuestasPendientes = proposals.filter(p => p.status === 'Enviada').length;
  const propuestasAceptadas = proposals.filter(p => p.status === 'Aceptada').length;
  const pipelineB2BValue = proposals.filter(p => ['Borrador','Enviada'].includes(p.status)).reduce((s, p) => s + (p.total || 0), 0);

  // PedidoWeb reales
  const mesActualStr = new Date().toISOString().slice(0, 7);
  const pedidosWebMes = pedidosWeb.filter(p => p.fecha?.startsWith(mesActualStr));
  const ventasWebMes = pedidosWebMes.reduce((s, p) => s + (p.total || 0), 0);
  const pedidosWebPendientes = pedidosWeb.filter(p => p.estado === 'Nuevo').length;
  const pedidosWebEnProduccion = pedidosWeb.filter(p => p.estado === 'En Producción').length;

  // Blueprint funnel metrics — solo data real
  const totalLeadsB2B = b2bLeads.length;
  const propuestasAceptadasCount = proposals.filter(p => p.status === 'Aceptada').length;
  const tasaConversionReal = totalLeadsB2B > 0
    ? ((propuestasAceptadasCount / totalLeadsB2B) * 100).toFixed(1)
    : '0.0';
  // Pedidos B2B del mes actual = propuestas aceptadas en el mes
  const mesNow = new Date().toISOString().slice(0, 7);
  const pedidosB2BActuales = proposals.filter(
    p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(mesNow)
  ).length;
  // Ingresos B2B del mes (real, basado en propuestas aceptadas)
  const ingresosB2BMes = proposals
    .filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(mesNow))
    .reduce((s, p) => s + (p.total || 0), 0);

  // Series temporales calculadas en base a la data
  const ingresosMensuales = buildIngresosMensuales(pedidosWeb, proposals);
  const canalMix = buildCanalMix(pedidosWeb, ventas, proposals);
  const kpiSemanal = buildKpiSemanal(b2bLeads, proposals, pedidosWeb);

  const alerts = [
    b2bLeadsNuevos > 0 && { type: 'warning', msg: `${b2bLeadsNuevos} leads B2B web nuevos sin gestionar → Pipeline B2B` },
    b2bLeadsCalientes > 0 && { type: 'info', msg: `${b2bLeadsCalientes} leads web con score ≥70 pts listos para propuesta` },
    leadsCalientes > 0 && { type: 'warning', msg: `${leadsCalientes} leads calientes sin cotización enviada` },
    cotEnviadas > 0 && { type: 'info', msg: `${cotEnviadas} cotizaciones esperando respuesta del cliente` },
    ordenesUrgentes > 0 && { type: 'danger', msg: `${ordenesUrgentes} órdenes de producción urgentes` },
    clientesEnRiesgo > 0 && { type: 'danger', msg: `${clientesEnRiesgo} clientes en riesgo de churn — requieren recontacto` },
    okrsEnRiesgo > 0 && { type: 'warning', msg: `${okrsEnRiesgo} OKRs en riesgo — revisar iniciativas` },
    { type: 'success', msg: 'Tracking GA4 + Meta CAPI: Pendiente implementación' },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-poppins font-black text-white">Centro de Comandos</h1>
          <p className="text-teal-300/70 text-sm mt-1">KPIs en vivo · Acciones 1-click · Peyu Brain</p>
        </div>
      </div>

      {/* ── CENTRO DE COMANDOS — Bloque superior ──
          1) KPIs en tiempo real del día (auto-refresh 30s)
          2) Acciones rápidas (funciones backend 1-click) + Peyu Brain console */}
      <RealtimeKPIs />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <QuickActions />
        </div>
        <div>
          <BrainConsole />
        </div>
        <div>
          <LiveConversations />
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm border ${
              a.type === 'danger' ? 'bg-red-500/20 text-red-300 border-red-400/40' :
              a.type === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' :
              a.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
              'bg-blue-500/20 text-blue-300 border-blue-400/40'
            }`}>
              {a.type === 'danger' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> :
               a.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> :
               <Clock className="w-4 h-4 flex-shrink-0" />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* Blueprint KPIs Estratégicos */}
      <div className="rounded-2xl p-4 border-2 border-dashed" style={{ background: 'hsl(163,40%,96%)', borderColor: '#0F8B6C' }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: '#0F8B6C' }} />
          <span className="text-sm font-poppins font-semibold" style={{ color: '#0F8B6C' }}>Blueprint KPIs Estratégicos — 90 días (Q2 2026)</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Conversión Lead→Venta', actual: `${tasaConversionReal}%`, meta: '7.0%', ok: parseFloat(tasaConversionReal) >= 7 },
              { label: 'Pedidos B2B/mes', actual: pedidosB2BActuales, meta: '12→16', ok: pedidosB2BActuales >= 12 },
              { label: 'Saldo Caja Mes', actual: saldoCaja >= 0 ? `+$${(saldoCaja/1000).toFixed(0)}K` : `$${(saldoCaja/1000).toFixed(0)}K`, meta: 'Positivo', ok: saldoCaja >= 0 },
              { label: 'Ventas Tiendas Mes', actual: `$${(totalVentasMes/1000000).toFixed(1)}M`, meta: '$2M+/mes', ok: totalVentasMes >= 2000000 },
              { label: 'Utilización Planta', actual: `${Math.round((inyectorasUsadas/6)*100)}%`, meta: '≥70%', ok: inyectorasUsadas/6 >= 0.7 },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground leading-tight">{kpi.label}</p>
              <p className="font-poppins font-bold text-base mt-1" style={{ color: '#D96B4D' }}>{kpi.actual}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: '#0F8B6C' }}>Meta: {kpi.meta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 touch-target">
        <StatCard
          title="Ventas Web B2C (mes)"
          value={loading ? '...' : ventasWebMes > 0 ? `$${(ventasWebMes/1000000).toFixed(1)}M` : '$0'}
          subtitle={`${pedidosWebMes.length} pedidos · ${pedidosWebPendientes} nuevos`}
          icon={DollarSign}
          trend={ventasWebMes >= 6000000 ? 1 : -1}
          trendLabel={ventasWebMes >= 6000000 ? '✓ Sobre meta $6M' : `Meta: $6M+ CLP/mes`}
          color="#f97316"
          bg="rgba(249,115,22,0.1)"
        />
        <StatCard
          title="Ingresos B2B (mes)"
          value={loading ? '...' : ingresosB2BMes > 0 ? `$${(ingresosB2BMes/1000000).toFixed(1)}M` : '$0'}
          subtitle={`${pedidosB2BActuales} propuestas aceptadas`}
          icon={Target}
          trend={pedidosB2BActuales >= 12 ? 1 : -1}
          trendLabel={pedidosB2BActuales >= 12 ? '✓ Sobre meta 12/mes' : 'Meta: 12+/mes'}
          color="#14b8a6"
          bg="rgba(20,184,166,0.1)"
        />
        <StatCard
          title="Leads B2B Activos"
          value={loading ? '...' : b2bLeads.filter(l => !['Aceptado','Perdido'].includes(l.status)).length}
          subtitle={`${b2bLeadsCalientes} con score ≥70`}
          icon={Users}
          color="#14b8a6"
          bg="rgba(20,184,166,0.1)"
        />
        <StatCard
          title="Órdenes Producción"
          value={loading ? '...' : ordenesActivas}
          subtitle={`${ordenesUrgentes} urgentes`}
          icon={Factory}
          color={ordenesUrgentes > 0 ? "#f97316" : "#14b8a6"}
          bg={ordenesUrgentes > 0 ? "rgba(249,115,22,0.1)" : "rgba(20,184,166,0.1)"}
        />
      </div>

      {/* B2B Web Pipeline Row */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-xl hover:border-white/40 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-poppins font-semibold text-white">Pipeline B2B Web — Tiempo Real</h3>
            <p className="text-xs text-teal-300/70">Leads del formulario web + catálogo corporativo</p>
          </div>
          <Link to="/admin/propuestas" className="text-xs font-medium flex items-center gap-1 text-cyan-300 hover:text-cyan-200 transition-colors">
            Ver pipeline completo <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Leads nuevos', value: loading ? '...' : b2bLeadsNuevos, color: 'text-cyan-300', bg: 'bg-cyan-500/20', icon: Users },
            { label: 'Score ≥70 (calientes)', value: loading ? '...' : b2bLeadsCalientes, color: 'text-yellow-300', bg: 'bg-yellow-500/20', icon: Zap },
            { label: 'Propuestas enviadas', value: loading ? '...' : propuestasPendientes, color: 'text-purple-300', bg: 'bg-purple-500/20', icon: MessageSquare },
            { label: 'Propuestas aceptadas', value: loading ? '...' : propuestasAceptadas, color: 'text-emerald-300', bg: 'bg-emerald-500/20', icon: CheckCircle2 },
            { label: 'Pipeline en vuelo', value: loading ? '...' : `$${(pipelineB2BValue/1000).toFixed(0)}K`, color: 'text-teal-300', bg: 'bg-teal-500/20', icon: Target },
          ].map((k, i) => (
            <div key={i} className={`${k.bg} border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/15 transition-all backdrop-blur-sm`}>
              <k.icon className={`w-5 h-5 ${k.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold font-poppins ${k.color}`}>{k.value}</div>
                <div className="text-xs text-gray-300/70 leading-tight">{k.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Últimos leads */}
        {b2bLeads.slice(0, 3).length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            <p className="text-xs text-teal-300/70 font-medium uppercase tracking-wide">Últimos leads web</p>
            {b2bLeads.slice(0, 3).map(lead => (
              <div key={lead.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${(lead.lead_score || 0) >= 70 ? 'bg-emerald-400' : (lead.lead_score || 0) >= 40 ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                  <span className="font-medium text-white">{lead.company_name}</span>
                  <span className="text-gray-400 text-xs">{lead.contact_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">{lead.status}</span>
                  {lead.lead_score && <span className="text-xs font-bold text-cyan-300">{lead.lead_score}pts</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Tiendas Hoy"
          value={loading ? '...' : totalVentasHoy > 0 ? `$${(totalVentasHoy/1000).toFixed(0)}K` : '$0'}
          subtitle={`Mes: $${(totalVentasMes/1000).toFixed(0)}K · ${ventas.length} transacciones`}
          icon={Store}
          color="#14b8a6"
          bg="rgba(20,184,166,0.1)"
        />
        <StatCard
          title="Clientes LTV Total"
          value={loading ? '...' : `$${(totalLTV/1000000).toFixed(1)}M`}
          subtitle={`${clientesVIP} VIP · ${clientesEnRiesgo > 0 ? clientesEnRiesgo+' en riesgo' : 'Sin alertas'}`}
          icon={UserCheck}
          color={clientesEnRiesgo > 0 ? '#f97316' : '#14b8a6'}
          bg={clientesEnRiesgo > 0 ? 'rgba(249,115,22,0.1)' : 'rgba(20,184,166,0.1)'}
        />
        <StatCard
          title="Equipo Activo"
          value={loading ? '...' : equipoActivo}
          subtitle={`${colaboradores.length} colaboradores total`}
          icon={Users}
          color="#9ca3af"
          bg="rgba(156,163,175,0.1)"
        />
        <StatCard
          title="OKRs Avance Global"
          value={loading ? '...' : `${avgOKR}%`}
          subtitle={`${okrs.length} KRs · ${okrsEnRiesgo > 0 ? okrsEnRiesgo+' en riesgo' : 'Sin alertas'}`}
          icon={Flag}
          color={avgOKR >= 70 ? '#14b8a6' : avgOKR >= 40 ? '#f59e0b' : '#f97316'}
          bg={avgOKR >= 70 ? 'rgba(20,184,166,0.1)' : avgOKR >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(249,115,22,0.1)'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-poppins font-semibold text-foreground">Ingresos Mensuales (CLP K)</h3>
              <p className="text-xs text-muted-foreground">B2B + B2C • últimos 6 meses</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ingresosMensuales}>
              <defs>
                <linearGradient id="b2b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F8B6C" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0F8B6C" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="b2c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D96B4D" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#D96B4D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString('es-CL')}K`, '']} />
              <Area type="monotone" dataKey="b2b" stroke="#0F8B6C" fill="url(#b2b)" strokeWidth={2} name="B2B" />
              <Area type="monotone" dataKey="b2c" stroke="#D96B4D" fill="url(#b2c)" strokeWidth={2} name="B2C" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Canal Mix */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Mix de Ingresos</h3>
          <p className="text-xs text-muted-foreground mb-4">Por canal (CLP K)</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={canalMix} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {canalMix.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`$${v}K`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {canalMix.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">${item.value}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Semanal + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Actividad Comercial Semanal</h3>
          <p className="text-xs text-muted-foreground mb-4">Leads → Cotizaciones → Pedidos</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={kpiSemanal} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sem" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" fill="#A7D9C9" name="Leads" radius={[4,4,0,0]} />
              <Bar dataKey="cotizaciones" fill="#0F8B6C" name="Cotizaciones" radius={[4,4,0,0]} />
              <Bar dataKey="pedidos" fill="#D96B4D" name="Pedidos" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-4">Acceso Rápido</h3>
          <div className="space-y-2">
            {[
              { label: 'Nuevo Lead B2B', to: '/pipeline', color: '#0F8B6C' },
              { label: 'Nueva Cotización', to: '/pipeline', color: '#0F8B6C' },
              { label: 'Nueva Orden Producción', to: '/operaciones', color: '#4B4F54' },
              { label: 'Nueva Campaña', to: '/marketing', color: '#D96B4D' },
              { label: 'Ver Tiendas Físicas', to: '/tiendas', color: '#0F8B6C' },
              { label: 'Ver OKRs & Metas', to: '/okrs', color: '#0F8B6C' },
              { label: 'Ver Analítica', to: '/analitica', color: '#4B4F54' },
            ].map((item, i) => (
              <Link key={i} to={item.to} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>

          {/* OKR quick view */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">OKRs Blueprint Q2</p>
              <Link to="/okrs" className="text-xs font-medium" style={{ color: '#0F8B6C' }}>Ver todos →</Link>
            </div>
            {topOKRs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Sin OKRs cargados</p>
            ) : topOKRs.map((okr, i) => {
              const pct = getPct(okr);
              const barColor = pct >= 70 ? '#0F8B6C' : pct >= 40 ? '#f59e0b' : '#D96B4D';
              return (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground line-clamp-1">{okr.resultado_clave}</span>
                    <span className="font-medium ml-2 flex-shrink-0" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
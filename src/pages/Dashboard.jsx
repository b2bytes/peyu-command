import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  TrendingUp, TrendingDown, Users, Package, DollarSign,
  MessageSquare, Factory, AlertTriangle, CheckCircle2,
  Clock, Target, Zap, ArrowRight, Database, Loader2,
  Store, UserCheck, Flag
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

const COLORS = ['#0F8B6C', '#D96B4D', '#A7D9C9', '#4B4F54', '#E7D8C6'];

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "#0F8B6C", bg = "#f0faf7" }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-poppins font-bold mt-1" style={{ color: '#1a1a2e' }}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trendLabel && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center ml-3 flex-shrink-0" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

const ingresosMensuales = [
  { mes: 'Oct', b2b: 6400, b2c: 6000 },
  { mes: 'Nov', b2b: 6400, b2c: 5800 },
  { mes: 'Dic', b2b: 8000, b2c: 12000 },
  { mes: 'Ene', b2b: 6400, b2c: 4500 },
  { mes: 'Feb', b2b: 6400, b2c: 4200 },
  { mes: 'Mar', b2b: 6400, b2c: 4000 },
];

const canalMix = [
  { name: 'Meta Ads', value: 2000 },
  { name: 'B2B Directo', value: 6400 },
  { name: 'Tiendas Físicas', value: 500 },
  { name: 'Orgánico', value: 300 },
];

const kpiSemanal = [
  { sem: 'S1', leads: 3, cotizaciones: 2, pedidos: 1 },
  { sem: 'S2', leads: 4, cotizaciones: 3, pedidos: 2 },
  { sem: 'S3', leads: 3, cotizaciones: 2, pedidos: 1 },
  { sem: 'S4', leads: 5, cotizaciones: 4, pedidos: 2 },
];

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
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
    ]).then(([l, c, o, ok, cl, vt, col]) => {
      setLeads(l);
      setCotizaciones(c);
      setOrdenes(o);
      setOkrs(ok);
      setClientes(cl);
      setVentas(vt);
      setColaboradores(col);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await base44.functions.invoke('seedData', {});
      setSeedDone(true);
      setTimeout(() => { setSeedDone(false); loadData(); }, 2000);
    } finally {
      setSeeding(false);
    }
  };

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

  const alerts = [
    leadsCalientes > 0 && { type: 'warning', msg: `${leadsCalientes} leads calientes sin cotización enviada` },
    cotEnviadas > 0 && { type: 'info', msg: `${cotEnviadas} cotizaciones esperando respuesta del cliente` },
    ordenesUrgentes > 0 && { type: 'danger', msg: `${ordenesUrgentes} órdenes de producción urgentes` },
    clientesEnRiesgo > 0 && { type: 'danger', msg: `${clientesEnRiesgo} clientes en riesgo de churn — requieren recontacto` },
    okrsEnRiesgo > 0 && { type: 'warning', msg: `${okrsEnRiesgo} OKRs en riesgo — revisar iniciativas` },
    { type: 'success', msg: 'Tracking GA4 + Meta CAPI: Pendiente implementación' },
  ].filter(Boolean);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Centro de Comando</h1>
          <p className="text-muted-foreground text-sm mt-1">Blueprint empresarial Peyu • Actualizado hoy</p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding || seedDone}
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-dashed transition-all hover:bg-muted/50 disabled:opacity-60"
          title="Carga datos de ejemplo: productos, leads, cotizaciones, campañas">
          {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
          {seedDone ? '✓ Datos cargados' : seeding ? 'Cargando...' : 'Cargar datos demo'}
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              a.type === 'danger' ? 'bg-red-50 text-red-700 border border-red-200' :
              a.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              a.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {a.type === 'danger' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> :
               a.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> :
               <Clock className="w-4 h-4 flex-shrink-0" />}
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Web B2C"
          value="$4.0M"
          subtitle="Meta: $6M+ CLP/mes"
          icon={DollarSign}
          trend={-33}
          trendLabel="-33% vs mínimo histórico"
          color="#D96B4D"
          bg="#fdf3f0"
        />
        <StatCard
          title="Ingresos B2B"
          value="$6.4M"
          subtitle="8 pedidos × $800K ticket"
          icon={Target}
          trend={0}
          trendLabel="Estable • Meta: 16/mes"
          color="#0F8B6C"
          bg="#f0faf7"
        />
        <StatCard
          title="Leads Activos"
          value={loading ? '...' : leadsActivos}
          subtitle={`${leadsCalientes} calientes`}
          icon={Users}
          color="#0F8B6C"
          bg="#f0faf7"
        />
        <StatCard
          title="Órdenes Producción"
          value={loading ? '...' : ordenesActivas}
          subtitle={`${ordenesUrgentes} urgentes`}
          icon={Factory}
          color={ordenesUrgentes > 0 ? "#D96B4D" : "#0F8B6C"}
          bg={ordenesUrgentes > 0 ? "#fdf3f0" : "#f0faf7"}
        />
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Tiendas Hoy"
          value={loading ? '...' : totalVentasHoy > 0 ? `$${(totalVentasHoy/1000).toFixed(0)}K` : '$0'}
          subtitle={`Mes: $${(totalVentasMes/1000).toFixed(0)}K · ${ventas.length} transacciones`}
          icon={Store}
          color="#0F8B6C"
          bg="#f0faf7"
        />
        <StatCard
          title="Clientes LTV Total"
          value={loading ? '...' : `$${(totalLTV/1000000).toFixed(1)}M`}
          subtitle={`${clientesVIP} VIP · ${clientesEnRiesgo > 0 ? clientesEnRiesgo+' en riesgo' : 'Sin alertas'}`}
          icon={UserCheck}
          color={clientesEnRiesgo > 0 ? '#D96B4D' : '#0F8B6C'}
          bg={clientesEnRiesgo > 0 ? '#fdf3f0' : '#f0faf7'}
        />
        <StatCard
          title="Equipo Activo"
          value={loading ? '...' : equipoActivo}
          subtitle={`${colaboradores.length} colaboradores total`}
          icon={Users}
          color="#4B4F54"
          bg="#f5f5f5"
        />
        <StatCard
          title="OKRs Avance Global"
          value={loading ? '...' : `${avgOKR}%`}
          subtitle={`${okrs.length} KRs · ${okrsEnRiesgo > 0 ? okrsEnRiesgo+' en riesgo' : 'Sin alertas'}`}
          icon={Flag}
          color={avgOKR >= 70 ? '#0F8B6C' : avgOKR >= 40 ? '#f59e0b' : '#D96B4D'}
          bg={avgOKR >= 70 ? '#f0faf7' : avgOKR >= 40 ? '#fffbeb' : '#fdf3f0'}
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
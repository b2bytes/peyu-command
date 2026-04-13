import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0F8B6C', '#D96B4D', '#A7D9C9', '#4B4F54', '#f59e0b', '#3b82f6'];

const fmtCLP = (v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;

// Static scenario & radar data (from blueprint)
const escenarios = [
  { escenario: 'Pesimista', b2b: 6400, b2c: 3000, total: 9400 },
  { escenario: 'Actual', b2b: 6400, b2c: 4000, total: 10400 },
  { escenario: 'Base 90d', b2b: 9600, b2c: 4500, total: 14100 },
  { escenario: 'Optimista', b2b: 12800, b2c: 6000, total: 18800 },
];

const radarData = [
  { subject: 'B2B Pipeline', actual: 40, objetivo: 90 },
  { subject: 'Automatización', actual: 5, objetivo: 80 },
  { subject: 'Canal Mix', actual: 10, objetivo: 70 },
  { subject: 'Tracking', actual: 20, objetivo: 95 },
  { subject: 'Contenido', actual: 30, objetivo: 80 },
  { subject: 'Util. Planta', actual: 35, objetivo: 70 },
];

const costosFijos = [
  { item: 'Meta Ads', valor: 2000, tipo: 'Marketing' },
  { item: 'Sueldos', valor: 1900, tipo: 'RRHH' },
  { item: 'Arriendo Galpón', valor: 1000, tipo: 'Infraestructura' },
  { item: 'Luz', valor: 600, tipo: 'Operaciones' },
  { item: 'Agua/Plásticos', valor: 700, tipo: 'Operaciones' },
  { item: 'Envíos', valor: 600, tipo: 'Logística' },
  { item: 'Arriendo Bilbao', valor: 250, tipo: 'Infraestructura' },
  { item: 'B2BYTES', valor: 300, tipo: 'Servicios' },
  { item: 'Contador', valor: 60, tipo: 'Admin' },
];

const getPct = (okr) => {
  if (!okr.valor_meta || okr.valor_meta === okr.valor_inicial) return 0;
  const dir = okr.valor_meta > okr.valor_inicial ? 1 : -1;
  const range = Math.abs(okr.valor_meta - okr.valor_inicial);
  const progress = dir * ((okr.valor_actual || 0) - (okr.valor_inicial || 0));
  return Math.min(100, Math.max(0, Math.round(progress / range * 100)));
};

export default function Analitica() {
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [pedidosWeb, setPedidosWeb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.Cotizacion.list('-created_date', 200),
      base44.entities.Campana.list('-created_date', 100),
      base44.entities.Cliente.list('-created_date', 200),
      base44.entities.VentaTienda.list('-created_date', 500),
      base44.entities.OKR.list('-created_date', 100),
      base44.entities.OrdenProduccion.list('-created_date', 100),
      base44.entities.MovimientoCaja.list('-fecha', 300),
      base44.entities.PedidoWeb.list('-fecha', 500),
    ]).then(([l, c, cam, cl, vt, ok, op, mov, pw]) => {
      setLeads(l); setCotizaciones(c); setCampanas(cam);
      setClientes(cl); setVentas(vt); setOkrs(ok); setOrdenes(op);
      setMovimientos(mov); setPedidosWeb(pw);
      setLoading(false);
    });
  }, []);

  // ── Computed KPIs ────────────────────────────────────────────
  const totalCostos = costosFijos.reduce((s, c) => s + c.valor, 0);
  const ingresoEst = 10400;
  const margen = ingresoEst - totalCostos;

  // Leads funnel
  const totalLeads = leads.length;
  const leadsCalientes = leads.filter(l => l.calidad_lead === 'Caliente').length;
  const cotEnviadas = cotizaciones.filter(c => ['Enviada','Aceptada'].includes(c.estado)).length;
  const ganados = leads.filter(l => l.estado === 'Ganado').length;
  const convRate = totalLeads > 0 ? ((ganados / totalLeads) * 100).toFixed(1) : 0;

  // Caja real
  const mesActual = new Date().toISOString().slice(0, 7);
  const movMes = movimientos.filter(m => m.fecha?.startsWith(mesActual));
  const ingresosMesReal = movMes.filter(m => m.tipo === 'Ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const egresosMesReal = movMes.filter(m => m.tipo === 'Egreso').reduce((s, m) => s + (m.monto || 0), 0);
  const saldoMesReal = ingresosMesReal - egresosMesReal;
  const hayDatosCaja = movimientos.length > 0;
  const ingresoFin = hayDatosCaja ? ingresosMesReal : 10400000;
  const egresoFin = hayDatosCaja ? egresosMesReal : 7410000;
  const margenFin = ingresoFin - egresoFin;

  // Evolución 6 meses
  const meses6 = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const m = d.toISOString().slice(0, 7);
    const label = d.toLocaleString('es-CL', { month: 'short' });
    const ing = movimientos.filter(x => x.fecha?.startsWith(m) && x.tipo === 'Ingreso').reduce((s, x) => s + (x.monto || 0), 0);
    const eg = movimientos.filter(x => x.fecha?.startsWith(m) && x.tipo === 'Egreso').reduce((s, x) => s + (x.monto || 0), 0);
    meses6.push({ mes: label, Ingresos: ing, Egresos: eg, Saldo: ing - eg });
  }

  // Egresos por categoría del mes
  const egresosCateg = {};
  movMes.filter(m => m.tipo === 'Egreso').forEach(m => {
    egresosCateg[m.categoria] = (egresosCateg[m.categoria] || 0) + (m.monto || 0);
  });

  // Campañas
  const totalInvPub = campanas.reduce((s, c) => s + (c.gasto_real_clp || 0), 0);
  const totalImpresiones = campanas.reduce((s, c) => s + (c.impresiones || 0), 0);
  const totalLeadsGen = campanas.reduce((s, c) => s + (c.leads_generados || 0), 0);
  const avgRoas = campanas.filter(c => c.roas).length > 0
    ? (campanas.filter(c => c.roas).reduce((s, c) => s + c.roas, 0) / campanas.filter(c => c.roas).length).toFixed(1)
    : '—';

  // Clientes
  const totalLTV = clientes.reduce((s, c) => s + (c.total_compras_clp || 0), 0);
  const avgNPS = clientes.filter(c => c.nps_score).length > 0
    ? (clientes.filter(c => c.nps_score).reduce((s, c) => s + c.nps_score, 0) / clientes.filter(c => c.nps_score).length).toFixed(1)
    : '—';
  const clientesVIP = clientes.filter(c => c.estado === 'VIP').length;

  // Tiendas
  const totalVentasTiendas = ventas.reduce((s, v) => s + (v.total || 0), 0);
  const ventasLaser = ventas.filter(v => v.personalizacion_laser).length;
  const pctLaser = ventas.length > 0 ? Math.round(ventasLaser / ventas.length * 100) : 0;

  // Tienda split
  const vProv = ventas.filter(v => v.tienda?.includes('Providencia')).reduce((s,v)=>s+(v.total||0),0);
  const vMacul = ventas.filter(v => v.tienda?.includes('Macul')).reduce((s,v)=>s+(v.total||0),0);
  const tiendaData = [
    { name: 'Providencia', value: Math.round(vProv/1000) },
    { name: 'Macul', value: Math.round(vMacul/1000) },
  ];

  // OKR summary by area
  const okrByArea = ['Comercial','Marketing','Producción','Finanzas','Tecnología'].map(area => {
    const areaOkrs = okrs.filter(o => o.area === area);
    const avg = areaOkrs.length > 0 ? Math.round(areaOkrs.reduce((s,o)=>s+getPct(o),0)/areaOkrs.length) : 0;
    return { area, avg, count: areaOkrs.length };
  }).filter(a => a.count > 0);

  // Campañas por canal
  const canalData = campanas.reduce((acc, c) => {
    const ex = acc.find(a => a.canal === c.canal);
    if (ex) { ex.gasto += (c.gasto_real_clp || 0); ex.leads += (c.leads_generados || 0); }
    else acc.push({ canal: c.canal, gasto: c.gasto_real_clp || 0, leads: c.leads_generados || 0 });
    return acc;
  }, []);

  // Órdenes by estado
  const ordenesEstado = ordenes.reduce((acc, o) => {
    const ex = acc.find(a => a.estado === o.estado);
    if (ex) ex.count++;
    else acc.push({ estado: o.estado, count: 1 });
    return acc;
  }, []);

  // Lead por canal
  const leadCanal = leads.reduce((acc, l) => {
    const ex = acc.find(a => a.canal === l.canal);
    if (ex) ex.value++;
    else acc.push({ canal: l.canal, value: 1 });
    return acc;
  }, []);

  const funnelData = [
    { stage: 'Leads totales', value: totalLeads || 7 },
    { stage: 'Calientes', value: leadsCalientes || 3 },
    { stage: 'Cotizaciones', value: cotEnviadas || 4 },
    { stage: 'Ganados', value: ganados || 0 },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0F8B6C' }} />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-foreground">Analítica & Escenarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Datos en tiempo real · Blueprint Peyu Q2 2026</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'LTV Total Clientes', value: fmtCLP(totalLTV), sub: `${clientes.length} clientes · ${clientesVIP} VIP`, color: '#0F8B6C' },
          { label: 'NPS Promedio', value: avgNPS !== '—' ? `${avgNPS}/10` : '—', sub: 'Satisfacción clientes', color: avgNPS >= 8 ? '#0F8B6C' : '#f59e0b' },
          { label: 'Ventas Tiendas', value: fmtCLP(totalVentasTiendas), sub: `${pctLaser}% con láser · ${ventas.length} tx`, color: '#0F8B6C' },
          { label: 'Conversión B2B', value: `${convRate}%`, sub: `${ganados} ganados / ${totalLeads} leads`, color: Number(convRate) >= 5 ? '#0F8B6C' : '#D96B4D' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-poppins font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="comercial">
        <TabsList className="bg-muted flex flex-wrap h-auto gap-1">
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce Web</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="operaciones">Operaciones</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="caja">Caja Real</TabsTrigger>
          <TabsTrigger value="okrs">OKRs</TabsTrigger>
        </TabsList>

        {/* ── COMERCIAL ── */}
        <TabsContent value="comercial" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Funnel */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Embudo B2B</h3>
              <p className="text-xs text-muted-foreground mb-4">Leads → Calientes → Cotizados → Ganados</p>
              <div className="space-y-3">
                {funnelData.map((f, i) => {
                  const pct = i === 0 ? 100 : funnelData[0].value > 0 ? Math.round(f.value / funnelData[0].value * 100) : 0;
                  const colors = ['#4B4F54', '#f59e0b', '#A7D9C9', '#0F8B6C'];
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{f.stage}</span>
                        <span className="font-bold" style={{ color: colors[i] }}>{f.value} ({pct}%)</span>
                      </div>
                      <div className="h-5 bg-muted rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg" style={{ width: `${Math.max(pct,5)}%`, background: colors[i] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 rounded-xl text-xs bg-amber-50 border border-amber-200">
                <p className="font-medium text-amber-700">Meta: Conversión 3.3% → 7% en 90 días</p>
                <p className="text-amber-600 mt-0.5">Implementar triage WhatsApp + SLA cotización &lt;24h</p>
              </div>
            </div>

            {/* Leads por canal */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Leads por Canal</h3>
              <p className="text-xs text-muted-foreground mb-4">{totalLeads} leads registrados</p>
              {leadCanal.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={leadCanal} barSize={28} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="canal" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0F8B6C" radius={[0,4,4,0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">Sin datos de leads</div>
              )}
            </div>

            {/* Clientes por tipo */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Clientes por Estado</h3>
              <p className="text-xs text-muted-foreground mb-4">LTV total: {fmtCLP(totalLTV)}</p>
              {clientes.length > 0 ? (
                <div className="space-y-2">
                  {['VIP','Activo','En Riesgo','Inactivo'].map((est, i) => {
                    const grupo = clientes.filter(c => c.estado === est);
                    const ltv = grupo.reduce((s,c)=>s+(c.total_compras_clp||0),0);
                    if (grupo.length === 0) return null;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs w-20 text-muted-foreground">{est}</span>
                        <div className="flex-1 h-5 bg-muted rounded-lg overflow-hidden">
                          <div className="h-full rounded-lg flex items-center px-2 text-xs text-white font-medium"
                            style={{ width: `${totalLTV > 0 ? Math.round(ltv/totalLTV*100) : 10}%`, background: COLORS[i] }}>
                            {grupo.length}
                          </div>
                        </div>
                        <span className="text-xs font-medium w-20 text-right">{fmtCLP(ltv)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin datos</div>}
            </div>

            {/* Cotizaciones */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Cotizaciones</h3>
              <p className="text-xs text-muted-foreground mb-4">{cotizaciones.length} cotizaciones emitidas</p>
              {cotizaciones.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={['Borrador','Enviada','Aceptada','Rechazada','Vencida'].map((e,i) => ({
                        name: e, value: cotizaciones.filter(c=>c.estado===e).length
                      })).filter(d=>d.value>0)} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                        {['#A7D9C9','#f59e0b','#0F8B6C','#D96B4D','#9ca3af'].map((c,i)=><Cell key={i} fill={c}/>)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { label: 'Aceptadas', v: cotizaciones.filter(c=>c.estado==='Aceptada').length, color: '#0F8B6C' },
                      { label: 'Enviadas', v: cotizaciones.filter(c=>c.estado==='Enviada').length, color: '#f59e0b' },
                      { label: 'Rechazadas', v: cotizaciones.filter(c=>c.estado==='Rechazada').length, color: '#D96B4D' },
                    ].map((s,i) => (
                      <div key={i} className="text-center">
                        <p className="font-bold" style={{ color: s.color }}>{s.v}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin datos</div>}
            </div>
          </div>
        </TabsContent>

        {/* ── E-COMMERCE WEB ── */}
        <TabsContent value="ecommerce" className="space-y-4 mt-4">
          {(() => {
            const mesActualEco = new Date().toISOString().slice(0, 7);
            const pwMes = pedidosWeb.filter(p => p.fecha?.startsWith(mesActualEco));
            const totalPwMes = pwMes.reduce((s, p) => s + (p.total || 0), 0);
            const pwNuevos = pedidosWeb.filter(p => p.estado === 'Nuevo').length;
            const pwConPers = pedidosWeb.filter(p => p.requiere_personalizacion).length;
            const ticketProm = pwMes.length > 0 ? Math.round(totalPwMes / pwMes.length) : 0;
            const pwPorEstado = ['Nuevo','Confirmado','En Producción','Listo para Despacho','Despachado','Entregado'].map(e => ({
              estado: e, count: pedidosWeb.filter(p => p.estado === e).length
            })).filter(e => e.count > 0);
            const pwPorCanal = pedidosWeb.reduce((acc, p) => {
              const ex = acc.find(a => a.canal === p.canal);
              if (ex) { ex.count++; ex.total += (p.total || 0); }
              else acc.push({ canal: p.canal || 'Sin canal', count: 1, total: p.total || 0 });
              return acc;
            }, []).sort((a, b) => b.total - a.total);
            const ultimos5 = pedidosWeb.slice(0, 5);
            const colorEstado = { Nuevo: '#3b82f6', Confirmado: '#f59e0b', 'En Producción': '#8b5cf6', 'Listo para Despacho': '#0F8B6C', Despachado: '#A7D9C9', Entregado: '#22c55e' };

            return (
              <>
                {pedidosWeb.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg font-medium">Sin pedidos web registrados</p>
                    <p className="text-sm mt-2">Los pedidos de la tienda online aparecerán aquí.</p>
                  </div>
                )}
                {pedidosWeb.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Ventas Web Mes', value: fmtCLP(totalPwMes), sub: `${pwMes.length} pedidos`, color: '#0F8B6C' },
                        { label: 'Ticket Promedio', value: ticketProm > 0 ? fmtCLP(ticketProm) : '—', sub: 'Por pedido web', color: '#0F8B6C' },
                        { label: 'Pendientes / Nuevos', value: pwNuevos, sub: 'Requieren atención', color: pwNuevos > 0 ? '#D96B4D' : '#0F8B6C' },
                        { label: 'Con Personalización', value: `${pedidosWeb.length > 0 ? Math.round(pwConPers / pedidosWeb.length * 100) : 0}%`, sub: `${pwConPers} de ${pedidosWeb.length}`, color: '#0F8B6C' },
                      ].map((k, i) => (
                        <div key={i} className="bg-white rounded-xl p-4 border border-border shadow-sm">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                          <p className="text-2xl font-poppins font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Estado pedidos */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                        <h3 className="font-poppins font-semibold mb-4">Estado de Pedidos Web</h3>
                        <div className="space-y-2">
                          {pwPorEstado.map((e, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs w-36 text-muted-foreground truncate">{e.estado}</span>
                              <div className="flex-1 h-5 bg-muted rounded-lg overflow-hidden">
                                <div className="h-full rounded-lg flex items-center px-2 text-xs text-white font-medium"
                                  style={{ width: `${Math.max(e.count / pedidosWeb.length * 100, 8)}%`, background: colorEstado[e.estado] || '#0F8B6C' }}>
                                  {e.count}
                                </div>
                              </div>
                              <span className="text-xs font-bold w-8 text-right">{e.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ventas por canal */}
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                        <h3 className="font-poppins font-semibold mb-4">Ventas Web por Canal</h3>
                        {pwPorCanal.length > 0 ? (
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={pwPorCanal} barSize={24} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => fmtCLP(v)} />
                              <YAxis dataKey="canal" type="category" tick={{ fontSize: 10 }} width={90} />
                              <Tooltip formatter={v => [fmtCLP(v), 'Ventas']} />
                              <Bar dataKey="total" fill="#0F8B6C" radius={[0,4,4,0]} name="Ventas" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin datos</div>}
                      </div>
                    </div>

                    {/* Últimos pedidos */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                      <h3 className="font-poppins font-semibold mb-4">Últimos 5 Pedidos Web</h3>
                      <div className="divide-y divide-border">
                        {ultimos5.map((p, i) => (
                          <div key={i} className="py-3 flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">{p.cliente_nombre}</p>
                              <p className="text-xs text-muted-foreground">{p.fecha} · {p.canal} · {p.descripcion_items?.slice(0,40)}</p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: colorEstado[p.estado] + '20', color: colorEstado[p.estado] || '#0F8B6C' }}>{p.estado}</span>
                              <span className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>{fmtCLP(p.total || 0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* ── MARKETING ── */}
        <TabsContent value="marketing" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Inversión Publicidad', value: fmtCLP(totalInvPub), color: '#D96B4D' },
              { label: 'Impresiones', value: totalImpresiones >= 1000 ? `${(totalImpresiones/1000).toFixed(0)}K` : totalImpresiones, color: '#0F8B6C' },
              { label: 'Leads Generados', value: totalLeadsGen, color: '#0F8B6C' },
              { label: 'ROAS Promedio', value: `${avgRoas}x`, color: Number(avgRoas) >= 2.5 ? '#0F8B6C' : '#D96B4D' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="font-poppins font-bold text-xl mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Canal spend */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-4">Gasto por Canal</h3>
              {canalData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={canalData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="canal" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v=>[fmtCLP(v)]} />
                    <Bar dataKey="gasto" fill="#D96B4D" name="Gasto CLP" radius={[4,4,0,0]} />
                    <Bar dataKey="leads" fill="#0F8B6C" name="Leads" radius={[4,4,0,0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin campañas</div>}
            </div>

            {/* Radar madurez */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Madurez de Capacidades</h3>
              <p className="text-xs text-muted-foreground mb-4">Actual vs Objetivo Blueprint</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Actual" dataKey="actual" stroke="#D96B4D" fill="#D96B4D" fillOpacity={0.2} />
                  <Radar name="Objetivo" dataKey="objetivo" stroke="#0F8B6C" fill="#0F8B6C" fillOpacity={0.1} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── OPERACIONES ── */}
        <TabsContent value="operaciones" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tiendas split */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Ventas por Tienda</h3>
              <p className="text-xs text-muted-foreground mb-4">Total: {fmtCLP(totalVentasTiendas)} · {ventas.length} transacciones</p>
              {ventas.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={tiendaData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value">
                        <Cell fill="#0F8B6C" /><Cell fill="#A7D9C9" />
                      </Pie>
                      <Tooltip formatter={v=>[`$${v}K`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {tiendaData.map((t, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="font-bold font-poppins" style={{ color: i===0?'#0F8B6C':'#4B4F54' }}>${t.value}K</p>
                        <p className="text-xs text-muted-foreground">{t.name}</p>
                        <p className="text-xs mt-1" style={{ color: '#0F8B6C' }}>{pctLaser}% con láser</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin ventas registradas</div>}
            </div>

            {/* Órdenes producción */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Órdenes de Producción</h3>
              <p className="text-xs text-muted-foreground mb-4">{ordenes.length} órdenes totales</p>
              {ordenesEstado.length > 0 ? (
                <div className="space-y-2">
                  {ordenesEstado.map((o, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-40 text-muted-foreground truncate">{o.estado}</span>
                      <div className="flex-1 h-5 bg-muted rounded-lg overflow-hidden">
                        <div className="h-full rounded-lg" style={{ width: `${Math.max(o.count/ordenes.length*100,8)}%`, background: COLORS[i%COLORS.length] }} />
                      </div>
                      <span className="text-xs font-bold w-6 text-right">{o.count}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-8 text-muted-foreground text-sm">Sin órdenes</div>}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: '#f0faf7' }}>
                  <p className="font-bold text-lg" style={{ color: '#0F8B6C' }}>35%</p>
                  <p className="text-xs text-muted-foreground">Util. Planta</p>
                  <p className="text-xs font-medium" style={{ color: '#0F8B6C' }}>Meta: 70%</p>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: '#fdf3f0' }}>
                  <p className="font-bold text-lg" style={{ color: '#D96B4D' }}>4.2%</p>
                  <p className="text-xs text-muted-foreground">Scrap actual</p>
                  <p className="text-xs font-medium" style={{ color: '#D96B4D' }}>Meta: &lt;3%</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── FINANCIERO ── */}
        <TabsContent value="financiero" className="space-y-4 mt-4">
          {!hayDatosCaja && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-amber-700">
              Mostrando estimados del blueprint. Registra movimientos en <strong>Flujo de Caja</strong> para ver datos reales.
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresos {hayDatosCaja ? 'Reales Mes' : 'Est. Mensual'}</p>
              <p className="text-3xl font-poppins font-bold mt-2" style={{ color: '#0F8B6C' }}>{fmtCLP(ingresoFin)}</p>
              <p className="text-xs text-muted-foreground mt-1">{hayDatosCaja ? `${movMes.filter(m=>m.tipo==='Ingreso').length} movimientos` : 'B2B $6.4M + B2C $4.0M CLP'}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Egresos {hayDatosCaja ? 'Reales Mes' : 'Est. Mensual'}</p>
              <p className="text-3xl font-poppins font-bold mt-2" style={{ color: '#4B4F54' }}>{fmtCLP(egresoFin)}</p>
              <p className="text-xs text-muted-foreground mt-1">{hayDatosCaja ? `${movMes.filter(m=>m.tipo==='Egreso').length} pagos registrados` : 'CLP/mes estimado'}</p>
            </div>
            <div className={`bg-white rounded-2xl p-5 shadow-sm border text-center ${margenFin > 0 ? 'border-green-200' : 'border-red-200'}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Resultado Neto</p>
              <p className="text-3xl font-poppins font-bold mt-2" style={{ color: margenFin > 0 ? '#0F8B6C' : '#D96B4D' }}>
                {margenFin >= 0 ? '+' : ''}{fmtCLP(margenFin)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{ingresoFin > 0 ? ((margenFin/ingresoFin)*100).toFixed(0) : 0}% margen</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Escenarios Financieros</h3>
              <p className="text-xs text-muted-foreground mb-4">B2B + B2C proyectado · CLP K/mes</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={escenarios} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="escenario" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v=>[`$${v.toLocaleString('es-CL')}K`]} />
                  <Legend />
                  <Bar dataKey="b2b" fill="#0F8B6C" name="B2B" stackId="a" />
                  <Bar dataKey="b2c" fill="#A7D9C9" name="B2C" radius={[4,4,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-4">Breakdown de Costos Fijos</h3>
              <div className="space-y-2">
                {costosFijos.map((c, i) => {
                  const pct = Math.round(c.valor / totalCostos * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-28 text-xs text-muted-foreground truncate">{c.item}</div>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.item === 'Meta Ads' ? '#D96B4D' : '#0F8B6C' }} />
                      </div>
                      <div className="text-xs text-right w-20">
                        <span className="font-medium">${c.valor}K</span>
                        <span className="text-muted-foreground ml-1">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-poppins font-bold" style={{ color: '#4B4F54' }}>${totalCostos}K/mes</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── CAJA REAL ── */}
        <TabsContent value="caja" className="space-y-4 mt-4">
          {!hayDatosCaja ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">Sin movimientos registrados</p>
              <p className="text-sm mt-2">Ve a <strong>Flujo de Caja</strong> y registra ingresos y egresos.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Ingresos Mes', value: fmtCLP(ingresosMesReal), color: '#0F8B6C', bg: '#f0faf7' },
                  { label: 'Egresos Mes', value: fmtCLP(egresosMesReal), color: '#D96B4D', bg: '#fdf3f0' },
                  { label: 'Saldo Neto', value: fmtCLP(saldoMesReal), color: saldoMesReal >= 0 ? '#0F8B6C' : '#D96B4D', bg: saldoMesReal >= 0 ? '#f0faf7' : '#fdf3f0' },
                  { label: 'Total Movimientos', value: movimientos.length, color: '#4B4F54', bg: '#f5f5f5' },
                ].map((k, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-border shadow-sm">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className="font-poppins font-bold text-xl mt-1" style={{ color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <h3 className="font-poppins font-semibold text-sm mb-4">Evolución Saldo Neto — Últimos 6 meses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={meses6}>
                    <defs>
                      <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F8B6C" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0F8B6C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v=>[fmtCLP(v)]} />
                    <Legend />
                    <Area type="monotone" dataKey="Ingresos" stroke="#0F8B6C" fill="none" strokeWidth={2} />
                    <Area type="monotone" dataKey="Egresos" stroke="#D96B4D" fill="none" strokeWidth={2} />
                    <Area type="monotone" dataKey="Saldo" stroke="#4B4F54" fill="url(#gradSaldo)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {Object.keys(egresosCateg).length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                  <h3 className="font-poppins font-semibold text-sm mb-4">Egresos por Categoría — Mes Actual</h3>
                  <div className="space-y-2">
                    {Object.entries(egresosCateg).sort((a,b)=>b[1]-a[1]).map(([cat, monto]) => {
                      const pct = Math.round((monto / egresosMesReal) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{cat}</span>
                            <span className="font-medium text-red-600">{fmtCLP(monto)} <span className="text-muted-foreground">({pct}%)</span></span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#D96B4D' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── OKRs ── */}
        <TabsContent value="okrs" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total KRs', value: okrs.length, color: '#0F8B6C' },
              { label: 'Completados', value: okrs.filter(o=>o.estado==='Completado').length, color: '#0F8B6C' },
              { label: 'En Riesgo', value: okrs.filter(o=>o.estado==='En riesgo').length, color: '#D96B4D' },
              { label: 'Avance Global', value: okrs.length > 0 ? `${Math.round(okrs.reduce((s,o)=>s+getPct(o),0)/okrs.length)}%` : '—', color: '#0F8B6C' },
            ].map((k,i)=>(
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="font-poppins font-bold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* OKR por área */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-4">Avance por Área</h3>
            {okrByArea.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Sin OKRs cargados. Ve a OKRs & Metas para cargar el blueprint.</div>
            ) : (
              <div className="space-y-3">
                {okrByArea.map((a, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{a.area}</span>
                      <span className="font-bold" style={{ color: a.avg >= 70 ? '#0F8B6C' : a.avg >= 40 ? '#f59e0b' : '#D96B4D' }}>{a.avg}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${a.avg}%`, background: a.avg >= 70 ? '#0F8B6C' : a.avg >= 40 ? '#f59e0b' : '#D96B4D' }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.count} Key Results</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checklist 14 días */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-4">Checklist Blueprint — Primeros 14 días</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { ok: true,  task: 'Centro de Comando Peyu operativo', impact: 'Todos los módulos activos' },
                { ok: false, task: 'Activar GA4 + Meta CAPI server-side', impact: 'Tracking confiable en 7 días' },
                { ok: false, task: 'WhatsApp Business API + autoresponder', impact: 'Reducir consultas no comerciales -30%' },
                { ok: false, task: 'Plantilla CPQ validada con cliente', impact: 'SLA cotización &lt;24h' },
                { ok: false, task: 'Landing B2B en peyuchile.cl', impact: 'CTR objetivo 3-5%' },
                { ok: false, task: 'Google Search Ads keywords B2B', impact: 'Nuevo canal de adquisición' },
                { ok: false, task: 'Pausar Advantage+ sin A/B testing', impact: 'Ahorro inmediato CLP' },
                { ok: false, task: '3 reels/semana de producción', impact: 'Contenido Meta + TikTok' },
                { ok: false, task: 'Email abandoned cart + welcome', impact: 'Recuperar +15% conversión web' },
              ].map((item, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-xl border transition-colors ${item.ok ? 'border-green-200 bg-green-50' : 'border-border hover:bg-muted/30'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${item.ok ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}>
                    {item.ok && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.task}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" dangerouslySetInnerHTML={{ __html: item.impact }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
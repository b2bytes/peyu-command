import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, DollarSign, Factory, Target, Store, UserCheck,
  AlertTriangle, Clock, Bot, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import RealtimeKPIs from "@/components/command-center/RealtimeKPIs";
import ActionInbox from "@/components/command-center/ActionInbox";
import ClickableKPI from "@/components/command-center/ClickableKPI";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AccesosRapidosGrid from "@/components/dashboard/AccesosRapidosGrid";

// ════════════════════════════════════════════════════════════════════════
// Dashboard — Vista operativa del día, limpia y sin agente embebido.
// Estructura: 1) KPIs en vivo → 2) bandeja de acciones + alertas →
// 3) KPIs del negocio → 4) gráficos → 5) accesos rápidos.
// El centro de comandos total es el Agent OS (/admin/agente).
// ════════════════════════════════════════════════════════════════════════

// ── Helpers de series temporales (data real) ─────────────────────────────
function buildIngresosMensuales(pedidosWeb, proposals) {
  const meses = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('es-CL', { month: 'short' });
    const b2c = pedidosWeb.filter(p => p.fecha?.startsWith(key)).reduce((s, p) => s + (p.total || 0), 0);
    const b2b = proposals.filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(key)).reduce((s, p) => s + (p.total || 0), 0);
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
    const start = new Date(now); start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date(now); end.setDate(end.getDate() - i * 7);
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
  const [pedidosWeb, setPedidosWeb] = useState([]);
  const [b2bLeads, setB2bLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PedidoWeb.list('-fecha', 300),
      base44.entities.B2BLead.list('-created_date', 100),
      base44.entities.CorporateProposal.list('-created_date', 100),
      base44.entities.VentaTienda.list('-created_date', 200),
      base44.entities.OrdenProduccion.list('-created_date', 100),
      base44.entities.Cliente.list('-created_date', 100),
    ]).then(([pw, bl, props, vt, o, cl]) => {
      setPedidosWeb(pw); setB2bLeads(bl); setProposals(props);
      setVentas(vt); setOrdenes(o); setClientes(cl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Métricas ────────────────────────────────────────────────────────────
  const mesActual = new Date().toISOString().slice(0, 7);
  const hoy = new Date().toISOString().split('T')[0];

  const pedidosWebMes = pedidosWeb.filter(p => p.fecha?.startsWith(mesActual));
  const ventasWebMes = pedidosWebMes.reduce((s, p) => s + (p.total || 0), 0);
  const pedidosWebPendientes = pedidosWeb.filter(p => p.estado === 'Nuevo').length;

  const b2bLeadsNuevos = b2bLeads.filter(l => l.status === 'Nuevo').length;
  const b2bLeadsCalientes = b2bLeads.filter(l => (l.lead_score || 0) >= 70).length;
  const propuestasPendientes = proposals.filter(p => p.status === 'Enviada').length;
  const propuestasAceptadasMes = proposals.filter(p => p.status === 'Aceptada' && (p.fecha_envio || '').startsWith(mesActual));
  const ingresosB2BMes = propuestasAceptadasMes.reduce((s, p) => s + (p.total || 0), 0);

  const ordenesActivas = ordenes.filter(o => o.estado !== 'Despachado').length;
  const ordenesUrgentes = ordenes.filter(o => o.prioridad === 'Alta (urgente)').length;

  const ventasHoy = ventas.filter(v => v.fecha === hoy).reduce((s, v) => s + (v.total || 0), 0);
  const totalVentasMes = ventas.reduce((s, v) => s + (v.total || 0), 0);

  const clientesVIP = clientes.filter(c => c.estado === 'VIP').length;
  const clientesEnRiesgo = clientes.filter(c => c.estado === 'En Riesgo').length;
  const totalLTV = clientes.reduce((s, c) => s + (c.total_compras_clp || 0), 0);

  const ingresosMensuales = buildIngresosMensuales(pedidosWeb, proposals);
  const canalMix = buildCanalMix(pedidosWeb, ventas, proposals);
  const kpiSemanal = buildKpiSemanal(b2bLeads, proposals, pedidosWeb);

  // ── Alertas accionables (solo lo que requiere intervención) ─────────────
  const alerts = [
    pedidosWebPendientes > 0 && { type: 'warning', msg: `${pedidosWebPendientes} pedidos web nuevos por procesar`, to: '/admin/procesar-pedidos' },
    b2bLeadsNuevos > 0 && { type: 'warning', msg: `${b2bLeadsNuevos} leads B2B nuevos sin gestionar`, to: '/admin/pipeline' },
    b2bLeadsCalientes > 0 && { type: 'info', msg: `${b2bLeadsCalientes} leads con score ≥70 listos para propuesta`, to: '/admin/pipeline' },
    propuestasPendientes > 0 && { type: 'info', msg: `${propuestasPendientes} propuestas esperando respuesta del cliente`, to: '/admin/propuestas' },
    ordenesUrgentes > 0 && { type: 'danger', msg: `${ordenesUrgentes} órdenes de producción urgentes`, to: '/admin/operaciones' },
    clientesEnRiesgo > 0 && { type: 'danger', msg: `${clientesEnRiesgo} clientes en riesgo de churn`, to: '/admin/clientes' },
  ].filter(Boolean);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header simple + acceso al centro de comandos (Agent OS) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-jakarta font-black text-2xl sm:text-3xl text-ld-fg tracking-tight">Dashboard</h1>
          <p className="text-sm text-ld-fg-muted mt-0.5">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          to="/admin/agente"
          className="ld-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold"
        >
          <Bot className="w-4 h-4" />
          Agent OS · Centro de Comandos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 1 · KPIs en vivo del día */}
      <RealtimeKPIs />

      {/* 2 · Lo que requiere acción hoy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActionInbox />
        <div className="ld-card p-4">
          <h3 className="font-jakarta font-bold text-sm text-ld-fg mb-3">Alertas</h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-ld-fg-muted py-4 text-center">Todo al día — sin alertas pendientes ✓</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <Link key={i} to={a.to} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:opacity-90 ${
                  a.type === 'danger' ? 'bg-red-500/10 text-red-600 border-red-500/25' :
                  a.type === 'warning' ? 'bg-amber-500/10 text-amber-700 border-amber-500/25' :
                  'bg-ld-action-soft text-ld-action border-ld-border'
                }`}>
                  {a.type === 'danger' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Clock className="w-4 h-4 flex-shrink-0" />}
                  <span className="flex-1">{a.msg}</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3 · KPIs del negocio — clickeables */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <ClickableKPI
          title="Ventas Web (mes)"
          value={loading ? '...' : ventasWebMes > 0 ? `$${(ventasWebMes / 1000000).toFixed(1)}M` : '$0'}
          subtitle={`${pedidosWebMes.length} pedidos`}
          icon={DollarSign}
          color="#0F8B6C" bg="rgba(15,139,108,0.1)"
          to="/admin/procesar-pedidos"
        />
        <ClickableKPI
          title="Ingresos B2B (mes)"
          value={loading ? '...' : ingresosB2BMes > 0 ? `$${(ingresosB2BMes / 1000000).toFixed(1)}M` : '$0'}
          subtitle={`${propuestasAceptadasMes.length} propuestas aceptadas`}
          icon={Target}
          color="#0F8B6C" bg="rgba(15,139,108,0.1)"
          to="/admin/propuestas"
        />
        <ClickableKPI
          title="Leads B2B activos"
          value={loading ? '...' : b2bLeads.filter(l => !['Aceptado', 'Perdido'].includes(l.status)).length}
          subtitle={`${b2bLeadsCalientes} calientes (≥70)`}
          icon={Users}
          color="#0E7490" bg="rgba(14,116,144,0.1)"
          to="/admin/pipeline"
        />
        <ClickableKPI
          title="Producción activa"
          value={loading ? '...' : ordenesActivas}
          subtitle={ordenesUrgentes > 0 ? `${ordenesUrgentes} urgentes` : 'Sin urgencias'}
          icon={Factory}
          color={ordenesUrgentes > 0 ? '#D96B4D' : '#0F8B6C'}
          bg={ordenesUrgentes > 0 ? 'rgba(217,107,77,0.1)' : 'rgba(15,139,108,0.1)'}
          to="/admin/operaciones"
        />
        <ClickableKPI
          title="Tiendas hoy"
          value={loading ? '...' : ventasHoy > 0 ? `$${(ventasHoy / 1000).toFixed(0)}K` : '$0'}
          subtitle={`Mes: $${(totalVentasMes / 1000).toFixed(0)}K`}
          icon={Store}
          color="#7C3AED" bg="rgba(124,58,237,0.1)"
          to="/admin/tiendas"
        />
        <ClickableKPI
          title="Clientes (LTV)"
          value={loading ? '...' : `$${(totalLTV / 1000000).toFixed(1)}M`}
          subtitle={`${clientesVIP} VIP${clientesEnRiesgo > 0 ? ` · ${clientesEnRiesgo} en riesgo` : ''}`}
          icon={UserCheck}
          color={clientesEnRiesgo > 0 ? '#D96B4D' : '#0F8B6C'}
          bg={clientesEnRiesgo > 0 ? 'rgba(217,107,77,0.1)' : 'rgba(15,139,108,0.1)'}
          to="/admin/clientes"
        />
      </div>

      {/* 4 · Gráficos */}
      <DashboardCharts ingresosMensuales={ingresosMensuales} canalMix={canalMix} kpiSemanal={kpiSemanal} />

      {/* 5 · Accesos rápidos */}
      <section>
        <h2 className="font-jakarta font-bold text-lg text-ld-fg mb-3">Accesos rápidos</h2>
        <AccesosRapidosGrid />
      </section>
    </div>
  );
}
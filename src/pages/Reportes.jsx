import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  DollarSign, TrendingUp, Users, Package, Leaf, BarChart3,
  Download, Sparkles, Loader2, RefreshCw, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CLP = (n) => `$${(n || 0).toLocaleString("es-CL")}`;
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) : "0.0";

const COLORS = ["#0F8B6C", "#D96B4D", "#4B4F54", "#A7D9C9", "#E7D8C6", "#3b82f6", "#f59e0b", "#9333ea"];

function KpiCard({ label, value, sub, icon: Icon, color, up }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {up !== undefined && (
          <span className={`text-xs flex items-center gap-0.5 font-medium ${up ? "text-green-600" : "text-red-500"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-poppins font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
      <h2 className="font-poppins font-semibold text-sm mb-4 text-foreground">{title}</h2>
      {children}
    </div>
  );
}

export default function Reportes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [pedidos, ventas, leads, cotizaciones, ordenes, movimientos, okrs, clientes, b2bLeads, propuestas] = await Promise.all([
      base44.entities.PedidoWeb.list("-created_date", 500),
      base44.entities.VentaTienda.list("-created_date", 500),
      base44.entities.Lead.list("-created_date", 300),
      base44.entities.Cotizacion.list("-created_date", 300),
      base44.entities.OrdenProduccion.list("-created_date", 300),
      base44.entities.MovimientoCaja.list("-created_date", 500),
      base44.entities.OKR.list("-created_date", 100),
      base44.entities.Cliente.list("-created_date", 200),
      base44.entities.B2BLead.list("-created_date", 200),
      base44.entities.CorporateProposal.list("-created_date", 200),
    ]);

    // Ventas por canal
    const ventasCanal = [
      { canal: "Web", total: pedidos.reduce((s, p) => s + (p.total || 0), 0), count: pedidos.length },
      { canal: "Tienda", total: ventas.reduce((s, v) => s + (v.total || 0), 0), count: ventas.length },
    ];

    // Ventas mensuales (últimos 6 meses)
    const meses = {};
    [...pedidos, ...ventas].forEach(v => {
      const fecha = v.fecha || v.created_date || "";
      const mes = fecha.slice(0, 7);
      if (!mes) return;
      if (!meses[mes]) meses[mes] = { mes, ingreso: 0, unidades: 0 };
      meses[mes].ingreso += v.total || 0;
      meses[mes].unidades += v.cantidad || 1;
    });
    const ventasMensuales = Object.values(meses).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-6).map(m => ({
      ...m,
      mes: new Date(m.mes + "-01").toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
    }));

    // Pipeline leads
    const pipelineLeads = {};
    [...leads].forEach(l => { pipelineLeads[l.estado] = (pipelineLeads[l.estado] || 0) + 1; });
    const pipelineData = Object.entries(pipelineLeads).map(([name, value]) => ({ name, value }));

    // Producción por estado
    const prodEstados = {};
    ordenes.forEach(o => { prodEstados[o.estado] = (prodEstados[o.estado] || 0) + 1; });
    const prodData = Object.entries(prodEstados).map(([name, value]) => ({ name, value }));

    // Financiero
    const ingresos = movimientos.filter(m => m.tipo === "Ingreso").reduce((s, m) => s + (m.monto || 0), 0);
    const egresos = movimientos.filter(m => m.tipo === "Egreso").reduce((s, m) => s + (m.monto || 0), 0);
    const flujoNeto = ingresos - egresos;

    // Egresos por categoría
    const egresosCat = {};
    movimientos.filter(m => m.tipo === "Egreso").forEach(m => {
      egresosCat[m.categoria] = (egresosCat[m.categoria] || 0) + m.monto;
    });
    const egresosCatData = Object.entries(egresosCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // OKRs progreso
    const okrData = okrs.slice(0, 8).map(o => ({
      name: o.resultado_clave?.slice(0, 30) || o.objetivo?.slice(0, 30),
      progreso: Math.min(100, Math.round(((o.valor_actual || 0) / (o.valor_meta || 1)) * 100)),
      estado: o.estado,
    }));

    // KPIs top
    const totalVentas = ventasCanal.reduce((s, v) => s + v.total, 0);
    const leadsCalientes = b2bLeads.filter(l => (l.lead_score || 0) >= 70).length;
    const propuestasAceptadas = propuestas.filter(p => p.status === "Aceptada").length;
    const clientesActivos = clientes.filter(c => c.estado === "Activo" || c.estado === "VIP").length;
    const ordenesPendientes = ordenes.filter(o => !["Despachado"].includes(o.estado)).length;
    const okrAvg = okrs.length ? Math.round(okrs.reduce((s, o) => s + Math.min(100, ((o.valor_actual || 0) / (o.valor_meta || 1)) * 100), 0) / okrs.length) : 0;

    setData({
      ventasCanal, ventasMensuales, pipelineData, prodData,
      egresosCatData, okrData,
      kpis: { totalVentas, ingresos, egresos, flujoNeto, leadsCalientes, propuestasAceptadas, clientesActivos, ordenesPendientes, okrAvg },
      raw: { pedidos, ventas, leads, ordenes, movimientos, okrs, b2bLeads, propuestas }
    });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const generarAnalisisIA = async () => {
    if (!data) return;
    setLoadingAi(true);
    const { kpis, raw } = data;
    const prompt = `Eres el CFO de Peyu Chile, empresa manufacturera de accesorios de plástico reciclado. Analiza estos datos de negocio y entrega un resumen ejecutivo en español, en 4-5 bullets concisos con insights accionables:

- Ventas totales: ${CLP(kpis.totalVentas)}
- Ingresos caja: ${CLP(kpis.ingresos)} | Egresos: ${CLP(kpis.egresos)} | Flujo neto: ${CLP(kpis.flujoNeto)}
- Clientes activos: ${kpis.clientesActivos}
- Leads B2B calientes (≥70pts): ${kpis.leadsCalientes}
- Propuestas corporativas aceptadas: ${kpis.propuestasAceptadas} de ${raw.propuestas.length}
- Órdenes de producción activas: ${kpis.ordenesPendientes}
- OKRs promedio avance: ${kpis.okrAvg}%
- Pedidos web: ${raw.pedidos.length} | Ventas tienda: ${raw.ventas.length}

Enfócate en riesgos, oportunidades y recomendaciones concretas para los próximos 30 días.`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiAnalysis(res);
    setLoadingAi(false);
  };

  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]).join(",");
    const body = rows.map(r => Object.values(r).map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  const { kpis, ventasCanal, ventasMensuales, pipelineData, prodData, egresosCatData, okrData, raw } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold">Reportes & Análisis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Dashboard ejecutivo · datos en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </Button>
          <Button size="sm" onClick={generarAnalisisIA} disabled={loadingAi}
            className="gap-2 text-white" style={{ background: "#0F8B6C" }}>
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Análisis IA
          </Button>
        </div>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-[#0F8B6C]/10 to-[#A7D9C9]/20 border border-[#0F8B6C]/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#0F8B6C]" />
            <span className="font-poppins font-semibold text-sm text-[#0F8B6C]">Análisis Ejecutivo IA</span>
          </div>
          <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{aiAnalysis}</div>
        </div>
      )}

      {/* KPIs top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Ventas Totales" value={CLP(kpis.totalVentas)} icon={DollarSign} color="#0F8B6C" up={true} />
        <KpiCard label="Flujo Neto Caja" value={CLP(kpis.flujoNeto)} icon={TrendingUp} color={kpis.flujoNeto >= 0 ? "#0F8B6C" : "#D96B4D"} up={kpis.flujoNeto >= 0} />
        <KpiCard label="Clientes Activos" value={kpis.clientesActivos} icon={Users} color="#3b82f6" />
        <KpiCard label="OKRs Avance" value={`${kpis.okrAvg}%`} icon={BarChart3} color="#f59e0b" sub={`${kpis.okrAvg >= 70 ? "En camino ✓" : "Atención requerida"}`} />
        <KpiCard label="Leads Calientes B2B" value={kpis.leadsCalientes} icon={TrendingUp} color="#D96B4D" />
        <KpiCard label="Propuestas Aceptadas" value={kpis.propuestasAceptadas} icon={BarChart3} color="#9333ea" sub={`de ${raw.propuestas.length} enviadas`} />
        <KpiCard label="OPs Activas" value={kpis.ordenesPendientes} icon={Package} color="#4B4F54" />
        <KpiCard label="Ingresos Caja" value={CLP(kpis.ingresos)} icon={DollarSign} color="#10b981" sub={`Egresos: ${CLP(kpis.egresos)}`} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="📈 Ventas Mensuales (últimos 6 meses)">
          {ventasMensuales.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v => CLP(v)} />
                <Line type="monotone" dataKey="ingreso" stroke="#0F8B6C" strokeWidth={2.5} dot={{ r: 4 }} name="Ingreso" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos de ventas aún</p>
          )}
          <div className="flex justify-end mt-2">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
              onClick={() => exportCSV(ventasMensuales, "ventas-mensuales.csv")}>
              <Download className="w-3 h-3" /> CSV
            </Button>
          </div>
        </Section>

        <Section title="💰 Egresos por Categoría">
          {egresosCatData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={egresosCatData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={v => CLP(v)} />
                <Bar dataKey="value" fill="#D96B4D" radius={[0, 4, 4, 0]} name="Egreso" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin movimientos de caja aún</p>
          )}
        </Section>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="🏭 Ventas por Canal">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ventasCanal} dataKey="total" nameKey="canal" cx="50%" cy="50%" outerRadius={65} label={({ canal, percent }) => `${canal} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {ventasCanal.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={v => CLP(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around text-xs text-muted-foreground mt-1">
            {ventasCanal.map((v, i) => (
              <div key={i} className="text-center">
                <div className="w-2.5 h-2.5 rounded-full inline-block mr-1" style={{ background: COLORS[i] }} />
                {v.canal}: {CLP(v.total)}
              </div>
            ))}
          </div>
        </Section>

        <Section title="🎯 Pipeline Leads">
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name.split(" ")[0]} (${value})`} labelLine={false}>
                  {pipelineData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin leads aún</p>
          )}
        </Section>

        <Section title="🔧 Producción por Estado">
          {prodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={prodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4B4F54" radius={[4, 4, 0, 0]} name="Órdenes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sin órdenes aún</p>
          )}
        </Section>
      </div>

      {/* OKRs */}
      {okrData.length > 0 && (
        <Section title="🏆 Avance OKRs">
          <div className="space-y-3">
            {okrData.map((o, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-48 text-xs text-muted-foreground truncate shrink-0">{o.name}</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${o.progreso}%`, background: o.progreso >= 70 ? "#0F8B6C" : o.progreso >= 40 ? "#f59e0b" : "#D96B4D" }}
                  />
                </div>
                <span className="text-xs font-semibold w-10 text-right">{o.progreso}%</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                  o.estado === "Completado" ? "bg-green-100 text-green-700" :
                  o.estado === "En riesgo" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{o.estado}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Export */}
      <div className="bg-muted/40 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Exportar datos</p>
          <p className="text-xs text-muted-foreground">Descarga los datos en CSV para Excel o Google Sheets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Pedidos Web", data: raw.pedidos, file: "pedidos-web.csv" },
            { label: "Ventas Tienda", data: raw.ventas, file: "ventas-tienda.csv" },
            { label: "Leads", data: raw.leads, file: "leads.csv" },
            { label: "Caja", data: raw.movimientos, file: "movimientos-caja.csv" },
          ].map(({ label, data: d, file }) => (
            <Button key={file} size="sm" variant="outline" className="gap-1.5 text-xs"
              onClick={() => exportCSV(d, file)} disabled={!d.length}>
              <Download className="w-3 h-3" /> {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Recycle, Target, TrendingUp, Award, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";

const fmtCLP = (v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;

// KPIs Blueprint ESG Peyu (metas 90 días)
const ESG_METAS = [
  { kpi: '% Materia prima reciclada', actual: 85, meta: 100, unidad: '%', ok: v => v >= 90 },
  { kpi: 'Proveedores certificados ESG', actual: 2, meta: 5, unidad: 'prov', ok: v => v >= 4 },
  { kpi: 'Scrap promedio planta (%)', actual: 4.2, meta: 3.0, unidad: '%', ok: v => v <= 3, invert: true },
  { kpi: 'CO₂ evitado estimado (kg/mes)', actual: 320, meta: 500, unidad: 'kg', ok: v => v >= 400 },
  { kpi: 'Packaging reciclable/compostable', actual: 60, meta: 100, unidad: '%', ok: v => v >= 80 },
  { kpi: 'Productos con sello sostenible', actual: 4, meta: 9, unidad: 'SKUs', ok: v => v >= 7 },
];

const RADAR_DATA = [
  { subject: 'Materia Prima', A: 85, fullMark: 100 },
  { subject: 'Certificaciones', A: 40, fullMark: 100 },
  { subject: 'Scrap', A: 70, fullMark: 100 },
  { subject: 'Packaging', A: 60, fullMark: 100 },
  { subject: 'Comunicación', A: 50, fullMark: 100 },
  { subject: 'Proveedores', A: 55, fullMark: 100 },
];

const HOJA_RUTA = [
  { mes: 'Mes 1', acciones: ['Auditar % real de reciclado por SKU', 'Mapear 5 proveedores con certificación', 'Medir scrap base real por inyectora'], estado: 'En curso' },
  { mes: 'Mes 2', acciones: ['Migrar packaging a 100% reciclable', 'Publicar policy ESG en web', 'Solicitar certificación PEFC / ISO 14001'], estado: 'Pendiente' },
  { mes: 'Mes 3', acciones: ['Primer reporte ESG público', 'Postular a sello "Producto Sostenible" SERCOTEC', 'Medir huella de carbono estimada'], estado: 'Pendiente' },
];

export default function ESG() {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [ocs, setOcs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Producto.list('-created_date', 100),
      base44.entities.Proveedor.list('-created_date', 100),
      base44.entities.OrdenProduccion.list('-created_date', 200),
      base44.entities.OrdenCompra.list('-fecha_emision', 200),
    ]).then(([p, prov, op, oc]) => {
      setProductos(p); setProveedores(prov); setOrdenes(op); setOcs(oc);
      setLoading(false);
    });
  }, []);

  // Métricas reales
  const prodReciclados = productos.filter(p => p.material === 'Plástico 100% Reciclado').length;
  const pctReciclado = productos.length > 0 ? Math.round((prodReciclados / productos.length) * 100) : 0;
  const provCertificados = proveedores.filter(p => p.certificacion_reciclado).length;
  const provMateriales = proveedores.filter(p => p.categoria === 'Material Reciclado').length;
  const scrapPromedio = ordenes.filter(o => o.scrap_pct).length > 0
    ? (ordenes.filter(o => o.scrap_pct).reduce((s, o) => s + o.scrap_pct, 0) / ordenes.filter(o => o.scrap_pct).length).toFixed(1)
    : null;
  const ocsRecicladas = ocs.filter(o => o.es_material_reciclado).length;
  const ocsCertificadas = ocs.filter(o => o.certificado_reciclado).length;
  const pctOCsRecicladas = ocs.length > 0 ? Math.round((ocsRecicladas / ocs.length) * 100) : 0;

  // Score ESG estimado (0-100)
  const scoreEsg = Math.round((
    (pctReciclado * 0.30) +
    (Math.min(100, (provCertificados / 5) * 100) * 0.20) +
    (scrapPromedio ? Math.max(0, (5 - parseFloat(scrapPromedio)) / 5 * 100) * 0.20 : 50 * 0.20) +
    (pctOCsRecicladas * 0.15) +
    40 * 0.15  // packaging base
  ));

  const kpisReales = [
    { kpi: '% Productos material reciclado', actual: pctReciclado, meta: 100, unidad: '%' },
    { kpi: 'Proveedores mat. certificados ESG', actual: provCertificados, meta: 5, unidad: 'prov' },
    { kpi: 'OCs de material reciclado', actual: pctOCsRecicladas, meta: 80, unidad: '%' },
    { kpi: 'Scrap promedio planta', actual: scrapPromedio ? parseFloat(scrapPromedio) : null, meta: 3.0, unidad: '%', invert: true },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
            <Leaf className="w-6 h-6" style={{ color: '#0F8B6C' }} />
            Sostenibilidad ESG
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Métricas ambientales · Trazabilidad reciclado · Hoja de ruta verde</p>
        </div>
        <div className="text-center bg-white rounded-2xl px-6 py-3 border-2 shadow-sm" style={{ borderColor: '#0F8B6C' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Score ESG Peyu</p>
          <p className="text-3xl font-poppins font-bold" style={{ color: scoreEsg >= 70 ? '#0F8B6C' : scoreEsg >= 50 ? '#f59e0b' : '#D96B4D' }}>
            {loading ? '…' : scoreEsg}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
        </div>
      </div>

      {/* KPIs reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '% Prod. Reciclado', value: `${pctReciclado}%`, sub: `${prodReciclados}/${productos.length} SKUs`, color: pctReciclado >= 80 ? '#0F8B6C' : '#f59e0b', icon: Recycle },
          { label: 'Prov. Certificados', value: provCertificados, sub: `de ${provMateriales} de mat. reciclado`, color: provCertificados >= 3 ? '#0F8B6C' : '#D96B4D', icon: Award },
          { label: 'OCs Sostenibles', value: `${pctOCsRecicladas}%`, sub: `${ocsRecicladas} / ${ocs.length} OCs`, color: pctOCsRecicladas >= 60 ? '#0F8B6C' : '#f59e0b', icon: Package },
          { label: 'Scrap Promedio', value: scrapPromedio ? `${scrapPromedio}%` : 'N/D', sub: scrapPromedio ? (parseFloat(scrapPromedio) <= 3 ? '✓ Bajo meta' : '⚠ Sobre meta 3%') : 'Sin datos', color: scrapPromedio && parseFloat(scrapPromedio) <= 3 ? '#0F8B6C' : '#D96B4D', icon: Target },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <Icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <p className="font-poppins font-bold text-2xl" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="bg-muted">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kpis">KPIs Blueprint</TabsTrigger>
          <TabsTrigger value="hoja">Hoja de Ruta</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD ── */}
        <TabsContent value="dashboard" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Score ESG por Dimensión</h3>
              <p className="text-xs text-muted-foreground mb-4">Evaluación estimada · Escala 0-100</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar name="Peyu" dataKey="A" stroke="#0F8B6C" fill="#0F8B6C" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Metas ESG · 90 días</h3>
              <p className="text-xs text-muted-foreground mb-4">% avance hacia target blueprint</p>
              <div className="space-y-3">
                {ESG_METAS.map((m, i) => {
                  const pct = m.invert
                    ? Math.min(100, Math.max(0, Math.round((m.meta / m.actual) * 100)))
                    : Math.min(100, Math.round((m.actual / m.meta) * 100));
                  const ok = m.ok(m.actual);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{m.kpi}</span>
                        <span className="font-medium" style={{ color: ok ? '#0F8B6C' : '#D96B4D' }}>
                          {m.actual}{m.unidad} → meta {m.meta}{m.unidad}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ok ? '#0F8B6C' : '#f59e0b' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Declaración ESG */}
          <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#0F8B6C' }} />
              <div>
                <h3 className="font-poppins font-semibold text-sm" style={{ color: '#0F8B6C' }}>Compromiso ESG Peyu</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Peyu fabrica con <strong>plástico 100% reciclado post-consumo</strong> y fibra de trigo compostable. 
                  Cada producto evita que el plástico llegue al vertedero. Meta 2026: <strong>100% de materia prima con trazabilidad certificada</strong>, 
                  packaging compostable y reporte ESG público trimestral.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── KPIs ── */}
        <TabsContent value="kpis" className="mt-4">
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">KPI</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Actual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Meta</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Avance</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {kpisReales.map((k, i) => {
                  const pct = k.actual !== null
                    ? k.invert
                      ? Math.min(100, Math.max(0, Math.round((k.meta / k.actual) * 100)))
                      : Math.min(100, Math.round((k.actual / k.meta) * 100))
                    : null;
                  const ok = k.actual !== null && (k.invert ? k.actual <= k.meta : k.actual >= k.meta * 0.9);
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{k.kpi}</td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: ok ? '#0F8B6C' : '#D96B4D' }}>
                        {k.actual !== null ? `${k.actual}${k.unidad}` : 'N/D'}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{k.meta}{k.unidad}</td>
                      <td className="px-4 py-3">
                        {pct !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ok ? '#0F8B6C' : '#f59e0b' }} />
                            </div>
                            <span className="text-xs font-medium w-8">{pct}%</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Sin datos</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {k.actual === null ? 'N/D' : ok ? '✓ En meta' : '⚠ En proceso'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {ESG_METAS.slice(4).map((k, i) => (
                  <tr key={`est-${i}`} className="border-b border-border last:border-0 bg-muted/10">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{k.kpi}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{k.actual}{k.unidad}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{k.meta}{k.unidad}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100,Math.round(k.actual/k.meta*100))}%`, background: '#A7D9C9' }} />
                        </div>
                        <span className="text-xs font-medium w-8">{Math.min(100,Math.round(k.actual/k.meta*100))}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Estimado</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── HOJA DE RUTA ── */}
        <TabsContent value="hoja" className="mt-4 space-y-4">
          {HOJA_RUTA.map((mes, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-poppins font-semibold">{mes.mes}</h3>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${mes.estado === 'En curso' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {mes.estado}
                </span>
              </div>
              <ul className="space-y-2">
                {mes.acciones.map((a, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span style={{ color: '#0F8B6C' }} className="mt-0.5 flex-shrink-0">
                      {mes.estado === 'En curso' ? '→' : '○'}
                    </span>
                    <span className="text-foreground">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
            <h3 className="font-poppins font-semibold text-sm mb-2" style={{ color: '#0F8B6C' }}>💡 Impacto ESG Estimado Anual</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-poppins font-bold" style={{ color: '#0F8B6C' }}>~3.8 ton</p>
                <p className="text-xs text-muted-foreground mt-1">Plástico reciclado/año procesado</p>
              </div>
              <div>
                <p className="text-2xl font-poppins font-bold" style={{ color: '#0F8B6C' }}>~9.6 ton</p>
                <p className="text-xs text-muted-foreground mt-1">CO₂ equivalente evitado/año</p>
              </div>
              <div>
                <p className="text-2xl font-poppins font-bold" style={{ color: '#0F8B6C' }}>+40K</p>
                <p className="text-xs text-muted-foreground mt-1">Productos sostenibles al mercado</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, DollarSign, Package, Zap, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Datos Blueprint (CLP) ───────────────────────────────────────────────────
const COSTOS_FIJOS = [
  { concepto: 'Sueldos (producción + admin)', monto: 3_200_000 },
  { concepto: 'Arriendo bodega/planta', monto: 800_000 },
  { concepto: 'Electricidad + servicios', monto: 450_000 },
  { concepto: 'Marketing digital', monto: 2_000_000 },
  { concepto: 'Plataformas e-commerce', monto: 150_000 },
  { concepto: 'Contabilidad / legales', monto: 200_000 },
  { concepto: 'Otros fijos', monto: 300_000 },
];

const COSTOS_VARIABLES = [
  { concepto: 'Material reciclado (pellet)', pct: 28, nota: '28% del precio venta' },
  { concepto: 'Packaging estándar', pct: 8, nota: '$200-400/u' },
  { concepto: 'Mano de obra directa', pct: 12, nota: 'inyección + laser' },
  { concepto: 'Scrap / rechazos (~5%)', pct: 5, nota: 'Meta: <3%' },
  { concepto: 'Comisión plataforma', pct: 5, nota: 'Shopify + Meli' },
  { concepto: 'Envío / despacho', pct: 4, nota: 'según zona' },
];

const ESCENARIOS = [
  {
    nombre: 'A — Pesimista',
    descripcion: 'Sin acción — Meta Ads sigue bajando',
    b2b_pedidos: 8,
    b2b_ticket: 800_000,
    b2c_ventas: 3_920_000,
    variables_fijos: { variables: 1_300_000, fijos: 6_110_000 },
    color: '#D96B4D',
    bg: '#fdf3f0',
  },
  {
    nombre: 'B — Base/Realista',
    descripcion: 'CRM + recorte Ads 30% + CPQ parcial',
    b2b_pedidos: 12,
    b2b_ticket: 800_000,
    b2c_ventas: 4_500_000,
    variables_fijos: { variables: 1_800_000, fijos: 6_500_000 },
    color: '#4B4F54',
    bg: '#f5f5f5',
  },
  {
    nombre: 'C — Optimista',
    descripcion: 'CPQ+portal B2B, marketing optimizado, planta >70%',
    b2b_pedidos: 16,
    b2b_ticket: 800_000,
    b2c_ventas: 6_000_000,
    variables_fijos: { variables: 2_400_000, fijos: 6_200_000 },
    color: '#0F8B6C',
    bg: '#f0faf7',
  },
  {
    nombre: 'Meta 12m',
    descripcion: 'Escala completa — Revenue +50% baseline',
    b2b_pedidos: 20,
    b2b_ticket: 1_000_000,
    b2c_ventas: 10_000_000,
    variables_fijos: { variables: 3_200_000, fijos: 6_200_000 },
    color: '#0F8B6C',
    bg: '#d4f5ed',
  },
];

const PRODUCTOS_MARGEN_DEFAULT = [
  { sku: 'SOPC-001', nombre: 'Soporte Celular PEYU', precio: 6990, costo: 3146, margen: 55.0 },
  { sku: 'SONB-001', nombre: 'Soporte Notebook PEYU', precio: 9990, costo: 4496, margen: 55.0 },
  { sku: 'LLAV-001', nombre: 'Llavero Soporte Celular', precio: 3990, costo: 1596, margen: 60.0 },
  { sku: 'POSAV-001', nombre: 'Posavasos Set x4', precio: 7990, costo: 3196, margen: 60.0 },
  { sku: 'CACH-001', nombre: 'Pack Cachos (6u)', precio: 25990, costo: 11696, margen: 55.0 },
  { sku: 'LAMP-001', nombre: 'Lámpara Chillka', precio: 23490, costo: 11275, margen: 52.0 },
  { sku: 'MACE-001', nombre: 'Macetero Ecológico', precio: 5990, costo: 2575, margen: 57.0 },
  { sku: 'KIT-ESCR-001', nombre: 'Kit Escritorio Corporativo', precio: 19990, costo: 9795, margen: 51.0 },
];

const COLORS = ['#0F8B6C', '#D96B4D', '#A7D9C9', '#4B4F54', '#E7D8C6', '#f97316'];

const fmtClp = (n) => `$${(n / 1_000_000).toFixed(1)}M`;
const fmtK = (n) => `$${(n / 1_000).toFixed(0)}K`;

function calcEscenario(e) {
  const ingresos = e.b2b_pedidos * e.b2b_ticket + e.b2c_ventas;
  const variables = e.variables_fijos ? e.variables_fijos.variables : ingresos * 0.62;
  const fijos = e.variables_fijos ? e.variables_fijos.fijos : COSTOS_FIJOS.reduce((s, c) => s + c.monto, 0);
  const utilidad = ingresos - variables - fijos;
  const margen = ingresos > 0 ? (utilidad / ingresos * 100).toFixed(1) : 0;
  return { ingresos, costoVariable: variables, costosFijos: fijos, utilidad, margen };
}

export default function Financiero() {
  const [escenarioSel, setEscenarioSel] = useState('Base');
  const [productosDB, setProductosDB] = useState([]);

  useEffect(() => {
    base44.entities.Producto.list('-precio_b2c', 50).then(data => {
      const activos = data.filter(p => p.precio_b2c > 0);
      if (activos.length > 0) setProductosDB(activos);
    });
  }, []);

  const productosMargen = productosDB.length > 0
    ? productosDB.map(p => ({
        sku: p.sku,
        nombre: p.nombre,
        precio: p.precio_b2c,
        costo: Math.round(p.precio_b2c * 0.43),
        margen: 57,
      }))
    : PRODUCTOS_MARGEN_DEFAULT;

  const totalFijos = COSTOS_FIJOS.reduce((s, c) => s + c.monto, 0);
  const escActual = ESCENARIOS.find(e => e.nombre === escenarioSel);
  const calc = calcEscenario(escActual);

  const breakeven = Math.ceil(totalFijos / (1 - 0.62) / 1_000_000 * 10) / 10;

  const chartData = ESCENARIOS.map(e => {
    const c = calcEscenario(e);
    return {
      nombre: e.nombre,
      ingresos: Math.round(c.ingresos / 1000),
      costos: Math.round((c.costoVariable + c.costosFijos) / 1000),
      utilidad: Math.round(c.utilidad / 1000),
    };
  });

  const pieData = COSTOS_FIJOS.map(c => ({ name: c.concepto.split(' ').slice(0, 2).join(' '), value: c.monto }));

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-foreground">Estructura Financiera</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Costos fijos · Márgenes · Escenarios · Punto de equilibrio
        </p>
      </div>

      {/* Punto equilibrio banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Costos Fijos / Mes</p>
          <p className="text-2xl font-poppins font-bold mt-1" style={{ color: '#D96B4D' }}>{fmtClp(totalFijos)}</p>
          <p className="text-xs text-muted-foreground mt-1">{COSTOS_FIJOS.length} ítems</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Punto de Equilibrio</p>
          <p className="text-2xl font-poppins font-bold mt-1" style={{ color: '#4B4F54' }}>${breakeven}M CLP</p>
          <p className="text-xs text-muted-foreground mt-1">ingresos mínimos/mes</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Margen Bruto Objetivo</p>
          <p className="text-2xl font-poppins font-bold mt-1" style={{ color: '#0F8B6C' }}>38%</p>
          <p className="text-xs text-muted-foreground mt-1">después costos variables ~62%</p>
        </div>
      </div>

      <Tabs defaultValue="escenarios">
        <TabsList className="bg-muted">
          <TabsTrigger value="escenarios">Escenarios</TabsTrigger>
          <TabsTrigger value="costos">Estructura Costos</TabsTrigger>
          <TabsTrigger value="margenes">Márgenes SKU</TabsTrigger>
        </TabsList>

        {/* ── ESCENARIOS ── */}
        <TabsContent value="escenarios" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ESCENARIOS.map(e => {
              const c = calcEscenario(e);
              const isSelected = escenarioSel === e.nombre;
              return (
                <button
                  key={e.nombre}
                  onClick={() => setEscenarioSel(e.nombre)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-current shadow-md' : 'border-border hover:border-current/30'}`}
                  style={{ background: e.bg, borderColor: isSelected ? e.color : undefined }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: e.color }}>{e.nombre}</p>
                  <p className="font-poppins font-bold text-lg mt-1 text-foreground">{fmtClp(c.ingresos)}</p>
                  <p className="text-xs text-muted-foreground">{e.b2b_pedidos} pedidos B2B</p>
                  <div className={`mt-2 text-xs font-semibold ${c.utilidad >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {c.utilidad >= 0 ? '+' : ''}{fmtClp(c.utilidad)} ({c.margen}%)
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle escenario seleccionado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-1">Desglose — Escenario {escenarioSel}</h3>
              <p className="text-xs text-muted-foreground mb-4">{escActual.descripcion}</p>
              <p className="text-xs text-muted-foreground mb-4">B2B: {escActual.b2b_pedidos} × {fmtK(escActual.b2b_ticket)} · B2C: {fmtClp(escActual.b2c_ventas)}</p>
              <div className="space-y-3">
                {[
                  { label: 'Ingresos Totales', val: calc.ingresos, color: '#0F8B6C' },
                  { label: 'Costos Variables', val: -calc.costoVariable, color: '#D96B4D' },
                  { label: 'Costos Fijos', val: -calc.costosFijos, color: '#D96B4D' },
                  { label: 'Utilidad Neta', val: calc.utilidad, color: calc.utilidad >= 0 ? '#0F8B6C' : '#D96B4D', bold: true },
                ].map((r, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${r.bold ? 'border-t border-border font-semibold' : ''}`}>
                    <span className="text-sm text-foreground">{r.label}</span>
                    <span className="font-poppins font-bold" style={{ color: r.color }}>
                      {r.val < 0 ? '-' : ''}{fmtClp(Math.abs(r.val))}
                    </span>
                  </div>
                ))}
                <div className="mt-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                  <strong>Margen neto:</strong> {calc.margen}% &nbsp;·&nbsp;
                  <strong>ROI marketing:</strong> {((calc.utilidad / 2_000_000) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-4">Comparativa Escenarios (CLP K)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}K`]} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#A7D9C9" name="Ingresos" radius={[3,3,0,0]} />
                  <Bar dataKey="costos" fill="#E7D8C6" name="Costos" radius={[3,3,0,0]} />
                  <Bar dataKey="utilidad" fill="#0F8B6C" name="Utilidad" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ── COSTOS ── */}
        <TabsContent value="costos" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
              <h3 className="font-poppins font-semibold mb-4">Costos Fijos Mensuales</h3>
              <div className="space-y-2">
                {COSTOS_FIJOS.map((c, i) => {
                  const pct = (c.monto / totalFijos * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{c.concepto}</span>
                          <span className="font-medium text-muted-foreground">{fmtK(c.monto)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
                <div className="mt-3 pt-3 border-t border-border flex justify-between font-semibold">
                  <span>TOTAL FIJOS</span>
                  <span style={{ color: '#D96B4D' }}>{fmtClp(totalFijos)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-poppins font-semibold mb-4">Distribución Costos Fijos</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [fmtK(v)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-poppins font-semibold mb-3">Costos Variables por Unidad</h3>
                <div className="space-y-2">
                  {COSTOS_VARIABLES.map((v, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                      <div>
                        <p className="text-foreground">{v.concepto}</p>
                        <p className="text-xs text-muted-foreground">{v.nota}</p>
                      </div>
                      <span className="font-semibold text-muted-foreground">{v.pct}%</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold pt-2 text-sm">
                    <span>Total variables</span>
                    <span style={{ color: '#D96B4D' }}>62%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── MÁRGENES SKU ── */}
        <TabsContent value="margenes" className="space-y-4 mt-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-1">Margen por SKU (B2C)</h3>
            <p className="text-xs text-muted-foreground mb-4">Precio venta · Costo directo · Margen bruto estimado</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 font-medium">SKU</th>
                    <th className="text-left pb-2 font-medium">Producto</th>
                    <th className="text-right pb-2 font-medium">Precio B2C</th>
                    <th className="text-right pb-2 font-medium">Costo</th>
                    <th className="text-right pb-2 font-medium">Margen</th>
                    <th className="text-left pb-2 font-medium pl-4">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {productosMargen.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="py-3 font-medium text-foreground">{p.nombre}</td>
                      <td className="py-3 text-right">${p.precio.toLocaleString('es-CL')}</td>
                      <td className="py-3 text-right text-muted-foreground">${p.costo.toLocaleString('es-CL')}</td>
                      <td className="py-3 text-right font-semibold" style={{ color: p.margen >= 55 ? '#0F8B6C' : '#D96B4D' }}>
                        {p.margen}%
                      </td>
                      <td className="py-3 pl-4">
                        <div className="h-1.5 bg-muted rounded-full w-24">
                          <div className="h-full rounded-full" style={{ width: `${p.margen}%`, background: p.margen >= 55 ? '#0F8B6C' : '#D96B4D' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
              💡 <strong>Meta:</strong> Margen bruto &gt;55% en todos los SKUs. Revisar costo de material en SKUs por debajo del target.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
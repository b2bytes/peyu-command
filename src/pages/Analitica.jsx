import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, Scatter, ZAxis
} from "recharts";

const escenarios = [
  { escenario: 'Pesimista (sin acción)', b2b: 6400, b2c: 3000, total: 9400, color: '#D96B4D' },
  { escenario: 'Actual', b2b: 6400, b2c: 4000, total: 10400, color: '#4B4F54' },
  { escenario: 'Base (90 días)', b2b: 9600, b2c: 4500, total: 14100, color: '#A7D9C9' },
  { escenario: 'Optimista (180 días)', b2b: 12800, b2c: 6000, total: 18800, color: '#0F8B6C' },
];

const radarData = [
  { subject: 'B2B Pipeline', actual: 40, objetivo: 90 },
  { subject: 'Automatización', actual: 5, objetivo: 80 },
  { subject: 'Canal Mix', actual: 10, objetivo: 70 },
  { subject: 'Tracking', actual: 20, objetivo: 95 },
  { subject: 'Contenido', actual: 30, objetivo: 80 },
  { subject: 'Util. Planta', actual: 35, objetivo: 70 },
];

const costBreakdown = [
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

export default function Analitica() {
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [campanas, setCampanas] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 200),
      base44.entities.Cotizacion.list('-created_date', 200),
      base44.entities.Campana.list('-created_date', 100),
    ]).then(([l, c, cam]) => { setLeads(l); setCotizaciones(c); setCampanas(cam); });
  }, []);

  // Funnel data
  const funnelData = [
    { stage: 'Consultas WA/día', value: 15 },
    { stage: 'Leads Reales', value: 3 },
    { stage: 'Cotizaciones', value: cotizaciones.length || 1 },
    { stage: 'Ganados', value: leads.filter(l => l.estado === 'Ganado').length || 0 },
  ];

  const totalCostos = costBreakdown.reduce((s, c) => s + c.valor, 0);
  const ingresos = 10400;
  const margen = ingresos - totalCostos;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-foreground">Analítica & Escenarios</h1>
        <p className="text-muted-foreground text-sm mt-1">Modelo financiero y KPIs estratégicos • Blueprint Peyu</p>
      </div>

      {/* Financial snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ingresos Mensuales Est.</p>
          <p className="text-3xl font-poppins font-bold mt-1" style={{ color: '#0F8B6C' }}>$10.4M</p>
          <p className="text-xs text-muted-foreground mt-1">B2B $6.4M + B2C $4.0M CLP</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Costos Fijos Mensuales</p>
          <p className="text-3xl font-poppins font-bold mt-1" style={{ color: '#4B4F54' }}>${totalCostos.toLocaleString('es-CL')}K</p>
          <p className="text-xs text-muted-foreground mt-1">CLP/mes (conservador)</p>
        </div>
        <div className={`bg-white rounded-2xl p-5 shadow-sm border ${margen > 0 ? 'border-green-200' : 'border-red-200'}`}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Margen Operacional</p>
          <p className="text-3xl font-poppins font-bold mt-1" style={{ color: margen > 0 ? '#0F8B6C' : '#D96B4D' }}>
            {margen > 0 ? '+' : ''}${margen.toLocaleString('es-CL')}K
          </p>
          <p className="text-xs text-muted-foreground mt-1">{((margen/ingresos)*100).toFixed(0)}% margen</p>
        </div>
      </div>

      {/* Escenarios + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Escenarios Financieros (CLP K/mes)</h3>
          <p className="text-xs text-muted-foreground mb-4">B2B + B2C proyectado a 180 días</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={escenarios} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="escenario" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [`$${v.toLocaleString('es-CL')}K`]} />
              <Legend />
              <Bar dataKey="b2b" fill="#0F8B6C" name="B2B" radius={[0,0,0,0]} stackId="a" />
              <Bar dataKey="b2c" fill="#A7D9C9" name="B2C" radius={[4,4,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Madurez de Capacidades</h3>
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

      {/* Funnel + Costos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-4">Embudo de Conversión B2B</h3>
          <div className="space-y-2">
            {funnelData.map((f, i) => {
              const pct = i === 0 ? 100 : Math.round(f.value / funnelData[0].value * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{f.stage}</span>
                    <span className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>{f.value}</span>
                  </div>
                  <div className="h-6 bg-muted rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg flex items-center pl-3 text-xs text-white font-medium transition-all"
                      style={{ width: `${Math.max(pct, 8)}%`, background: i === 0 ? '#4B4F54' : i === 1 ? '#D96B4D' : i === 2 ? '#A7D9C9' : '#0F8B6C' }}>
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: '#fdf3f0' }}>
            <p className="font-medium" style={{ color: '#D96B4D' }}>⚠️ Conversión 3.3% → Meta 7%</p>
            <p className="text-muted-foreground mt-1">80% de consultas son no comerciales. Implementar triage WhatsApp.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-4">Breakdown de Costos Fijos</h3>
          <div className="space-y-2">
            {costBreakdown.map((c, i) => {
              const pct = Math.round(c.valor / totalCostos * 100);
              const isHigh = c.item === 'Meta Ads';
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground truncate">{c.item}</div>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isHigh ? '#D96B4D' : '#0F8B6C' }} />
                  </div>
                  <div className="w-20 text-xs text-right">
                    <span className="font-medium">${c.valor.toLocaleString('es-CL')}K</span>
                    <span className="text-muted-foreground ml-1">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="font-poppins font-bold" style={{ color: '#4B4F54' }}>${totalCostos.toLocaleString('es-CL')}K/mes</span>
          </div>
          <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: '#f0faf7' }}>
            <p className="font-medium" style={{ color: '#0F8B6C' }}>💡 Reasignar Meta Ads → reducir 30% = $600K de ahorro</p>
          </div>
        </div>
      </div>

      {/* Checklist acciones */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
        <h3 className="font-poppins font-semibold text-foreground mb-4">Checklist Blueprint — Primeros 14 días</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { ok: false, task: 'Activar GA4 + Meta CAPI server-side', impact: 'Tracking confiable en 7 días' },
            { ok: false, task: 'WhatsApp Business API + autoresponder', impact: 'Reducir consultas no comerciales -30%' },
            { ok: false, task: 'HubSpot CRM + pipeline B2B', impact: '100% leads registrados' },
            { ok: false, task: 'Plantilla CPQ en Google Sheets', impact: 'SLA cotización <24h' },
            { ok: false, task: 'Landing B2B en peyuchile.cl', impact: 'CTR objetivo 3-5%' },
            { ok: false, task: 'Google Search Ads keywords B2B', impact: 'Nuevo canal de adquisición' },
            { ok: false, task: 'Pausar Advantage+ sin A/B testing', impact: 'Ahorro inmediato CLP' },
            { ok: false, task: '3 reels/semana de producción', impact: 'Contenido para Meta + TikTok' },
            { ok: false, task: 'Email abandoned cart + welcome', impact: 'Recuperar +15% conversión web' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${item.ok ? 'bg-green-500 border-green-500' : 'border-muted-foreground/30'}`}>
                {item.ok && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.task}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
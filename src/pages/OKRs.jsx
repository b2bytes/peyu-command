import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Target, Plus, Edit2, Trash2, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, XCircle, ChevronRight, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AREAS = ["Comercial", "Marketing", "Producción", "Finanzas", "RRHH", "Operaciones", "Tecnología"];
const PERIODOS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];
const ESTADOS = ["En curso", "En riesgo", "Completado", "Cancelado", "Pendiente"];

const estadoConfig = {
  "Completado":  { color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 },
  "En curso":    { color: "text-blue-600",  bg: "bg-blue-100",  icon: TrendingUp },
  "En riesgo":   { color: "text-amber-600", bg: "bg-amber-100", icon: AlertTriangle },
  "Cancelado":   { color: "text-red-500",   bg: "bg-red-100",   icon: XCircle },
  "Pendiente":   { color: "text-gray-500",  bg: "bg-gray-100",  icon: Clock },
};

const areaColor = {
  "Comercial":   "#0F8B6C", "Marketing": "#D96B4D", "Producción": "#4B4F54",
  "Finanzas":    "#0F8B6C", "RRHH": "#6b7280", "Operaciones": "#f59e0b", "Tecnología": "#3b82f6",
};

// Blueprint OKRs: 90-day plan from PDF
const BLUEPRINT_OKRS = [
  // O1: Escalar ingresos B2B
  { objetivo: "O1: Escalar Ingresos B2B", resultado_clave: "Pedidos B2B: 8 → 12/mes", area: "Comercial", periodo: "Q2 2026", valor_inicial: 8, valor_meta: 12, valor_actual: 8, unidad: "pedidos/mes", estado: "En curso", responsable: "CEO", iniciativas: "Contratar Ejecutivo Comercial, campaña LinkedIn B2B, seguimiento pipeline 2x/semana", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O1: Escalar Ingresos B2B", resultado_clave: "Ticket promedio B2B: $800K → $1.2M CLP", area: "Comercial", periodo: "Q2 2026", valor_inicial: 800000, valor_meta: 1200000, valor_actual: 850000, unidad: "CLP", estado: "En curso", responsable: "CEO", iniciativas: "Upsell kit corporativo completo, propuesta de valor ESG, ROI calculator", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O1: Escalar Ingresos B2B", resultado_clave: "Conversión lead→venta: 3.3% → 7%", area: "Comercial", periodo: "Q2 2026", valor_inicial: 3.3, valor_meta: 7, valor_actual: 3.3, unidad: "%", estado: "En riesgo", responsable: "CEO", iniciativas: "Triage WhatsApp, SLA cotización <24h, seguimiento +2 touchpoints", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  // O2: B2C web
  { objetivo: "O2: Crecer Canal B2C Digital", resultado_clave: "Ventas web: $4M → $6M CLP/mes", area: "Marketing", periodo: "Q2 2026", valor_inicial: 4000000, valor_meta: 6000000, valor_actual: 4000000, unidad: "CLP/mes", estado: "En riesgo", responsable: "Community Manager", iniciativas: "Email flows, SEO, contenido UGC, reducir dependencia Meta Ads", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O2: Crecer Canal B2C Digital", resultado_clave: "ROAS Meta Ads: 1.8x → 3x", area: "Marketing", periodo: "Q2 2026", valor_inicial: 1.8, valor_meta: 3, valor_actual: 1.8, unidad: "ROAS", estado: "En riesgo", responsable: "Community Manager", iniciativas: "Pausar Advantage+, A/B testing creatividades, lookalike audiences", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O2: Crecer Canal B2C Digital", resultado_clave: "Seguidores Instagram: 0 → 10K activos", area: "Marketing", periodo: "Q2 2026", valor_inicial: 0, valor_meta: 10000, valor_actual: 0, unidad: "seguidores", estado: "En curso", responsable: "Community Manager", iniciativas: "3 reels/semana proceso fábrica, collab con creators, behind the scenes", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  // O3: Operaciones
  { objetivo: "O3: Optimizar Producción", resultado_clave: "Utilización planta: 35% → 70%", area: "Producción", periodo: "Q2 2026", valor_inicial: 35, valor_meta: 70, valor_actual: 35, unidad: "%", estado: "En curso", responsable: "Jefe Producción", iniciativas: "Planificación producción anticipada, 2do turno, eliminar tiempos muertos", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O3: Optimizar Producción", resultado_clave: "Scrap / Rechazo: < 3% mensual", area: "Producción", periodo: "Q2 2026", valor_inicial: 5, valor_meta: 3, valor_actual: 4.2, unidad: "%", estado: "En curso", responsable: "Jefe Producción", iniciativas: "Control calidad por turno, registro scrap por inyectora, entrenamiento", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O3: Optimizar Producción", resultado_clave: "Lead time B2B personalizado: 12d → 7d hábiles", area: "Producción", periodo: "Q2 2026", valor_inicial: 12, valor_meta: 7, valor_actual: 12, unidad: "días", estado: "Pendiente", responsable: "Jefe Producción", iniciativas: "Pre-stock materiales top SKUs, planificación láser dedicado, proceso packaging", fecha_inicio: "2026-04-15", fecha_cierre: "2026-06-30" },
  // O4: Finanzas
  { objetivo: "O4: Salud Financiera", resultado_clave: "Ingresos totales: $10.4M → $15M CLP/mes", area: "Finanzas", periodo: "Q2 2026", valor_inicial: 10400000, valor_meta: 15000000, valor_actual: 10400000, unidad: "CLP/mes", estado: "En curso", responsable: "CEO", iniciativas: "B2B x12 pedidos + B2C $6M + tiendas $1M", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  { objetivo: "O4: Salud Financiera", resultado_clave: "Costo adquisición cliente B2B: $75K → $35K CLP", area: "Finanzas", periodo: "Q2 2026", valor_inicial: 75000, valor_meta: 35000, valor_actual: 75000, unidad: "CLP/cliente", estado: "En riesgo", responsable: "CEO", iniciativas: "LinkedIn orgánico, referidos, ferias del sector", fecha_inicio: "2026-04-01", fecha_cierre: "2026-06-30" },
  // O5: Tecnología
  { objetivo: "O5: Digitalización Operacional", resultado_clave: "GA4 + Meta CAPI configurado y validado", area: "Tecnología", periodo: "Q2 2026", valor_inicial: 0, valor_meta: 100, valor_actual: 0, unidad: "% completo", estado: "Pendiente", responsable: "CEO / B2BYTES", iniciativas: "Implementar server-side tracking, eventos clave e-commerce", fecha_inicio: "2026-04-15", fecha_cierre: "2026-04-30" },
  { objetivo: "O5: Digitalización Operacional", resultado_clave: "WhatsApp Business API + autoresponder activo", area: "Tecnología", periodo: "Q2 2026", valor_inicial: 0, valor_meta: 100, valor_actual: 0, unidad: "% completo", estado: "Pendiente", responsable: "CEO / B2BYTES", iniciativas: "Integración API oficial, flujo triage automático, templates aprobados", fecha_inicio: "2026-04-20", fecha_cierre: "2026-05-15" },
  { objetivo: "O5: Digitalización Operacional", resultado_clave: "Sistema de gestión Peyu 100% operativo", area: "Tecnología", periodo: "Q2 2026", valor_inicial: 0, valor_meta: 100, valor_actual: 85, unidad: "% módulos activos", estado: "En curso", responsable: "B2BYTES", iniciativas: "Todos los módulos del Centro de Comando en producción", fecha_inicio: "2026-04-01", fecha_cierre: "2026-04-15" },
];

const fmtValor = (v, unidad) => {
  if (!v && v !== 0) return '—';
  if (unidad === 'CLP' || unidad === 'CLP/mes' || unidad === 'CLP/cliente') {
    return v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;
  }
  if (unidad === '%') return `${v}%`;
  if (unidad === 'ROAS') return `${v}x`;
  if (unidad === 'seguidores') return v >= 1000 ? `${(v/1000).toFixed(1)}K` : v;
  return `${v} ${unidad || ''}`;
};

const getPct = (okr) => {
  if (!okr.valor_meta || okr.valor_meta === okr.valor_inicial) return 0;
  const dir = okr.valor_meta > okr.valor_inicial ? 1 : -1;
  const range = Math.abs(okr.valor_meta - okr.valor_inicial);
  const progress = dir * (okr.valor_actual - okr.valor_inicial);
  return Math.min(100, Math.max(0, Math.round(progress / range * 100)));
};

const DEFAULTS = {
  objetivo: '', resultado_clave: '', area: 'Comercial', periodo: 'Q2 2026',
  valor_inicial: 0, valor_meta: 0, valor_actual: 0, unidad: '', estado: 'En curso', responsable: ''
};

function OKRCard({ okr, onEdit, onDelete }) {
  const pct = getPct(okr);
  const cfg = estadoConfig[okr.estado] || estadoConfig["En curso"];
  const Icon = cfg.icon;
  const barColor = pct >= 80 ? '#0F8B6C' : pct >= 50 ? '#f59e0b' : '#D96B4D';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
      okr.estado === 'En riesgo' ? 'border-amber-200' :
      okr.estado === 'Completado' ? 'border-green-200' : 'border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{okr.objetivo}</p>
          <p className="font-poppins font-semibold text-sm mt-0.5 leading-snug">{okr.resultado_clave}</p>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={() => onEdit(okr)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(okr.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3 inline mr-1" />{okr.estado}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{okr.area}</span>
        {okr.responsable && <span className="text-xs text-muted-foreground">👤 {okr.responsable}</span>}
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="flex justify-between text-xs mt-1 text-muted-foreground">
          <span>Inicio: {fmtValor(okr.valor_inicial, okr.unidad)}</span>
          <span className="font-medium" style={{ color: areaColor[okr.area] || '#0F8B6C' }}>
            Actual: {fmtValor(okr.valor_actual, okr.unidad)}
          </span>
          <span>Meta: {fmtValor(okr.valor_meta, okr.unidad)}</span>
        </div>
      </div>

      {okr.iniciativas && (
        <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5 line-clamp-2">
          🎯 {okr.iniciativas}
        </p>
      )}
    </div>
  );
}

export default function OKRs() {
  const [okrs, setOkrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [filterArea, setFilterArea] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterPeriodo, setFilterPeriodo] = useState('Q2 2026');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.OKR.list('-created_date', 100);
    setOkrs(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const seedBlueprint = async () => {
    setSeeding(true);
    for (const okr of BLUEPRINT_OKRS) {
      await base44.entities.OKR.create(okr);
    }
    setSeeding(false);
    loadData();
  };

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (o) => { setEditing(o); setForm(o); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.OKR.update(editing.id, form);
    else await base44.entities.OKR.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar OKR?')) return;
    await base44.entities.OKR.delete(id);
    loadData();
  };

  const filtered = okrs.filter(o =>
    (filterArea === 'todas' || o.area === filterArea) &&
    (filterEstado === 'todos' || o.estado === filterEstado) &&
    (filterPeriodo === 'todos' || o.periodo === filterPeriodo)
  );

  // Aggregate stats
  const completados = okrs.filter(o => o.estado === 'Completado').length;
  const enRiesgo = okrs.filter(o => o.estado === 'En riesgo').length;
  const avgPct = okrs.length > 0 ? Math.round(okrs.reduce((s, o) => s + getPct(o), 0) / okrs.length) : 0;

  // Group by objetivo for summary
  const objetivos = [...new Set(filtered.map(o => o.objetivo))];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">OKRs & Metas</h1>
          <p className="text-muted-foreground text-sm mt-1">Objectives & Key Results · Plan 90 días Blueprint Peyu</p>
        </div>
        <div className="flex gap-2">
          {okrs.length === 0 && (
            <Button onClick={seedBlueprint} disabled={seeding} variant="outline" className="gap-2 text-sm border-dashed">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {seeding ? 'Cargando...' : 'Cargar OKRs Blueprint'}
            </Button>
          )}
          <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />Nuevo OKR
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total KRs', value: okrs.length, color: '#0F8B6C' },
          { label: 'Completados', value: completados, color: '#0F8B6C' },
          { label: 'En Riesgo', value: enRiesgo, color: enRiesgo > 0 ? '#D96B4D' : '#9ca3af' },
          { label: 'Avance Promedio', value: `${avgPct}%`, color: avgPct >= 70 ? '#0F8B6C' : avgPct >= 40 ? '#f59e0b' : '#D96B4D' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="kr">
        <TabsList className="bg-muted">
          <TabsTrigger value="kr">Key Results</TabsTrigger>
          <TabsTrigger value="resumen">Resumen por Objetivo</TabsTrigger>
        </TabsList>

        <TabsContent value="kr" className="space-y-3 mt-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos períodos</SelectItem>
                {PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las áreas</SelectItem>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">{filtered.length} KRs</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : okrs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin OKRs registrados</p>
              <p className="text-sm mt-1">Carga los OKRs del blueprint o crea uno nuevo</p>
              <Button onClick={seedBlueprint} disabled={seeding} variant="outline" className="mt-4 gap-2">
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Cargar OKRs Blueprint
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(o => (
                <OKRCard key={o.id} okr={o} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          {objetivos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Sin OKRs para mostrar</div>
          ) : objetivos.map((obj, oi) => {
            const krs = filtered.filter(o => o.objetivo === obj);
            const avgO = Math.round(krs.reduce((s, k) => s + getPct(k), 0) / krs.length);
            const riesgo = krs.filter(k => k.estado === 'En riesgo').length;
            return (
              <div key={oi} className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-poppins font-semibold text-foreground">{obj}</h3>
                    <p className="text-xs text-muted-foreground">{krs.length} Key Results · {riesgo > 0 ? `${riesgo} en riesgo` : 'Sin alertas'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-poppins font-bold text-2xl" style={{ color: avgO >= 70 ? '#0F8B6C' : avgO >= 40 ? '#f59e0b' : '#D96B4D' }}>{avgO}%</p>
                    <p className="text-xs text-muted-foreground">avance</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full mb-4">
                  <div className="h-full rounded-full" style={{ width: `${avgO}%`, background: avgO >= 70 ? '#0F8B6C' : avgO >= 40 ? '#f59e0b' : '#D96B4D' }} />
                </div>
                <div className="space-y-2">
                  {krs.map((kr, ki) => {
                    const pct = getPct(kr);
                    const cfg = estadoConfig[kr.estado] || estadoConfig["En curso"];
                    return (
                      <div key={ki} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <p className="text-sm flex-1 text-foreground">{kr.resultado_clave}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} flex-shrink-0`}>{pct}%</span>
                        <button onClick={() => openEdit(kr)} className="p-1 hover:bg-muted rounded flex-shrink-0"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} OKR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><label className="text-xs font-medium text-muted-foreground">Objetivo (O)</label><Input value={form.objetivo||''} onChange={e=>setForm({...form,objetivo:e.target.value})} className="mt-1" placeholder="O1: Escalar ingresos B2B" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Resultado Clave (KR) *</label><Input value={form.resultado_clave||''} onChange={e=>setForm({...form,resultado_clave:e.target.value})} className="mt-1" placeholder="Pedidos B2B: 8 → 12/mes" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Área</label>
                <Select value={form.area||''} onValueChange={v=>setForm({...form,area:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Período</label>
                <Select value={form.periodo||''} onValueChange={v=>setForm({...form,periodo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div><label className="text-xs font-medium text-muted-foreground">Inicial</label><Input type="number" value={form.valor_inicial??''} onChange={e=>setForm({...form,valor_inicial:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Meta</label><Input type="number" value={form.valor_meta??''} onChange={e=>setForm({...form,valor_meta:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Actual</label><Input type="number" value={form.valor_actual??''} onChange={e=>setForm({...form,valor_actual:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Unidad</label><Input value={form.unidad||''} onChange={e=>setForm({...form,unidad:e.target.value})} className="mt-1" placeholder="%, CLP..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Responsable</label><Input value={form.responsable||''} onChange={e=>setForm({...form,responsable:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label><Input type="date" value={form.fecha_inicio||''} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Cierre</label><Input type="date" value={form.fecha_cierre||''} onChange={e=>setForm({...form,fecha_cierre:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Iniciativas / Acciones</label><textarea value={form.iniciativas||''} onChange={e=>setForm({...form,iniciativas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-20" placeholder="¿Cómo vamos a lograrlo?" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas / Obstáculos</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
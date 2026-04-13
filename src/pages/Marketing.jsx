import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Target, DollarSign, Users, Plus, Edit2, Trash2,
  Loader2, BarChart3, Megaphone, RefreshCw, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CLP = (n) => `$${(n || 0).toLocaleString("es-CL")}`;
const COLORS = ["#0F8B6C", "#D96B4D", "#4B4F54", "#A7D9C9", "#f59e0b", "#3b82f6", "#9333ea"];

const CANALES = ["Meta Ads", "Google Search", "TikTok Ads", "LinkedIn Ads", "Email", "WhatsApp", "Orgánico Instagram", "Orgánico TikTok"];
const OBJETIVOS = ["Awareness", "Consideración", "Conversión", "Retargeting", "B2B Lead Gen"];
const ESTADOS = ["Activa", "Pausada", "Finalizada", "En revisión", "Planificada"];
const TIPOS = ["Video Reel", "Imagen Estática", "Carrusel", "Story", "Texto", "Video largo"];

const DEFAULTS = {
  nombre: '', canal: 'Meta Ads', objetivo: 'Conversión', publico: '', estado: 'Planificada',
  fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: '',
  presupuesto_clp: 0, gasto_real_clp: 0, impresiones: 0, clics: 0,
  conversiones: 0, leads_generados: 0, roas: 0, cac_clp: 0, ctr_pct: 0,
  tipo_contenido: 'Video Reel', sku_promovido: '', notas: '',
};

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: (color || '#0F8B6C') + '20' }}>
          <Icon className="w-4 h-4" style={{ color: color || '#0F8B6C' }} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-poppins font-bold text-lg mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Marketing() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Campana.list('-fecha_inicio', 100);
    setCampanas(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) await base44.entities.Campana.update(editing.id, form);
    else await base44.entities.Campana.create(form);
    setShowModal(false);
    load();
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar campaña?')) return;
    await base44.entities.Campana.delete(id);
    load();
  };

  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };
  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };

  const generarAnalisisIA = async () => {
    setAiLoading(true);
    const activas = campanas.filter(c => c.estado === 'Activa');
    const totalGasto = campanas.reduce((s, c) => s + (c.gasto_real_clp || 0), 0);
    const totalConversiones = campanas.reduce((s, c) => s + (c.conversiones || 0), 0);
    const roasPromedio = campanas.reduce((s, c) => s + (c.roas || 0), 0) / (campanas.length || 1);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un experto en marketing digital para Peyu Chile, empresa de plástico reciclado. Analiza estas campañas y da 3 recomendaciones accionables en español:

- Campañas activas: ${activas.length}
- Gasto total: $${totalGasto.toLocaleString('es-CL')} CLP
- Conversiones totales: ${totalConversiones}
- ROAS promedio: ${roasPromedio.toFixed(1)}x
- Canales usados: ${[...new Set(campanas.map(c => c.canal))].join(', ')}

Contexto Peyu: dependen 100% de Meta Ads, no usan Google Ads ni email marketing, reciben 15 consultas WhatsApp diarias (solo 3 son leads reales). Meta objetivo +20% CVR, +30% leads B2B. El CEO admira la estrategia omnicanal de Greenglass.

Sé breve y concreto. Formato: 3 bullets con emoji.`
    });
    setAiInsight(res);
    setAiLoading(false);
  };

  // KPIs
  const totalGasto = campanas.reduce((s, c) => s + (c.gasto_real_clp || 0), 0);
  const totalPresupuesto = campanas.reduce((s, c) => s + (c.presupuesto_clp || 0), 0);
  const totalLeads = campanas.reduce((s, c) => s + (c.leads_generados || 0), 0);
  const totalConversiones = campanas.reduce((s, c) => s + (c.conversiones || 0), 0);
  const roasPromedio = campanas.length ? (campanas.reduce((s, c) => s + (c.roas || 0), 0) / campanas.length).toFixed(1) : 0;
  const activas = campanas.filter(c => c.estado === 'Activa').length;

  // Charts
  const gastoByCanal = CANALES.reduce((acc, canal) => {
    const total = campanas.filter(c => c.canal === canal).reduce((s, c) => s + (c.gasto_real_clp || 0), 0);
    if (total > 0) acc.push({ canal: canal.split(' ')[0], total });
    return acc;
  }, []);

  const estadosData = ESTADOS.reduce((acc, est) => {
    const count = campanas.filter(c => c.estado === est).length;
    if (count > 0) acc.push({ name: est, value: count });
    return acc;
  }, []);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold">Marketing & Campañas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Meta Ads · TikTok · Google · Email · WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </Button>
          <Button onClick={generarAnalisisIA} size="sm" disabled={aiLoading} className="gap-2 text-white" style={{ background: '#D96B4D' }}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Análisis IA
          </Button>
          <Button onClick={openNew} size="sm" className="gap-2 text-white" style={{ background: '#0F8B6C' }}>
            <Plus className="w-3.5 h-3.5" /> Nueva Campaña
          </Button>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="bg-gradient-to-r from-[#D96B4D]/10 to-[#E7D8C6] border border-[#D96B4D]/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#D96B4D]" />
            <span className="font-semibold text-sm text-[#D96B4D]">Recomendaciones IA</span>
          </div>
          <div className="text-sm whitespace-pre-line">{aiInsight}</div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Campañas Activas" value={activas} icon={Megaphone} color="#0F8B6C" />
        <KpiCard label="Gasto Total" value={CLP(totalGasto)} sub={`de ${CLP(totalPresupuesto)}`} icon={DollarSign} color="#D96B4D" />
        <KpiCard label="Leads Generados" value={totalLeads} icon={Users} color="#3b82f6" />
        <KpiCard label="Conversiones" value={totalConversiones} icon={Target} color="#9333ea" />
        <KpiCard label="ROAS Promedio" value={`${roasPromedio}x`} sub={roasPromedio >= 3 ? '✓ Meta ≥ 3x' : '↗ Meta: 3x+'} icon={TrendingUp} color={roasPromedio >= 3 ? '#0F8B6C' : '#f59e0b'} />
        <KpiCard label="Total Campañas" value={campanas.length} icon={BarChart3} color="#4B4F54" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campanas">
        <TabsList>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
          <TabsTrigger value="analitica">Analítica</TabsTrigger>
        </TabsList>

        {/* ── CAMPAÑAS ── */}
        <TabsContent value="campanas" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : campanas.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Sin campañas. Crea la primera.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {campanas.map(c => {
                const pct = c.presupuesto_clp > 0 ? Math.min(100, Math.round((c.gasto_real_clp || 0) / c.presupuesto_clp * 100)) : 0;
                const statusColor = c.estado === 'Activa' ? '#0F8B6C' : c.estado === 'Pausada' ? '#f59e0b' : '#9ca3af';
                return (
                  <div key={c.id} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{c.nombre}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: statusColor + '20', color: statusColor }}>{c.estado}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{c.canal}</span>
                          {c.tipo_contenido && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c.tipo_contenido}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.objetivo} · {c.publico}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => del(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 text-xs mb-3">
                      {[
                        { label: 'Presupuesto', value: CLP(c.presupuesto_clp) },
                        { label: 'Gasto Real', value: CLP(c.gasto_real_clp) },
                        { label: 'Impresiones', value: (c.impresiones || 0).toLocaleString() },
                        { label: 'Clics', value: (c.clics || 0).toLocaleString() },
                        { label: 'CTR', value: `${c.ctr_pct || 0}%` },
                        { label: 'Conversiones', value: c.conversiones || 0 },
                        { label: 'Leads', value: c.leads_generados || 0 },
                        { label: 'ROAS', value: `${c.roas || 0}x` },
                      ].map((m, i) => (
                        <div key={i}>
                          <p className="text-muted-foreground">{m.label}</p>
                          <p className="font-semibold text-foreground">{m.value}</p>
                        </div>
                      ))}
                    </div>
                    {c.presupuesto_clp > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Ejecución presupuesto</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct > 90 ? '#D96B4D' : '#0F8B6C' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── ANALÍTICA ── */}
        <TabsContent value="analitica" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Gasto por Canal (CLP)</h3>
              {gastoByCanal.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gastoByCanal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="canal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={v => CLP(v)} />
                    <Bar dataKey="total" fill="#0F8B6C" radius={[4, 4, 0, 0]} name="Gasto" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-8 text-muted-foreground text-sm">Sin datos</p>}
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-4">Estado de Campañas</h3>
              {estadosData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={estadosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {estadosData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center py-8 text-muted-foreground text-sm">Sin datos</p>}
            </div>
          </div>

          {/* Matriz ROAS */}
          <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-sm mb-4">Rendimiento por Campaña (ROAS vs Gasto)</h3>
            <div className="space-y-2">
              {campanas.filter(c => c.gasto_real_clp > 0).sort((a, b) => (b.roas || 0) - (a.roas || 0)).map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground truncate shrink-0">{c.nombre}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${Math.min(100, ((c.roas || 0) / 10) * 100)}%`,
                      background: (c.roas || 0) >= 3 ? '#0F8B6C' : (c.roas || 0) >= 1.5 ? '#f59e0b' : '#D96B4D'
                    }} />
                  </div>
                  <span className="text-xs font-semibold w-12 text-right">{c.roas || 0}x</span>
                  <span className="text-xs text-muted-foreground w-20 text-right">{CLP(c.gasto_real_clp)}</span>
                </div>
              ))}
              {campanas.filter(c => c.gasto_real_clp > 0).length === 0 && (
                <p className="text-center py-4 text-muted-foreground text-sm">Ingresa datos de gasto y ROAS en las campañas para ver el análisis</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Campaña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><label className="text-xs font-medium text-muted-foreground">Nombre *</label>
              <Input value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={form.canal || ''} onValueChange={v => setForm({ ...form, canal: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Objetivo</label>
                <Select value={form.objetivo || ''} onValueChange={v => setForm({ ...form, objetivo: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJETIVOS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado || ''} onValueChange={v => setForm({ ...form, estado: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Tipo Contenido</label>
                <Select value={form.tipo_contenido || ''} onValueChange={v => setForm({ ...form, tipo_contenido: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Público objetivo</label>
              <Input value={form.publico || ''} onChange={e => setForm({ ...form, publico: e.target.value })} className="mt-1" placeholder="Ej: RRHH empresas, 30-45 años, Santiago" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label>
                <Input type="date" value={form.fecha_inicio || ''} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} className="mt-1" />
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Fin</label>
                <Input type="date" value={form.fecha_fin || ''} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Presupuesto (CLP)</label>
                <Input type="number" value={form.presupuesto_clp || ''} onChange={e => setForm({ ...form, presupuesto_clp: +e.target.value })} className="mt-1" />
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Gasto Real (CLP)</label>
                <Input type="number" value={form.gasto_real_clp || ''} onChange={e => setForm({ ...form, gasto_real_clp: +e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Impresiones', key: 'impresiones' },
                { label: 'Clics', key: 'clics' },
                { label: 'Conversiones', key: 'conversiones' },
                { label: 'Leads generados', key: 'leads_generados' },
              ].map(f => (
                <div key={f.key}><label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  <Input type="number" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: +e.target.value })} className="mt-1" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'ROAS', key: 'roas' },
                { label: 'CAC (CLP)', key: 'cac_clp' },
                { label: 'CTR (%)', key: 'ctr_pct' },
              ].map(f => (
                <div key={f.key}><label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  <Input type="number" step="0.1" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: +e.target.value })} className="mt-1" />
                </div>
              ))}
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">SKU promovido</label>
              <Input value={form.sku_promovido || ''} onChange={e => setForm({ ...form, sku_promovido: e.target.value })} className="mt-1" placeholder="KIT-ESCR-001" />
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea value={form.notas || ''} onChange={e => setForm({ ...form, notas: e.target.value })} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={save} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, Eye, MousePointerClick, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const CANALES = ["Meta Ads", "Google Search", "TikTok Ads", "LinkedIn Ads", "Email", "WhatsApp", "Orgánico Instagram", "Orgánico TikTok"];
const OBJETIVOS = ["Awareness", "Consideración", "Conversión", "Retargeting", "B2B Lead Gen"];
const ESTADOS = ["Activa", "Pausada", "Finalizada", "En revisión", "Planificada"];
const CONTENIDOS = ["Video Reel", "Imagen Estática", "Carrusel", "Story", "Texto", "Video largo"];

const COLORS = ['#0F8B6C', '#D96B4D', '#A7D9C9', '#4B4F54', '#E7D8C6', '#7c3aed', '#2563eb', '#d97706'];

const canalColor = {
  "Meta Ads": "bg-blue-100 text-blue-700",
  "Google Search": "bg-red-100 text-red-700",
  "TikTok Ads": "bg-gray-900 text-white",
  "LinkedIn Ads": "bg-blue-700 text-white",
  "Email": "bg-amber-100 text-amber-700",
  "WhatsApp": "bg-green-100 text-green-700",
  "Orgánico Instagram": "bg-pink-100 text-pink-700",
  "Orgánico TikTok": "bg-gray-100 text-gray-700",
};

const estadoCampColor = {
  Activa: "bg-green-100 text-green-700",
  Pausada: "bg-amber-100 text-amber-700",
  Finalizada: "bg-gray-100 text-gray-500",
  "En revisión": "bg-purple-100 text-purple-700",
  Planificada: "bg-blue-100 text-blue-700",
};

const CAM_DEFAULTS = {
  nombre: '', canal: 'Meta Ads', objetivo: 'Conversión', estado: 'Planificada',
  presupuesto_clp: 0, gasto_real_clp: 0, impresiones: 0, clics: 0,
  conversiones: 0, leads_generados: 0, roas: 0, cac_clp: 0, ctr_pct: 0,
  tipo_contenido: 'Video Reel'
};

function CampanaCard({ cam, onEdit, onDelete }) {
  const ctr = cam.ctr_pct || (cam.clics && cam.impresiones ? (cam.clics / cam.impresiones * 100) : 0);
  const roas = cam.roas || 0;
  const gasto = cam.gasto_real_clp || cam.presupuesto_clp || 0;
  const ejecucion = cam.presupuesto_clp ? Math.min(100, Math.round((cam.gasto_real_clp || 0) / cam.presupuesto_clp * 100)) : 0;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-poppins font-semibold text-sm text-foreground">{cam.nombre}</p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${canalColor[cam.canal] || 'bg-gray-100 text-gray-600'}`}>{cam.canal}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoCampColor[cam.estado] || ''}`}>{cam.estado}</span>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(cam)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(cam.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground"><DollarSign className="w-3 h-3" /><span>${gasto.toLocaleString('es-CL')}</span></div>
        <div className="flex items-center gap-1.5 text-muted-foreground"><Target className="w-3 h-3" /><span>{cam.objetivo}</span></div>
        {cam.impresiones > 0 && <div className="flex items-center gap-1.5 text-muted-foreground"><Eye className="w-3 h-3" /><span>{cam.impresiones.toLocaleString()}</span></div>}
        {ctr > 0 && <div className="flex items-center gap-1.5 text-muted-foreground"><MousePointerClick className="w-3 h-3" /><span>CTR {ctr.toFixed(1)}%</span></div>}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Leads</p>
          <p className="font-poppins font-bold text-sm" style={{ color: '#0F8B6C' }}>{cam.leads_generados || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">ROAS</p>
          <p className={`font-poppins font-bold text-sm ${roas >= 3 ? 'text-green-600' : roas > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{roas > 0 ? `${roas.toFixed(1)}x` : '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Conv.</p>
          <p className="font-poppins font-bold text-sm text-foreground">{cam.conversiones || 0}</p>
        </div>
      </div>

      {cam.presupuesto_clp > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Ejecución presupuesto</span><span>{ejecucion}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full"><div className="h-full rounded-full transition-all" style={{ width: `${ejecucion}%`, background: ejecucion > 90 ? '#D96B4D' : '#0F8B6C' }} /></div>
        </div>
      )}
    </div>
  );
}

export default function Marketing() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCanal, setFilterCanal] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(CAM_DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Campana.list('-created_date', 100);
    setCampanas(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(CAM_DEFAULTS); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Campana.update(editing.id, form);
    else await base44.entities.Campana.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta campaña?')) return;
    await base44.entities.Campana.delete(id);
    loadData();
  };

  const filtered = campanas.filter(c =>
    (filterCanal === 'todos' || c.canal === filterCanal) &&
    (filterEstado === 'todos' || c.estado === filterEstado)
  );

  // Aggregate stats
  const totalGasto = campanas.reduce((s, c) => s + (c.gasto_real_clp || c.presupuesto_clp || 0), 0);
  const totalLeads = campanas.reduce((s, c) => s + (c.leads_generados || 0), 0);
  const totalConversiones = campanas.reduce((s, c) => s + (c.conversiones || 0), 0);
  const avgRoas = campanas.filter(c => c.roas > 0).length > 0
    ? campanas.filter(c => c.roas > 0).reduce((s, c) => s + c.roas, 0) / campanas.filter(c => c.roas > 0).length
    : 0;

  // Chart data: gasto por canal
  const canalData = CANALES.map(canal => ({
    canal: canal.replace(' Ads', '').replace('Orgánico ', ''),
    gasto: campanas.filter(c => c.canal === canal).reduce((s, c) => s + (c.gasto_real_clp || c.presupuesto_clp || 0), 0),
    leads: campanas.filter(c => c.canal === canal).reduce((s, c) => s + (c.leads_generados || 0), 0),
  })).filter(d => d.gasto > 0 || d.leads > 0);

  const estadoData = ESTADOS.map(e => ({
    name: e,
    value: campanas.filter(c => c.estado === e).length
  })).filter(d => d.value > 0);

  // Presupuesto recomendado
  const recomendado = [
    { canal: 'Meta Ads', pct: 60, clp: 1200 },
    { canal: 'Google Search', pct: 25, clp: 500 },
    { canal: 'TikTok Ads', pct: 10, clp: 200 },
    { canal: 'LinkedIn B2B', pct: 5, clp: 100 },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Marketing & Campañas</h1>
          <p className="text-muted-foreground text-sm mt-1">Presupuesto actual: $2.0M CLP/mes • Meta: diversificar canales</p>
        </div>
        <Button onClick={openNew} style={{ background: '#D96B4D' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nueva Campaña
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Gasto Total', value: `$${(totalGasto/1000).toFixed(0)}K CLP`, sub: 'Meta: $2.000K/mes', color: '#D96B4D' },
          { label: 'Leads Generados', value: totalLeads, sub: 'Todos los canales', color: '#0F8B6C' },
          { label: 'Conversiones', value: totalConversiones, sub: `CVR: ${totalLeads > 0 ? (totalConversiones/totalLeads*100).toFixed(1) : 0}%`, color: '#0F8B6C' },
          { label: 'ROAS Promedio', value: avgRoas > 0 ? `${avgRoas.toFixed(1)}x` : '-', sub: 'Meta: >3x', color: avgRoas >= 3 ? '#0F8B6C' : '#D96B4D' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-poppins font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Gasto y Leads por Canal</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribución actual del presupuesto</p>
          {canalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={canalData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="canal" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="gasto" fill="#D96B4D" name="Gasto (CLP)" radius={[4,4,0,0]} />
                <Bar yAxisId="right" dataKey="leads" fill="#0F8B6C" name="Leads" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Agrega campañas para ver gráficos
            </div>
          )}
        </div>

        {/* Presupuesto recomendado */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
          <h3 className="font-poppins font-semibold text-foreground mb-1">Mix Recomendado</h3>
          <p className="text-xs text-muted-foreground mb-3">De $2.0M CLP/mes (Blueprint)</p>
          <div className="space-y-3">
            {recomendado.map((r, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{r.canal}</span>
                  <span className="text-muted-foreground">${r.clp}K • {r.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: COLORS[i] }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Acciones Urgentes</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-1"><span className="text-red-500 mt-0.5">→</span> Pausar Advantage+ sin A/B testing</p>
              <p className="flex items-start gap-1"><span style={{ color: '#0F8B6C' }} className="mt-0.5">→</span> Activar Google Search con keywords B2B</p>
              <p className="flex items-start gap-1"><span style={{ color: '#0F8B6C' }} className="mt-0.5">→</span> Implementar Meta CAPI + GA4</p>
              <p className="flex items-start gap-1"><span style={{ color: '#4B4F54' }} className="mt-0.5">→</span> 3 reels/semana de producción</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + List */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            {CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center ml-1">{filtered.length} campañas</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => <CampanaCard key={c.id} cam={c} onEdit={openEdit} onDelete={handleDelete} />)}
        {!loading && filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay campañas. Agrega la primera.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Campaña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><label className="text-xs font-medium text-muted-foreground">Nombre *</label><Input value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={form.canal||''} onValueChange={v=>setForm({...form,canal:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Objetivo</label>
                <Select value={form.objetivo||''} onValueChange={v=>setForm({...form,objetivo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{OBJETIVOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Tipo Contenido</label>
                <Select value={form.tipo_contenido||''} onValueChange={v=>setForm({...form,tipo_contenido:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENIDOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Presupuesto (CLP)</label><Input type="number" value={form.presupuesto_clp||''} onChange={e=>setForm({...form,presupuesto_clp:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Gasto Real (CLP)</label><Input type="number" value={form.gasto_real_clp||''} onChange={e=>setForm({...form,gasto_real_clp:+e.target.value})} className="mt-1" /></div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Métricas</p>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs font-medium text-muted-foreground">Impresiones</label><Input type="number" value={form.impresiones||''} onChange={e=>setForm({...form,impresiones:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Clics</label><Input type="number" value={form.clics||''} onChange={e=>setForm({...form,clics:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Leads</label><Input type="number" value={form.leads_generados||''} onChange={e=>setForm({...form,leads_generados:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs font-medium text-muted-foreground">Conversiones</label><Input type="number" value={form.conversiones||''} onChange={e=>setForm({...form,conversiones:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">ROAS</label><Input type="number" step="0.1" value={form.roas||''} onChange={e=>setForm({...form,roas:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">CAC (CLP)</label><Input type="number" value={form.cac_clp||''} onChange={e=>setForm({...form,cac_clp:+e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">SKU / Producto Promovido</label><Input value={form.sku_promovido||''} onChange={e=>setForm({...form,sku_promovido:e.target.value})} className="mt-1" /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#D96B4D' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
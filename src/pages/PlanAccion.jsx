import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Plus, Edit2, Trash2,
  XCircle, Loader2, Filter, LayoutGrid, List
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AREAS = ["Comercial", "Marketing", "Producción", "Finanzas", "RRHH", "Operaciones", "Tecnología", "ESG", "Dirección"];
const TIPOS = ["Tarea operativa", "Iniciativa OKR", "Mejora proceso", "Reunión / Follow-up", "Urgente"];
const ESTADOS = ["Pendiente", "En curso", "Bloqueada", "Completada", "Cancelada"];
const PRIORIDADES = ["Alta", "Media", "Baja"];

const estadoConfig = {
  "Pendiente":   { icon: Circle,       color: "#9ca3af", bg: "#f3f4f6" },
  "En curso":    { icon: Loader2,      color: "#3b82f6", bg: "#eff6ff" },
  "Bloqueada":   { icon: AlertTriangle,color: "#D96B4D", bg: "#fdf3f0" },
  "Completada":  { icon: CheckCircle2, color: "#0F8B6C", bg: "#f0faf7" },
  "Cancelada":   { icon: XCircle,      color: "#9ca3af", bg: "#f3f4f6" },
};

const prioColor = { "Alta": "#D96B4D", "Media": "#f59e0b", "Baja": "#9ca3af" };

const areaColor = {
  "Comercial": "bg-green-100 text-green-700",
  "Marketing": "bg-pink-100 text-pink-600",
  "Producción": "bg-blue-100 text-blue-700",
  "Finanzas": "bg-amber-100 text-amber-700",
  "RRHH": "bg-purple-100 text-purple-700",
  "Operaciones": "bg-orange-100 text-orange-700",
  "Tecnología": "bg-cyan-100 text-cyan-700",
  "ESG": "bg-emerald-100 text-emerald-700",
  "Dirección": "bg-slate-100 text-slate-700",
};

const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : null;

const DEFAULTS = { titulo: '', area: 'Comercial', tipo: 'Tarea operativa', estado: 'Pendiente', prioridad: 'Media', recurrente: false };

// Blueprint: tareas iniciales sugeridas
const TAREAS_BLUEPRINT = [
  { titulo: 'Activar pipeline B2B con 5 leads calientes', area: 'Comercial', tipo: 'Iniciativa OKR', prioridad: 'Alta', resultado_esperado: 'Min 2 cotizaciones enviadas esta semana' },
  { titulo: 'Configurar Meta Ads con CAPI + GA4', area: 'Marketing', tipo: 'Mejora proceso', prioridad: 'Alta', resultado_esperado: 'Tracking correcto para optimizar ROAS' },
  { titulo: 'Auditar % real de material reciclado por SKU', area: 'ESG', tipo: 'Mejora proceso', prioridad: 'Media', resultado_esperado: 'Datos base para reporte ESG' },
  { titulo: 'Definir precios B2B para temporada regalos corp.', area: 'Comercial', tipo: 'Tarea operativa', prioridad: 'Alta', resultado_esperado: 'Precios actualizados en catálogo' },
  { titulo: 'Revisar scrap promedio inyectoras 1-3', area: 'Producción', tipo: 'Mejora proceso', prioridad: 'Media', resultado_esperado: 'Scrap < 3% / máquina' },
  { titulo: 'Solicitar cotización packaging compostable', area: 'ESG', tipo: 'Iniciativa OKR', prioridad: 'Media', resultado_esperado: 'Al menos 2 cotizaciones recibidas' },
  { titulo: 'Capacitar equipo tiendas en up-selling personalización', area: 'RRHH', tipo: 'Tarea operativa', prioridad: 'Baja', resultado_esperado: '+20% ticket promedio tiendas' },
  { titulo: 'Implementar flujo de bienvenida por WhatsApp', area: 'Marketing', tipo: 'Iniciativa OKR', prioridad: 'Alta', resultado_esperado: 'Tasa respuesta < 2 hrs' },
];

function TareaCard({ tarea, onEdit, onDelete, onToggle }) {
  const cfg = estadoConfig[tarea.estado] || estadoConfig["Pendiente"];
  const Icon = cfg.icon;
  const hoy = new Date().toISOString().split('T')[0];
  const vencida = tarea.fecha_limite && tarea.fecha_limite < hoy && tarea.estado !== 'Completada' && tarea.estado !== 'Cancelada';

  return (
    <div className={`bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all ${
      vencida ? 'border-red-200' : tarea.estado === 'Completada' ? 'border-green-100 opacity-75' : 'border-border'
    }`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(tarea)} className="mt-0.5 flex-shrink-0">
          <Icon className={`w-4.5 h-4.5 ${tarea.estado === 'En curso' ? 'animate-spin' : ''}`}
            style={{ color: cfg.color }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm ${tarea.estado === 'Completada' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {tarea.titulo}
            </p>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(tarea)} className="p-1 hover:bg-muted rounded"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
              <button onClick={() => onDelete(tarea.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3 text-red-400" /></button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${areaColor[tarea.area] || 'bg-gray-100'}`}>{tarea.area}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>{tarea.estado}</span>
            <span className="text-xs font-bold" style={{ color: prioColor[tarea.prioridad] }}>● {tarea.prioridad}</span>
            {tarea.recurrente && <span className="text-xs text-muted-foreground">↺ recurrente</span>}
          </div>

          {tarea.resultado_esperado && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">→ {tarea.resultado_esperado}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {tarea.responsable && <span>👤 {tarea.responsable}</span>}
            {tarea.fecha_limite && (
              <span className={vencida ? 'text-red-500 font-medium' : ''}>
                {vencida ? '⚠ Vencida · ' : '📅 '}{fmtDate(tarea.fecha_limite)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanAccion() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [filterArea, setFilterArea] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('activas');
  const [filterPrio, setFilterPrio] = useState('todas');
  const [vista, setVista] = useState('lista');

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Tarea.list('-created_date', 200);
    setTareas(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm(t); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Tarea.update(editing.id, form);
    else await base44.entities.Tarea.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar tarea?')) return;
    await base44.entities.Tarea.delete(id);
    loadData();
  };

  const handleToggle = async (tarea) => {
    const next = tarea.estado === 'Pendiente' ? 'En curso'
      : tarea.estado === 'En curso' ? 'Completada'
      : tarea.estado === 'Completada' ? 'Pendiente'
      : tarea.estado;
    await base44.entities.Tarea.update(tarea.id, {
      estado: next,
      fecha_completada: next === 'Completada' ? new Date().toISOString().split('T')[0] : null,
    });
    loadData();
  };

  const handleSeedBlueprint = async () => {
    setSeeding(true);
    await base44.entities.Tarea.bulkCreate(
      TAREAS_BLUEPRINT.map(t => ({ ...t, estado: 'Pendiente' }))
    );
    setSeeding(false);
    loadData();
  };

  const filtered = tareas.filter(t => {
    const matchArea = filterArea === 'todas' || t.area === filterArea;
    const matchEstado = filterEstado === 'todas' ? true
      : filterEstado === 'activas' ? !['Completada', 'Cancelada'].includes(t.estado)
      : t.estado === filterEstado;
    const matchPrio = filterPrio === 'todas' || t.prioridad === filterPrio;
    return matchArea && matchEstado && matchPrio;
  });

  // KPIs
  const hoy = new Date().toISOString().split('T')[0];
  const activas = tareas.filter(t => !['Completada', 'Cancelada'].includes(t.estado)).length;
  const completadas = tareas.filter(t => t.estado === 'Completada').length;
  const vencidas = tareas.filter(t => t.fecha_limite && t.fecha_limite < hoy && !['Completada', 'Cancelada'].includes(t.estado)).length;
  const altas = tareas.filter(t => t.prioridad === 'Alta' && !['Completada', 'Cancelada'].includes(t.estado)).length;
  const pctAvance = tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0;

  // Por área (para vista kanban por área)
  const AREAS_ACTIVAS = [...new Set(filtered.map(t => t.area))].sort();

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Plan de Acción</h1>
          <p className="text-muted-foreground text-sm mt-1">Tareas operativas · Iniciativas OKR · Seguimiento blueprint</p>
        </div>
        <div className="flex gap-2">
          {tareas.length === 0 && (
            <Button onClick={handleSeedBlueprint} variant="outline" disabled={seeding} className="gap-2 text-sm">
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '🗂'}
              Cargar tareas blueprint
            </Button>
          )}
          <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />Nueva Tarea
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tareas Activas', value: activas, color: '#0F8B6C' },
          { label: 'Completadas', value: completadas, color: '#0F8B6C' },
          { label: 'Prioridad Alta', value: altas, color: altas > 0 ? '#D96B4D' : '#9ca3af' },
          { label: 'Vencidas', value: vencidas, color: vencidas > 0 ? '#D96B4D' : '#9ca3af' },
          { label: '% Avance', value: `${pctAvance}%`, color: pctAvance >= 70 ? '#0F8B6C' : pctAvance >= 40 ? '#f59e0b' : '#D96B4D' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="font-poppins font-bold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de progreso general */}
      {tareas.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Progreso General Blueprint</span>
            <span className="font-bold" style={{ color: '#0F8B6C' }}>{completadas}/{tareas.length} tareas</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pctAvance}%`, background: 'linear-gradient(to right, #0F8B6C, #A7D9C9)' }} />
          </div>
        </div>
      )}

      {/* Alertas */}
      {vencidas > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {vencidas} tarea(s) vencidas — revisar y reprogramar o completar
        </div>
      )}

      <Tabs value={vista} onValueChange={setVista}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="bg-muted">
            <TabsTrigger value="lista" className="gap-1"><List className="w-3.5 h-3.5" />Lista</TabsTrigger>
            <TabsTrigger value="area" className="gap-1"><LayoutGrid className="w-3.5 h-3.5" />Por Área</TabsTrigger>
            <TabsTrigger value="prioridad">Por Prioridad</TabsTrigger>
          </TabsList>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activas">Activas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las áreas</SelectItem>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPrio} onValueChange={setFilterPrio}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── LISTA ── */}
        <TabsContent value="lista" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin tareas{tareas.length > 0 ? ' con estos filtros' : ''}</p>
              {tareas.length === 0 && (
                <Button onClick={handleSeedBlueprint} variant="outline" className="mt-4 gap-2" disabled={seeding}>
                  🗂 Cargar tareas blueprint
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Agrupado por estado */}
              {['Pendiente', 'En curso', 'Bloqueada'].map(estado => {
                const items = filtered.filter(t => t.estado === estado);
                if (items.length === 0) return null;
                const cfg = estadoConfig[estado];
                return (
                  <div key={estado}>
                    <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{estado}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: cfg.bg, color: cfg.color }}>{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.sort((a, b) => {
                        const po = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
                        return (po[a.prioridad] ?? 1) - (po[b.prioridad] ?? 1);
                      }).map(t => (
                        <TareaCard key={t.id} tarea={t} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* Completadas al final */}
              {filtered.filter(t => t.estado === 'Completada').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-green-600">Completada</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold">{filtered.filter(t => t.estado === 'Completada').length}</span>
                  </div>
                  <div className="space-y-2">
                    {filtered.filter(t => t.estado === 'Completada').map(t => (
                      <TareaCard key={t.id} tarea={t} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── POR ÁREA ── */}
        <TabsContent value="area" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AREAS_ACTIVAS.map(area => {
              const items = filtered.filter(t => t.area === area);
              const completadasArea = items.filter(t => t.estado === 'Completada').length;
              return (
                <div key={area} className="bg-white rounded-2xl p-4 border border-border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${areaColor[area] || 'bg-gray-100'}`}>{area}</span>
                    <span className="text-xs text-muted-foreground">{completadasArea}/{items.length}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mb-3">
                    <div className="h-full rounded-full" style={{ width: `${items.length > 0 ? Math.round(completadasArea/items.length*100) : 0}%`, background: '#0F8B6C' }} />
                  </div>
                  <div className="space-y-2">
                    {items.sort((a, b) => {
                      const po = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
                      return (po[a.prioridad] ?? 1) - (po[b.prioridad] ?? 1);
                    }).map(t => {
                      const cfg = estadoConfig[t.estado] || {};
                      return (
                        <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(t)}>
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: prioColor[t.prioridad] }} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${t.estado === 'Completada' ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                            <p className="text-xs" style={{ color: cfg.color }}>{t.estado}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ── POR PRIORIDAD ── */}
        <TabsContent value="prioridad" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRIORIDADES.map(prio => {
              const items = filtered.filter(t => t.prioridad === prio);
              return (
                <div key={prio} className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: prioColor[prio] }} />
                    <span className="font-semibold text-sm">{prio}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{items.length} tareas</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center text-xs text-muted-foreground">Sin tareas</div>
                  ) : items.map(t => (
                    <TareaCard key={t.id} tarea={t} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input value={form.titulo||''} onChange={e=>setForm({...form,titulo:e.target.value})} className="mt-1" placeholder="Ej: Contactar 5 leads calientes esta semana" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Área *</label>
                <Select value={form.area||''} onValueChange={v=>setForm({...form,area:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={form.tipo||''} onValueChange={v=>setForm({...form,tipo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
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
              <div><label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                <Select value={form.prioridad||''} onValueChange={v=>setForm({...form,prioridad:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Responsable</label>
                <Input value={form.responsable||''} onChange={e=>setForm({...form,responsable:e.target.value})} className="mt-1" placeholder="Nombre..." />
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Límite</label>
                <Input type="date" value={form.fecha_limite||''} onChange={e=>setForm({...form,fecha_limite:e.target.value})} className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Resultado Esperado</label>
              <Input value={form.resultado_esperado||''} onChange={e=>setForm({...form,resultado_esperado:e.target.value})} className="mt-1" placeholder="¿Cómo se ve el éxito?" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">OKR Relacionado</label>
              <Input value={form.okr_relacionado||''} onChange={e=>setForm({...form,okr_relacionado:e.target.value})} className="mt-1" placeholder="Escalar B2B a 16 pedidos/mes..." />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.recurrente||false} onChange={e=>setForm({...form,recurrente:e.target.checked})} />
              Tarea recurrente (semanal / mensual)
            </label>
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
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Factory, Clock, CheckCircle2, AlertTriangle, Package, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ESTADOS = ["Pendiente", "En Cola", "En Producción", "Control Calidad", "Personalización Láser", "Packaging", "Listo para Despacho", "Despachado"];
const PRIORIDADES = ["Alta (urgente)", "Normal", "Baja"];
const INYECTORAS = ["Inyectora 1", "Inyectora 2", "Inyectora 3", "Inyectora 4", "Inyectora 5", "Inyectora 6", "Sin asignar"];
const LASERES = ["Láser 1", "Láser 2", "No requiere"];

const estadoConfig = {
  "Pendiente": { color: "bg-gray-100 text-gray-600", icon: Clock },
  "En Cola": { color: "bg-blue-100 text-blue-700", icon: Clock },
  "En Producción": { color: "bg-amber-100 text-amber-700", icon: Factory },
  "Control Calidad": { color: "bg-purple-100 text-purple-700", icon: CheckCircle2 },
  "Personalización Láser": { color: "bg-indigo-100 text-indigo-700", icon: Factory },
  "Packaging": { color: "bg-orange-100 text-orange-700", icon: Package },
  "Listo para Despacho": { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  "Despachado": { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const prioridadColor = {
  "Alta (urgente)": "bg-red-50 text-red-600 border border-red-200",
  "Normal": "bg-gray-50 text-gray-600 border border-gray-200",
  "Baja": "bg-blue-50 text-blue-500 border border-blue-200",
};

const OP_DEFAULTS = {
  empresa: '', sku: '', cantidad: 0, estado: 'Pendiente', prioridad: 'Normal',
  inyectora: 'Sin asignar', laser: 'No requiere', personalizacion: false,
  packaging_externo: false, anticipo_pagado: false
};

function OpCard({ op, onEdit, onDelete }) {
  const cfg = estadoConfig[op.estado] || { color: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  const isUrgente = op.prioridad === 'Alta (urgente)';
  const isLate = op.fecha_entrega_prometida && new Date(op.fecha_entrega_prometida) < new Date() && op.estado !== 'Despachado';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-shadow hover:shadow-md ${isUrgente ? 'border-red-200' : isLate ? 'border-amber-200' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-poppins font-semibold text-sm text-foreground">{op.empresa}</p>
            {isLate && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <p className="text-xs text-muted-foreground">{op.sku}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(op)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(op.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{op.estado}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${prioridadColor[op.prioridad] || ''}`}>{op.prioridad}</span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Cantidad:</span>
          <span className="font-medium text-foreground">{(op.cantidad || 0).toLocaleString()} u</span>
        </div>
        {op.inyectora && op.inyectora !== 'Sin asignar' && (
          <div className="flex items-center justify-between">
            <span>Máquina:</span>
            <span className="font-medium text-foreground">{op.inyectora}</span>
          </div>
        )}
        {op.laser && op.laser !== 'No requiere' && (
          <div className="flex items-center justify-between">
            <span>Láser:</span>
            <span className="font-medium text-foreground">{op.laser}</span>
          </div>
        )}
        {op.fecha_entrega_prometida && (
          <div className={`flex items-center justify-between ${isLate ? 'text-red-500' : ''}`}>
            <span>Entrega:</span>
            <span className="font-medium">{op.fecha_entrega_prometida}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1.5 mt-3 pt-2 border-t border-border">
        {op.anticipo_pagado && <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-600">50% pagado</span>}
        {op.personalizacion && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">Personalización</span>}
        {op.packaging_externo && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-orange-600">Pack. externo</span>}
      </div>
    </div>
  );
}

export default function Operaciones() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(OP_DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const ops = await base44.entities.OrdenProduccion.list('-created_date', 100);
    setOrdenes(ops);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(OP_DEFAULTS); setShowModal(true); };
  const openEdit = (op) => { setEditing(op); setForm(op); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.OrdenProduccion.update(editing.id, form);
    else await base44.entities.OrdenProduccion.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    await base44.entities.OrdenProduccion.delete(id);
    loadData();
  };

  const filtered = ordenes.filter(o =>
    (filterEstado === 'todos' || o.estado === filterEstado) &&
    (filterPrioridad === 'todos' || o.prioridad === filterPrioridad)
  );

  const [tab, setTab] = useState('lista');

  // Stats
  const enProduccion = ordenes.filter(o => ['En Producción', 'En Cola', 'Pendiente', 'Control Calidad', 'Personalización Láser', 'Packaging', 'Listo para Despacho'].includes(o.estado)).length;
  const urgentes = ordenes.filter(o => o.prioridad === 'Alta (urgente)' && o.estado !== 'Despachado').length;
  const totalUnidades = ordenes.filter(o => o.estado !== 'Despachado').reduce((s, o) => s + (o.cantidad || 0), 0);
  const inyectorasUsadas = [...new Set(ordenes.filter(o => o.inyectora && o.inyectora !== 'Sin asignar' && o.estado !== 'Despachado').map(o => o.inyectora))].length;
  const utilizacionPct = Math.round((inyectorasUsadas / 6) * 100);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Operaciones & Producción</h1>
          <p className="text-muted-foreground text-sm mt-1">6 inyectoras • 2 láseres galvo UV • Capacidad: 3.000 u/día</p>
        </div>
        <Button onClick={openNew} style={{ background: '#4B4F54' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nueva Orden
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Órdenes Activas', value: enProduccion, color: '#4B4F54', bg: '#f5f5f5' },
          { label: 'Urgentes', value: urgentes, color: urgentes > 0 ? '#D96B4D' : '#4B4F54', bg: urgentes > 0 ? '#fdf3f0' : '#f5f5f5' },
          { label: 'Unidades en Proceso', value: totalUnidades.toLocaleString(), color: '#0F8B6C', bg: '#f0faf7' },
          { label: 'Inyectoras Activas', value: `${inyectorasUsadas}/6`, color: '#0F8B6C', bg: '#f0faf7' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-poppins font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="lista">Kanban</TabsTrigger>
            <TabsTrigger value="planta">Vista Planta</TabsTrigger>
          </TabsList>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Prioridad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las prioridades</SelectItem>
              {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} órdenes</span>
        </div>

        <TabsContent value="lista" className="mt-4">
      {/* Kanban por estado */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ESTADOS.slice(0, 6).map(estado => {
          const items = filtered.filter(o => o.estado === estado);
          const cfg = estadoConfig[estado];
          return (
            <div key={estado} className="flex-shrink-0 w-56">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-muted-foreground">{estado}</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(op => <OpCard key={op.id} op={op} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            </div>
          );
        })}
      </div>

      {loading && <div className="text-center py-8 text-muted-foreground">Cargando órdenes...</div>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay órdenes de producción. Crea la primera.</p>
        </div>
      )}
        </TabsContent>

        <TabsContent value="planta" className="mt-4">
          {/* Utilización planta */}
          <div className="mb-4 bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Utilización Planta</p>
              <span className="font-poppins font-bold text-lg" style={{ color: utilizacionPct >= 70 ? '#0F8B6C' : '#D96B4D' }}>{utilizacionPct}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${utilizacionPct}%`, background: utilizacionPct >= 70 ? '#0F8B6C' : '#D96B4D' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{inyectorasUsadas} de 6 inyectoras activas • Meta mandato: ≥70%</p>
          </div>
          {/* Grid de inyectoras */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {['Inyectora 1','Inyectora 2','Inyectora 3','Inyectora 4','Inyectora 5','Inyectora 6'].map(inj => {
              const ops = ordenes.filter(o => o.inyectora === inj && o.estado !== 'Despachado');
              const activa = ops.length > 0;
              const urgente = ops.some(o => o.prioridad === 'Alta (urgente)');
              return (
                <div key={inj} className={`rounded-xl p-4 border-2 transition-all ${
                  urgente ? 'border-red-300 bg-red-50/40' : activa ? 'border-green-300 bg-green-50/40' : 'border-dashed border-border bg-muted/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Factory className={`w-4 h-4 ${activa ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{inj}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      urgente ? 'bg-red-100 text-red-600' : activa ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                    }`}>{urgente ? '⚠ Urgente' : activa ? 'Activa' : 'Libre'}</span>
                  </div>
                  {ops.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin órdenes asignadas</p>
                  ) : (
                    <div className="space-y-1">
                      {ops.map(o => (
                        <div key={o.id} className="text-xs bg-white rounded-lg p-2 border border-border">
                          <p className="font-medium truncate">{o.empresa}</p>
                          <p className="text-muted-foreground">{o.sku} • {(o.cantidad||0).toLocaleString()} u</p>
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${estadoConfig[o.estado]?.color || 'bg-gray-100 text-gray-600'}`}>{o.estado}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Láseres */}
          <div className="grid grid-cols-2 gap-3">
            {['Láser 1','Láser 2'].map(laser => {
              const ops = ordenes.filter(o => o.laser === laser && o.estado !== 'Despachado');
              const activo = ops.length > 0;
              return (
                <div key={laser} className={`rounded-xl p-4 border-2 ${
                  activo ? 'border-indigo-300 bg-indigo-50/30' : 'border-dashed border-border bg-muted/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${activo ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{laser} (UV)</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activo ? 'bg-indigo-100 text-indigo-600' : 'bg-muted text-muted-foreground'
                    }`}>{activo ? 'Activo' : 'Libre'}</span>
                  </div>
                  {ops.length === 0 ? <p className="text-xs text-muted-foreground">Sin trabajos asignados</p> : (
                    <div className="space-y-1">
                      {ops.map(o => (
                        <div key={o.id} className="text-xs bg-white rounded-lg p-2 border border-border">
                          <p className="font-medium truncate">{o.empresa}</p>
                          <p className="text-muted-foreground">{o.sku} • {(o.cantidad||0).toLocaleString()} u</p>
                        </div>
                      ))}
                    </div>
                  )}
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
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Orden de Producción</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Empresa / Cliente *</label><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Producto / SKU *</label><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Cantidad</label><Input type="number" value={form.cantidad||''} onChange={e=>setForm({...form,cantidad:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                <Select value={form.prioridad||''} onValueChange={v=>setForm({...form,prioridad:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORIDADES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Inyectora</label>
                <Select value={form.inyectora||''} onValueChange={v=>setForm({...form,inyectora:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{INYECTORAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Láser</label>
                <Select value={form.laser||''} onValueChange={v=>setForm({...form,laser:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{LASERES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label><Input type="date" value={form.fecha_inicio||''} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Entrega</label><Input type="date" value={form.fecha_entrega_prometida||''} onChange={e=>setForm({...form,fecha_entrega_prometida:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="flex gap-4 pt-1">
              {[
                { key: 'anticipo_pagado', label: '50% Anticipo Pagado' },
                { key: 'personalizacion', label: 'Requiere Personalización' },
                { key: 'packaging_externo', label: 'Packaging Externo' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form[key]||false} onChange={e=>setForm({...form,[key]:e.target.checked})} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas de Producción</label><textarea value={form.notas_produccion||''} onChange={e=>setForm({...form,notas_produccion:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#4B4F54' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
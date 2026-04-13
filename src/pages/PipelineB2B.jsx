import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Edit2, Trash2, MessageSquare, FileText, Users, Clock, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// SLA: días desde creación/última actualización
function getDiasEnEtapa(lead) {
  const ref = lead.updated_date || lead.created_date;
  if (!ref) return 0;
  return Math.floor((Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24));
}

const SLA_LIMITS = { Nuevo: 1, Contactado: 2, Cotizado: 3, 'Muestra Enviada': 5, 'Negociación': 7 };

const ESTADOS_LEAD = ["Nuevo", "Contactado", "Cotizado", "Muestra Enviada", "Negociación", "Ganado", "Perdido"];
const ESTADOS_COT = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Vencida"];

const estadoColor = {
  Nuevo: "bg-blue-100 text-blue-700",
  Contactado: "bg-purple-100 text-purple-700",
  Cotizado: "bg-amber-100 text-amber-700",
  "Muestra Enviada": "bg-orange-100 text-orange-700",
  Negociación: "bg-indigo-100 text-indigo-700",
  Ganado: "bg-green-100 text-green-700",
  Perdido: "bg-red-100 text-red-700",
  Borrador: "bg-gray-100 text-gray-600",
  Enviada: "bg-blue-100 text-blue-700",
  Aceptada: "bg-green-100 text-green-700",
  Rechazada: "bg-red-100 text-red-700",
  Vencida: "bg-gray-100 text-gray-500",
};

const calidadColor = {
  Caliente: "bg-red-50 text-red-600 border border-red-200",
  Tibio: "bg-amber-50 text-amber-600 border border-amber-200",
  Frío: "bg-blue-50 text-blue-500 border border-blue-200",
  "No Comercial": "bg-gray-50 text-gray-400 border border-gray-200",
};

function LeadCard({ lead, onEdit, onDelete }) {
  const dias = getDiasEnEtapa(lead);
  const slaLimit = SLA_LIMITS[lead.estado];
  const slaVencido = slaLimit && dias > slaLimit;
  const slaProximo = slaLimit && dias === slaLimit;

  return (
    <div className={`bg-slate-800/60 rounded-xl p-4 shadow-lg border transition-shadow hover:shadow-md ${
      slaVencido ? 'border-red-500/60' : slaProximo ? 'border-amber-500/60' : 'border-slate-700/60'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-poppins font-semibold text-sm text-white truncate">{lead.empresa}</p>
          <p className="text-xs text-gray-400">{lead.contacto}</p>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button onClick={() => onEdit(lead)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(lead.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[lead.estado]}`}>{lead.estado}</span>
        {lead.calidad_lead && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${calidadColor[lead.calidad_lead] || 'bg-gray-100 text-gray-600'}`}>{lead.calidad_lead}</span>}
        {slaVencido && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{dias}d — SLA vencido
          </span>
        )}
        {slaProximo && !slaVencido && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />{dias}d — Vence hoy
          </span>
        )}
      </div>
      <div className="space-y-1 text-xs text-gray-400">
        {lead.canal && <div className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" />{lead.canal}</div>}
        {lead.cantidad_estimada && <div className="flex items-center gap-1.5"><FileText className="w-3 h-3" />{lead.cantidad_estimada.toLocaleString()} unidades</div>}
        {lead.presupuesto_estimado && <div className="flex items-center gap-1.5"><span className="font-medium text-cyan-300">${lead.presupuesto_estimado.toLocaleString('es-CL')}</span></div>}
      </div>
      {lead.next_action && (
        <div className="mt-2 pt-2 border-t border-slate-700/60 text-xs">
          <span className="font-medium text-cyan-300">→ </span>
          <span className="text-gray-400">{lead.next_action}</span>
          {lead.next_action_date && <span className="text-xs text-gray-500 ml-1">({lead.next_action_date})</span>}
        </div>
      )}
    </div>
  );
}

function CotizacionRow({ cot, onEdit, onDelete, onCrearOP }) {
  const total = cot.total || (cot.cantidad * cot.precio_unitario * (1 - (cot.descuento_pct || 0) / 100) + (cot.fee_personalizacion || 0) + (cot.fee_packaging || 0));
  return (
    <div className="bg-slate-800/60 rounded-xl p-4 shadow-lg border border-slate-700/60 hover:shadow-lg transition-shadow flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <p className="font-poppins font-semibold text-sm text-white">{cot.empresa}</p>
          <p className="text-xs text-gray-400">{cot.sku} • {(cot.cantidad || 0).toLocaleString()} u</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[cot.estado] || 'bg-gray-100'}`}>{cot.estado}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-poppins font-bold text-sm text-cyan-300">${total.toLocaleString('es-CL')}</p>
          <p className="text-xs text-gray-400">{cot.lead_time_dias || '?'} días hábiles</p>
        </div>
        <div className="flex gap-1 items-center">
          {cot.estado === 'Aceptada' && (
            <button
              onClick={() => onCrearOP(cot)}
              title="Crear Orden de Producción"
              className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:opacity-80 flex items-center gap-1"
              style={{ background: '#f0faf7', color: '#0F8B6C' }}>
              + OP
            </button>
          )}
          <button onClick={() => onEdit(cot)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(cot.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

const LEAD_DEFAULTS = { empresa: '', contacto: '', email: '', telefono: '', canal: 'WhatsApp', estado: 'Nuevo', tipo: 'B2B Corporativo', calidad_lead: 'Tibio', logo_recibido: false, personalizacion: true };
const COT_DEFAULTS = { empresa: '', sku: '', cantidad: 0, precio_unitario: 0, descuento_pct: 0, fee_personalizacion: 0, fee_packaging: 0, estado: 'Borrador', personalizacion_tipo: 'Láser UV', packaging: 'Estándar (stock)', lead_time_dias: 7 };

export default function PipelineB2B() {
  const [activeTab, setActiveTab] = useState('leads');
  const [leads, setLeads] = useState([]);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(LEAD_DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const [l, c] = await Promise.all([
      base44.entities.Lead.list('-created_date', 100),
      base44.entities.Cotizacion.list('-created_date', 100),
    ]);
    setLeads(l);
    setCotizaciones(c);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(activeTab === 'leads' ? LEAD_DEFAULTS : COT_DEFAULTS);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (activeTab === 'leads') {
      if (editing) await base44.entities.Lead.update(editing.id, form);
      else await base44.entities.Lead.create(form);
    } else {
      const total = (form.cantidad || 0) * (form.precio_unitario || 0) * (1 - (form.descuento_pct || 0) / 100) + (form.fee_personalizacion || 0) + (form.fee_packaging || 0);
      const data = { ...form, total };
      if (editing) await base44.entities.Cotizacion.update(editing.id, data);
      else await base44.entities.Cotizacion.create(data);
    }
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este registro?')) return;
    if (activeTab === 'leads') await base44.entities.Lead.delete(id);
    else await base44.entities.Cotizacion.delete(id);
    loadData();
  };

  const handleCrearOP = async (cot) => {
    await base44.entities.OrdenProduccion.create({
      empresa: cot.empresa,
      sku: cot.sku,
      cantidad: cot.cantidad,
      estado: 'Pendiente',
      prioridad: 'Normal',
      inyectora: 'Sin asignar',
      laser: cot.personalizacion_tipo && cot.personalizacion_tipo !== 'Sin personalización' ? 'Láser 1' : 'No requiere',
      personalizacion: cot.personalizacion_tipo !== 'Sin personalización',
      anticipo_pagado: false,
      notas_produccion: `Generado automáticamente desde Cotización ${cot.numero || cot.id?.slice(0,8)}`,
    });
    alert(`✅ Orden de Producción creada para ${cot.empresa} — ${cot.sku}`);
  };

  const filteredLeads = leads.filter(l =>
    (filterEstado === 'todos' || l.estado === filterEstado) &&
    (l.empresa?.toLowerCase().includes(search.toLowerCase()) || l.contacto?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredCots = cotizaciones.filter(c =>
    (filterEstado === 'todos' || c.estado === filterEstado) &&
    (c.empresa?.toLowerCase().includes(search.toLowerCase()) || c.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const isLead = activeTab === 'leads';
  const estados = isLead ? ESTADOS_LEAD : ESTADOS_COT;

  // Kanban columns
  const kanbanCols = ['Nuevo', 'Contactado', 'Cotizado', 'Muestra Enviada', 'Negociación'];

  // Pipeline stats
  const leadsActivos = leads.filter(l => !['Ganado','Perdido'].includes(l.estado));
  const valorPipeline = leadsActivos.reduce((s, l) => s + (l.presupuesto_estimado || 0), 0);
  const slaVencidos = leadsActivos.filter(l => {
    const d = getDiasEnEtapa(l);
    return SLA_LIMITS[l.estado] && d > SLA_LIMITS[l.estado];
  }).length;
  const tasaConversion = leads.length > 0 ? ((leads.filter(l => l.estado === 'Ganado').length / leads.length) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-white">Pipeline B2B</h1>
          <p className="text-teal-300/70 text-sm mt-1">{leads.length} leads • {cotizaciones.length} cotizaciones</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />
          {isLead ? 'Nuevo Lead' : 'Nueva Cotización'}
        </Button>
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads Activos', value: leadsActivos.length, sub: `${leads.filter(l=>l.calidad_lead==='Caliente').length} calientes`, color: '#14b8a6', icon: Users },
          { label: 'Valor Pipeline', value: valorPipeline > 0 ? `$${(valorPipeline/1000000).toFixed(1)}M` : '$—', sub: 'CLP estimado', color: '#14b8a6', icon: DollarSign },
          { label: 'SLA Vencidos', value: slaVencidos, sub: 'requieren acción hoy', color: slaVencidos > 0 ? '#f97316' : '#14b8a6', icon: AlertTriangle },
          { label: 'Tasa Conversión', value: `${tasaConversion}%`, sub: `Meta: 7% • ${leads.filter(l=>l.estado==='Ganado').length} ganados`, color: parseFloat(tasaConversion) >= 7 ? '#14b8a6' : '#f97316', icon: TrendingUp },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-300/70 uppercase tracking-wide">{kpi.label}</p>
                  <p className="font-poppins font-bold text-xl mt-1 text-white" style={{ color: kpi.color }}>{kpi.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-700/40">
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones ({cotizaciones.length})</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 ml-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 h-9 w-48" />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="leads" className="mt-4">
          {loading ? <div className="text-center py-12 text-muted-foreground">Cargando leads...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLeads.map(l => <LeadCard key={l.id} lead={l} onEdit={openEdit} onDelete={handleDelete} />)}
              {filteredLeads.length === 0 && (
                <div className="col-span-3 text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay leads. Agrega el primero.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cotizaciones" className="mt-4 space-y-3">
          {loading ? <div className="text-center py-12 text-muted-foreground">Cargando...</div> : (
            <>
              {filteredCots.map(c => <CotizacionRow key={c.id} cot={c} onEdit={openEdit} onDelete={handleDelete} onCrearOP={handleCrearOP} />)}
              {filteredCots.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No hay cotizaciones. Crea la primera.</p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          {slaVencidos > 0 && (
            <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-950/50 text-red-200 border border-red-700/60">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {slaVencidos} lead(s) con SLA vencido — actuar ahora (SLA: Nuevo &lt;24h, Cotizado &lt;72h)
            </div>
          )}
          <div className="flex gap-3 overflow-x-auto pb-4">
            {kanbanCols.map(estado => {
              const items = leads.filter(l => l.estado === estado);
              const vencidos = items.filter(l => getDiasEnEtapa(l) > (SLA_LIMITS[estado] || 99)).length;
              return (
                <div key={estado} className="flex-shrink-0 w-60">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div>
                      <h3 className="font-medium text-sm text-white">{estado}</h3>
                      {SLA_LIMITS[estado] && <p className="text-xs text-gray-400">SLA: &lt;{SLA_LIMITS[estado]}d</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {vencidos > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{vencidos}⚠</span>}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{items.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2 min-h-16">
                    {items.map(l => {
                      const dias = getDiasEnEtapa(l);
                      const slaV = SLA_LIMITS[estado] && dias > SLA_LIMITS[estado];
                      return (
                        <div
                          key={l.id}
                          onClick={() => { setActiveTab('leads'); openEdit(l); }}
                          className={`bg-slate-800/60 rounded-xl p-3 shadow-lg border text-sm cursor-pointer hover:shadow-lg transition-all ${
                            slaV ? 'border-red-500/60 bg-red-950/20' : 'border-slate-700/60'
                          }`}>
                          <p className="font-semibold text-white text-xs leading-tight">{l.empresa}</p>
                          <p className="text-xs text-gray-400">{l.contacto}</p>
                          <div className="flex items-center justify-between mt-2">
                            {l.calidad_lead && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                l.calidad_lead === 'Caliente' ? 'bg-red-100 text-red-600' :
                                l.calidad_lead === 'Tibio' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                              }`}>{l.calidad_lead}</span>
                            )}
                            <span className={`text-xs font-medium flex items-center gap-1 ml-auto ${
                              slaV ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                              {slaV ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {dias}d
                            </span>
                          </div>
                          {l.presupuesto_estimado > 0 && (
                            <p className="text-xs font-medium mt-1" style={{ color: '#0F8B6C' }}>${(l.presupuesto_estimado/1000).toFixed(0)}K</p>
                          )}
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-xs text-muted-foreground">Sin leads</div>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Ganado / Perdido */}
            {['Ganado','Perdido'].map(estado => {
              const items = leads.filter(l => l.estado === estado);
              return (
                <div key={estado} className="flex-shrink-0 w-48">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className={`font-medium text-sm ${estado === 'Ganado' ? 'text-green-700' : 'text-red-500'}`}>{estado}</h3>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(l => (
                      <div key={l.id} className={`rounded-xl p-3 border text-xs ${
                        estado === 'Ganado' ? 'bg-green-50 border-green-200' : 'bg-red-50/50 border-red-200'
                      }`}>
                        <p className="font-semibold">{l.empresa}</p>
                        {l.presupuesto_estimado > 0 && <p className="text-muted-foreground mt-0.5">${(l.presupuesto_estimado/1000).toFixed(0)}K</p>}
                      </div>
                    ))}
                  </div>
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
            <DialogTitle className="font-poppins">
              {editing ? 'Editar' : 'Nuevo'} {isLead ? 'Lead' : 'Cotización'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {isLead ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Empresa *</label><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Contacto *</label><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Teléfono</label><Input value={form.telefono||''} onChange={e=>setForm({...form,telefono:e.target.value})} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Canal</label>
                    <Select value={form.canal||''} onValueChange={v=>setForm({...form,canal:v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["WhatsApp","Instagram","Email","LinkedIn","Referido","Web","Otro"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                    <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{ESTADOS_LEAD.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select value={form.tipo||''} onValueChange={v=>setForm({...form,tipo:v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["B2B Corporativo","B2B Pyme","B2C"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs font-medium text-muted-foreground">Calidad Lead</label>
                    <Select value={form.calidad_lead||''} onValueChange={v=>setForm({...form,calidad_lead:v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["Frío","Tibio","Caliente","No Comercial"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Cantidad Estimada (u)</label><Input type="number" value={form.cantidad_estimada||''} onChange={e=>setForm({...form,cantidad_estimada:+e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Presupuesto (CLP)</label><Input type="number" value={form.presupuesto_estimado||''} onChange={e=>setForm({...form,presupuesto_estimado:+e.target.value})} className="mt-1" /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Producto de Interés</label><Input value={form.producto_interes||''} onChange={e=>setForm({...form,producto_interes:e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Próxima Acción</label><Input value={form.next_action||''} onChange={e=>setForm({...form,next_action:e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Notas</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-20" /></div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Empresa *</label><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Contacto</label><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} className="mt-1" /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Producto / SKU *</label><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} className="mt-1" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Cantidad</label><Input type="number" value={form.cantidad||''} onChange={e=>setForm({...form,cantidad:+e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Precio Unitario</label><Input type="number" value={form.precio_unitario||''} onChange={e=>setForm({...form,precio_unitario:+e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Descuento %</label><Input type="number" value={form.descuento_pct||''} onChange={e=>setForm({...form,descuento_pct:+e.target.value})} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Fee Personalización</label><Input type="number" value={form.fee_personalizacion||''} onChange={e=>setForm({...form,fee_personalizacion:+e.target.value})} className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Fee Packaging</label><Input type="number" value={form.fee_packaging||''} onChange={e=>setForm({...form,fee_packaging:+e.target.value})} className="mt-1" /></div>
                </div>
                <div className="p-3 rounded-xl font-poppins font-semibold text-sm" style={{ background: '#f0faf7', color: '#0F8B6C' }}>
                  Total estimado: ${((form.cantidad||0)*(form.precio_unitario||0)*(1-(form.descuento_pct||0)/100)+(form.fee_personalizacion||0)+(form.fee_packaging||0)).toLocaleString('es-CL')} CLP
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">Personalización</label>
                    <Select value={form.personalizacion_tipo||''} onValueChange={v=>setForm({...form,personalizacion_tipo:v})}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{["Láser UV","Serigrafía","Sin personalización"].map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs font-medium text-muted-foreground">Lead Time (días)</label><Input type="number" value={form.lead_time_dias||''} onChange={e=>setForm({...form,lead_time_dias:+e.target.value})} className="mt-1" /></div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                  <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_COT.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
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
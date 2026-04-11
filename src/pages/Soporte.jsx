import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  MessageSquare, Plus, Edit2, Trash2, Clock, CheckCircle2,
  AlertTriangle, Filter, Phone, Send, TrendingUp, Users, XCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIPOS = ["Cotización Corporativa", "Compra Individual", "Personalización Tienda", "Estado Pedido", "Pregunta General", "No Comercial"];
const ESTADOS = ["Sin responder", "Respondido", "En seguimiento", "Cerrado", "Descartado"];
const CALIDADES = ["Caliente", "Tibio", "Frío", "No Comercial"];
const CANALES = ["WhatsApp", "Instagram DM", "Email", "Web"];

const tipoColor = {
  "Cotización Corporativa": "bg-amber-100 text-amber-700",
  "Compra Individual": "bg-blue-100 text-blue-700",
  "Personalización Tienda": "bg-purple-100 text-purple-700",
  "Estado Pedido": "bg-gray-100 text-gray-600",
  "Pregunta General": "bg-gray-100 text-gray-500",
  "No Comercial": "bg-red-50 text-red-400",
};

const calidadColor = {
  Caliente: "text-red-600 bg-red-50 border border-red-200",
  Tibio: "text-amber-600 bg-amber-50 border border-amber-200",
  Frío: "text-blue-500 bg-blue-50 border border-blue-200",
  "No Comercial": "text-gray-400 bg-gray-50 border border-gray-200",
};

const estadoConfig = {
  "Sin responder": { color: "bg-red-100 text-red-700", icon: AlertTriangle },
  "Respondido": { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  "En seguimiento": { color: "bg-blue-100 text-blue-700", icon: Clock },
  "Cerrado": { color: "bg-gray-100 text-gray-500", icon: CheckCircle2 },
  "Descartado": { color: "bg-gray-50 text-gray-400", icon: XCircle },
};

// Scripts de respuesta según tipo
const SCRIPTS = {
  "Cotización Corporativa": `¡Hola! Gracias por escribir a Peyu 🌿\n\nPara preparar tu cotización necesito:\n• Cantidad de unidades estimada\n• Producto de interés\n• ¿Tienes logo listo? (formato SVG preferido)\n• Fecha requerida de entrega\n\nTe envío mockup y cotización en <24h. ¡Trabajamos con personalización láser gratis desde 10 unidades!`,
  "Compra Individual": `¡Hola! Gracias por escribir a Peyu 🌿\n\nPuedes ver todos nuestros productos en peyuchile.cl 🛒\n\nEnvíos a todo Chile. ¿En qué producto estás interesado? ¡Te ayudo!`,
  "Personalización Tienda": `¡Hola! Gracias por escribir a Peyu 🌿\n\nTenemos personalización láser UV en nuestras tiendas:\n📍 Francisco Bilbao 3775, local 6, Providencia\n📍 Pedro de Valdivia 6603, Macul\n\nHorario: Lun-Vie 10:00-18:00. ¿Te acomoda algún horario?`,
  "Estado Pedido": `¡Hola! Estamos revisando el estado de tu pedido. Te respondo en máximo 2 horas. 🙏`,
  "Pregunta General": `¡Hola! Gracias por escribir a Peyu 🌿\n\nEstamos aquí para ayudarte. ¿Cuéntame más sobre lo que necesitas?`,
  "No Comercial": `¡Muchas gracias por tu apoyo! 🐢♻️ Tu entusiasmo nos motiva a seguir reciclando toneladas de plástico cada año. ¡Si alguna vez necesitas productos o quieres cotizar regalos corporativos sustentables, aquí estamos!`,
};

const DEFAULTS = {
  nombre: '', telefono: '', mensaje: '', tipo: 'Cotización Corporativa',
  estado: 'Sin responder', calidad: 'Tibio', canal: 'WhatsApp',
  logo_enviado: false, convertido_lead: false
};

function ConsultaCard({ consulta, onEdit, onDelete, onConvertir }) {
  const cfg = estadoConfig[consulta.estado] || { color: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = cfg.icon;
  const esComercial = consulta.tipo !== 'No Comercial';
  const sinResponder = consulta.estado === 'Sin responder';

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-shadow hover:shadow-md ${sinResponder && esComercial ? 'border-amber-200' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-poppins font-semibold text-sm text-foreground truncate">{consulta.nombre}</p>
            {consulta.calidad && <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${calidadColor[consulta.calidad]}`}>{consulta.calidad}</span>}
          </div>
          {consulta.telefono && <p className="text-xs text-muted-foreground mt-0.5">{consulta.telefono}</p>}
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(consulta)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(consulta.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor[consulta.tipo] || 'bg-gray-100'}`}>{consulta.tipo}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
          <Icon className="w-3 h-3" />{consulta.estado}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{consulta.canal}</span>
      </div>

      {consulta.mensaje && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-2 line-clamp-2 italic">"{consulta.mensaje}"</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-2">
          {consulta.cantidad_estimada && <span>🎯 {consulta.cantidad_estimada.toLocaleString()}u</span>}
          {consulta.logo_enviado && <span className="text-green-600">✓ Logo</span>}
          {consulta.tiempo_respuesta_hrs && <span>⏱ {consulta.tiempo_respuesta_hrs}h</span>}
        </div>
        {esComercial && !consulta.convertido_lead && consulta.estado !== 'Descartado' && (
          <button onClick={() => onConvertir(consulta)}
            className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:opacity-80"
            style={{ background: '#f0faf7', color: '#0F8B6C' }}>
            → Crear Lead
          </button>
        )}
        {consulta.convertido_lead && <span className="text-green-600 text-xs font-medium">✓ Lead creado</span>}
      </div>
    </div>
  );
}

export default function Soporte() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showScript, setShowScript] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Consulta.list('-created_date', 200);
    setConsultas(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Consulta.update(editing.id, form);
    else await base44.entities.Consulta.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar consulta?')) return;
    await base44.entities.Consulta.delete(id);
    loadData();
  };

  const handleConvertir = async (consulta) => {
    await base44.entities.Lead.create({
      empresa: consulta.nombre,
      canal: consulta.canal,
      estado: 'Nuevo',
      tipo: 'B2B Corporativo',
      calidad_lead: consulta.calidad || 'Tibio',
      cantidad_estimada: consulta.cantidad_estimada,
      logo_recibido: consulta.logo_enviado,
      personalizacion: true,
      notas: `Convertido desde consulta WhatsApp: "${consulta.mensaje?.substring(0, 100)}"`,
    });
    await base44.entities.Consulta.update(consulta.id, { convertido_lead: true, estado: 'En seguimiento' });
    loadData();
  };

  const filtered = consultas.filter(c =>
    (filterEstado === 'todos' || c.estado === filterEstado) &&
    (filterTipo === 'todos' || c.tipo === filterTipo)
  );

  // Stats
  const sinResponder = consultas.filter(c => c.estado === 'Sin responder').length;
  const comerciales = consultas.filter(c => c.tipo !== 'No Comercial').length;
  const noComerciales = consultas.filter(c => c.tipo === 'No Comercial').length;
  const convertidos = consultas.filter(c => c.convertido_lead).length;
  const tasaComercial = consultas.length > 0 ? Math.round(comerciales / consultas.length * 100) : 0;
  const avgResp = consultas.filter(c => c.tiempo_respuesta_hrs > 0).length > 0
    ? (consultas.filter(c => c.tiempo_respuesta_hrs > 0).reduce((s, c) => s + c.tiempo_respuesta_hrs, 0) / consultas.filter(c => c.tiempo_respuesta_hrs > 0).length).toFixed(1)
    : null;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Soporte & WhatsApp</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Triage de consultas • SLA: respuesta &lt;2h • Meta: 40% leads comerciales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScript('Cotización Corporativa')} className="gap-2 text-sm">
            <MessageSquare className="w-4 h-4" />Scripts
          </Button>
          <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
            <Plus className="w-4 h-4" />Nueva Consulta
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Sin Responder', value: sinResponder, color: sinResponder > 3 ? '#D96B4D' : '#4B4F54', bg: sinResponder > 3 ? '#fdf3f0' : '#f5f5f5' },
          { label: 'Comerciales', value: comerciales, color: '#0F8B6C', bg: '#f0faf7' },
          { label: 'No Comerciales', value: noComerciales, color: '#9ca3af', bg: '#f9f9f9' },
          { label: 'Convertidos', value: convertidos, color: '#0F8B6C', bg: '#f0faf7' },
          { label: '% Leads Reales', value: `${tasaComercial}%`, color: tasaComercial >= 40 ? '#0F8B6C' : '#D96B4D', bg: tasaComercial >= 40 ? '#f0faf7' : '#fdf3f0' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SLA Reminder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: '⚡', label: 'SLA Respuesta inicial', meta: '<2 horas', actual: avgResp ? `${avgResp}h prom.` : 'Sin datos', ok: !avgResp || +avgResp < 2 },
          { icon: '📋', label: 'SLA Cotización formal', meta: '<24 horas', actual: 'Objetivo Blueprint', ok: true },
          { icon: '🎯', label: 'Meta leads comerciales', meta: '40% de consultas', actual: `${tasaComercial}% actual`, ok: tasaComercial >= 40 },
        ].map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${s.ok ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="font-medium text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.meta} • {s.actual}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="h-9 w-52"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} consultas</span>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando consultas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay consultas</p>
          <p className="text-sm mt-1">Registra las consultas de WhatsApp e Instagram para hacer seguimiento</p>
          <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Registrar consulta</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <ConsultaCard key={c.id} consulta={c} onEdit={openEdit} onDelete={handleDelete} onConvertir={handleConvertir} />
          ))}
        </div>
      )}

      {/* Modal consulta */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Consulta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nombre / Empresa *</label><Input value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Teléfono WhatsApp</label><Input value={form.telefono||''} onChange={e=>setForm({...form,telefono:e.target.value})} className="mt-1" placeholder="+569..." /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Mensaje original</label><textarea value={form.mensaje||''} onChange={e=>setForm({...form,mensaje:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-20" placeholder="Copia el mensaje recibido..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={form.tipo||''} onValueChange={v=>setForm({...form,tipo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={form.canal||''} onValueChange={v=>setForm({...form,canal:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
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
              <div><label className="text-xs font-medium text-muted-foreground">Calidad Lead</label>
                <Select value={form.calidad||''} onValueChange={v=>setForm({...form,calidad:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CALIDADES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Cantidad estimada (u)</label><Input type="number" value={form.cantidad_estimada||''} onChange={e=>setForm({...form,cantidad_estimada:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Tiempo respuesta (hrs)</label><Input type="number" step="0.5" value={form.tiempo_respuesta_hrs||''} onChange={e=>setForm({...form,tiempo_respuesta_hrs:+e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Respuesta enviada</label><textarea value={form.respuesta||''} onChange={e=>setForm({...form,respuesta:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-20" /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.logo_enviado||false} onChange={e=>setForm({...form,logo_enviado:e.target.checked})} className="rounded" />Logo recibido</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.convertido_lead||false} onChange={e=>setForm({...form,convertido_lead:e.target.checked})} className="rounded" />Convertido a Lead</label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Scripts */}
      <Dialog open={!!showScript} onOpenChange={() => setShowScript(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-poppins">Scripts de Respuesta WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Select value={showScript || ''} onValueChange={setShowScript}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            {showScript && SCRIPTS[showScript] && (
              <div className="relative">
                <pre className="text-sm text-foreground whitespace-pre-wrap bg-muted rounded-xl p-4 font-inter">{SCRIPTS[showScript]}</pre>
                <button
                  onClick={() => navigator.clipboard.writeText(SCRIPTS[showScript])}
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg bg-white border border-border hover:bg-muted transition-colors">
                  Copiar
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">💡 Personaliza el script con el nombre del cliente y producto específico antes de enviar.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
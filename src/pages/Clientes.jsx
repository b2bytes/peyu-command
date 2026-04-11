import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Users, Plus, Edit2, Trash2, Star, TrendingUp, Phone,
  Mail, Calendar, Award, AlertTriangle, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TIPOS = ["B2B Corporativo", "B2B Pyme", "B2C Recurrente", "Tienda Física"];
const ESTADOS = ["Activo", "Inactivo", "En Riesgo", "VIP", "Bloqueado"];
const SEGMENTOS = ["Tecnología", "Retail", "Educación", "Salud", "Finanzas", "Gobierno", "Horeca", "Otro"];
const CANALES = ["WhatsApp", "Email", "Web", "Tienda Física", "LinkedIn"];

const estadoColor = {
  "Activo": "bg-green-100 text-green-700",
  "VIP": "bg-amber-100 text-amber-700",
  "En Riesgo": "bg-red-100 text-red-700",
  "Inactivo": "bg-gray-100 text-gray-500",
  "Bloqueado": "bg-red-50 text-red-400",
};

const fmtClp = (n) => n >= 1_000_000
  ? `$${(n / 1_000_000).toFixed(1)}M`
  : `$${(n / 1_000).toFixed(0)}K`;

const DEFAULTS = {
  empresa: '', contacto: '', email: '', telefono: '', tipo: 'B2B Pyme',
  estado: 'Activo', pagos_al_dia: true, personalizacion_habitual: false
};

function ClienteCard({ cliente, onEdit, onDelete }) {
  const nps = cliente.nps_score;
  const npsColor = nps >= 9 ? '#0F8B6C' : nps >= 7 ? '#f59e0b' : '#D96B4D';
  const diasSinCompra = cliente.fecha_ultima_compra
    ? Math.floor((Date.now() - new Date(cliente.fecha_ultima_compra)) / 86400000)
    : null;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
      cliente.estado === 'VIP' ? 'border-amber-200' :
      cliente.estado === 'En Riesgo' ? 'border-red-200' : 'border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-poppins font-semibold text-sm truncate">{cliente.empresa}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estadoColor[cliente.estado] || 'bg-gray-100'}`}>
              {cliente.estado}
            </span>
          </div>
          {cliente.contacto && <p className="text-xs text-muted-foreground">{cliente.contacto}</p>}
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(cliente)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(cliente.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">LTV</p>
          <p className="font-poppins font-bold text-sm" style={{ color: '#0F8B6C' }}>
            {cliente.total_compras_clp ? fmtClp(cliente.total_compras_clp) : '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Pedidos</p>
          <p className="font-poppins font-bold text-sm text-foreground">{cliente.num_pedidos || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">NPS</p>
          <p className="font-poppins font-bold text-sm" style={{ color: nps ? npsColor : '#9ca3af' }}>
            {nps ?? '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{cliente.tipo}</span>
        {cliente.segmento && <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{cliente.segmento}</span>}
        {cliente.personalizacion_habitual && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">⚡ Personaliz.</span>}
        {!cliente.pagos_al_dia && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500">⚠ Mora</span>}
      </div>

      {diasSinCompra !== null && diasSinCompra > 60 && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1">
          ⏰ Sin compra hace {diasSinCompra} días — recontactar
        </div>
      )}

      <div className="flex gap-3 mt-3 pt-2 border-t border-border">
        {cliente.telefono && (
          <a href={`https://wa.me/${cliente.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs text-green-600 hover:underline">
            <Phone className="w-3 h-3" />WhatsApp
          </a>
        )}
        {cliente.email && (
          <a href={`mailto:${cliente.email}`}
            className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
            <Mail className="w-3 h-3" />Email
          </a>
        )}
        {cliente.proximo_recontacto && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Calendar className="w-3 h-3" />{cliente.proximo_recontacto}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Cliente.list('-total_compras_clp', 200);
    setClientes(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Cliente.update(editing.id, form);
    else await base44.entities.Cliente.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return;
    await base44.entities.Cliente.delete(id);
    loadData();
  };

  const filtered = clientes.filter(c => {
    const matchEstado = filterEstado === 'todos' || c.estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo;
    const matchSearch = !search || c.empresa?.toLowerCase().includes(search.toLowerCase()) || c.contacto?.toLowerCase().includes(search.toLowerCase());
    return matchEstado && matchTipo && matchSearch;
  });

  // Stats
  const totalLTV = clientes.reduce((s, c) => s + (c.total_compras_clp || 0), 0);
  const vips = clientes.filter(c => c.estado === 'VIP').length;
  const enRiesgo = clientes.filter(c => c.estado === 'En Riesgo').length;
  const avgTicket = clientes.filter(c => c.ticket_promedio).length > 0
    ? clientes.reduce((s, c) => s + (c.ticket_promedio || 0), 0) / clientes.filter(c => c.ticket_promedio).length
    : 0;
  const recontactar = clientes.filter(c => {
    if (!c.fecha_ultima_compra) return false;
    return Math.floor((Date.now() - new Date(c.fecha_ultima_compra)) / 86400000) > 60;
  }).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Base post-venta · LTV · Seguimiento · Recompra</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nuevo Cliente
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Clientes', value: clientes.length, color: '#0F8B6C' },
          { label: 'LTV Total', value: totalLTV > 0 ? fmtClp(totalLTV) : '—', color: '#0F8B6C' },
          { label: 'VIP', value: vips, color: '#f59e0b' },
          { label: 'En Riesgo', value: enRiesgo, color: enRiesgo > 0 ? '#D96B4D' : '#0F8B6C' },
          { label: 'Recontactar', value: recontactar, color: recontactar > 0 ? '#D96B4D' : '#9ca3af' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alerta recontacto */}
      {recontactar > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {recontactar} cliente{recontactar > 1 ? 's' : ''} sin compra hace más de 60 días — ideal para campaña de reactivación
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa o contacto..." className="h-9 w-56" />
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos tipos</SelectItem>
            {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} clientes</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando clientes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin clientes registrados</p>
          <p className="text-sm mt-1">Agrega clientes para hacer seguimiento de LTV y recompra</p>
          <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Agregar cliente</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <ClienteCard key={c.id} cliente={c} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Empresa *</label><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Contacto</label><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Teléfono</label><Input value={form.telefono||''} onChange={e=>setForm({...form,telefono:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={form.tipo||''} onValueChange={v=>setForm({...form,tipo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Segmento</label>
                <Select value={form.segmento||''} onValueChange={v=>setForm({...form,segmento:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEGMENTOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Canal Preferido</label>
                <Select value={form.canal_preferido||''} onValueChange={v=>setForm({...form,canal_preferido:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">LTV Total (CLP)</label><Input type="number" value={form.total_compras_clp||''} onChange={e=>setForm({...form,total_compras_clp:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Nº Pedidos</label><Input type="number" value={form.num_pedidos||''} onChange={e=>setForm({...form,num_pedidos:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">NPS (0-10)</label><Input type="number" min="0" max="10" value={form.nps_score||''} onChange={e=>setForm({...form,nps_score:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Última Compra</label><Input type="date" value={form.fecha_ultima_compra||''} onChange={e=>setForm({...form,fecha_ultima_compra:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Próximo Recontacto</label><Input type="date" value={form.proximo_recontacto||''} onChange={e=>setForm({...form,proximo_recontacto:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">SKU Favorito</label><Input value={form.sku_favorito||''} onChange={e=>setForm({...form,sku_favorito:e.target.value})} className="mt-1" placeholder="BOT-001..." /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.pagos_al_dia||false} onChange={e=>setForm({...form,pagos_al_dia:e.target.checked})} />Pagos al día</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.personalizacion_habitual||false} onChange={e=>setForm({...form,personalizacion_habitual:e.target.checked})} />Usa personalización</label>
            </div>
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
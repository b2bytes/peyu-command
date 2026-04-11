import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, Plus, Edit2, Trash2, Package, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIAS = ["Material Reciclado", "Packaging", "Tintes / Pigmentos", "Maquinaria", "Servicios Externos", "Logística", "Marketing", "Tecnología", "Otro"];
const ESTADOS = ["Activo", "Inactivo", "En Evaluación", "Bloqueado"];
const CALIDADES = ["Excelente", "Bueno", "Regular", "Malo"];

const catColor = {
  "Material Reciclado": "bg-green-100 text-green-700",
  "Packaging": "bg-blue-100 text-blue-700",
  "Tintes / Pigmentos": "bg-purple-100 text-purple-700",
  "Maquinaria": "bg-gray-100 text-gray-600",
  "Servicios Externos": "bg-amber-100 text-amber-700",
  "Logística": "bg-orange-100 text-orange-700",
  "Marketing": "bg-pink-100 text-pink-600",
  "Tecnología": "bg-cyan-100 text-cyan-700",
  "Otro": "bg-gray-100 text-gray-500",
};

const calidadColor = {
  "Excelente": "text-green-600",
  "Bueno": "text-blue-500",
  "Regular": "text-amber-500",
  "Malo": "text-red-500",
};

const fmtClp = (n) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${(n/1_000).toFixed(0)}K`;

const DEFAULTS = { nombre: '', categoria: 'Material Reciclado', estado: 'Activo', certificacion_reciclado: false };

function ProveedorCard({ prov, onEdit, onDelete }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
      prov.estado === 'Bloqueado' ? 'border-red-200 opacity-70' :
      prov.calidad === 'Malo' ? 'border-amber-200' : 'border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-poppins font-semibold text-sm truncate">{prov.nombre}</p>
            {prov.certificacion_reciclado && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">♻ Cert.</span>
            )}
          </div>
          {prov.contacto && <p className="text-xs text-muted-foreground">{prov.contacto}</p>}
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(prov)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(prov.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[prov.categoria] || 'bg-gray-100'}`}>{prov.categoria}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          prov.estado === 'Activo' ? 'bg-green-100 text-green-700' :
          prov.estado === 'Bloqueado' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
        }`}>{prov.estado}</span>
        {prov.calidad && (
          <span className={`text-xs font-medium ${calidadColor[prov.calidad]}`}>
            ★ {prov.calidad}
          </span>
        )}
      </div>

      {prov.producto_servicio && (
        <p className="text-xs text-muted-foreground mb-2 italic">"{prov.producto_servicio}"</p>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Lead Time</p>
          <p className="font-semibold text-sm text-foreground">{prov.lead_time_dias ? `${prov.lead_time_dias}d` : '—'}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Pago</p>
          <p className="font-semibold text-sm text-foreground">{prov.pago_dias ? `${prov.pago_dias}d` : '—'}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Gasto/año</p>
          <p className="font-semibold text-sm" style={{ color: '#0F8B6C' }}>{prov.monto_anual_clp ? fmtClp(prov.monto_anual_clp) : '—'}</p>
        </div>
      </div>

      {prov.notas && (
        <p className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded-lg px-2 py-1 line-clamp-1">{prov.notas}</p>
      )}
    </div>
  );
}

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Proveedor.list('-created_date', 100);
    setProveedores(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Proveedor.update(editing.id, form);
    else await base44.entities.Proveedor.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    await base44.entities.Proveedor.delete(id);
    loadData();
  };

  const filtered = proveedores.filter(p =>
    (filterCat === 'todas' || p.categoria === filterCat) &&
    (filterEstado === 'todos' || p.estado === filterEstado)
  );

  const activos = proveedores.filter(p => p.estado === 'Activo').length;
  const certificados = proveedores.filter(p => p.certificacion_reciclado).length;
  const gastoTotal = proveedores.reduce((s, p) => s + (p.monto_anual_clp || 0), 0);
  const sinCert = proveedores.filter(p => p.categoria === 'Material Reciclado' && !p.certificacion_reciclado).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground text-sm mt-1">Cadena de suministro · Material reciclado · Packaging · Servicios</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nuevo Proveedor
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Proveedores Activos', value: activos, color: '#0F8B6C' },
          { label: 'Certificados ♻', value: certificados, color: '#0F8B6C' },
          { label: 'Gasto Anual Est.', value: gastoTotal > 0 ? fmtClp(gastoTotal) : '—', color: '#D96B4D' },
          { label: 'Mat. sin certif.', value: sinCert, color: sinCert > 0 ? '#D96B4D' : '#9ca3af' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {sinCert > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {sinCert} proveedor(es) de material reciclado sin certificación — importante para trazabilidad ESG
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} proveedores</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin proveedores registrados</p>
          <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Agregar proveedor</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <ProveedorCard key={p.id} prov={p} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nombre *</label><Input value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">RUT</label><Input value={form.rut||''} onChange={e=>setForm({...form,rut:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Contacto</label><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Categoría *</label>
                <Select value={form.categoria||''} onValueChange={v=>setForm({...form,categoria:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Producto / Servicio</label><Input value={form.producto_servicio||''} onChange={e=>setForm({...form,producto_servicio:e.target.value})} className="mt-1" placeholder="Pellet HDPE reciclado 100%..." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Lead Time (días)</label><Input type="number" value={form.lead_time_dias||''} onChange={e=>setForm({...form,lead_time_dias:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Plazo Pago (días)</label><Input type="number" value={form.pago_dias||''} onChange={e=>setForm({...form,pago_dias:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Calificación</label>
                <Select value={form.calidad||''} onValueChange={v=>setForm({...form,calidad:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CALIDADES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Gasto Anual (CLP)</label><Input type="number" value={form.monto_anual_clp||''} onChange={e=>setForm({...form,monto_anual_clp:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Último Pedido</label><Input type="date" value={form.fecha_ultimo_pedido||''} onChange={e=>setForm({...form,fecha_ultimo_pedido:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.certificacion_reciclado||false} onChange={e=>setForm({...form,certificacion_reciclado:e.target.checked})} />
              Certifica material reciclado (trazabilidad ESG)
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
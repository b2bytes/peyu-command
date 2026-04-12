import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShoppingCart, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2, Truck, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIAS = ["Material Reciclado", "Packaging", "Tintes / Pigmentos", "Maquinaria", "Servicios Externos", "Logística", "Otro"];
const ESTADOS = ["Borrador", "Enviada", "Confirmada", "En Tránsito", "Recibida", "Cancelada"];

const estadoConfig = {
  "Borrador":      { color: "#9ca3af", bg: "#f3f4f6", icon: Clock },
  "Enviada":       { color: "#3b82f6", bg: "#eff6ff", icon: Clock },
  "Confirmada":    { color: "#f59e0b", bg: "#fffbeb", icon: CheckCircle2 },
  "En Tránsito":   { color: "#8b5cf6", bg: "#f5f3ff", icon: Truck },
  "Recibida":      { color: "#0F8B6C", bg: "#f0faf7", icon: CheckCircle2 },
  "Cancelada":     { color: "#D96B4D", bg: "#fdf3f0", icon: AlertTriangle },
};

const fmtCLP = (v) => v >= 1_000_000 ? `$${(v/1_000_000).toFixed(1)}M` : `$${(v/1_000).toFixed(0)}K`;
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }) : '—';

const DEFAULTS = {
  proveedor: '', categoria: 'Material Reciclado', estado: 'Borrador',
  fecha_emision: new Date().toISOString().split('T')[0],
  anticipo_pagado: false, es_material_reciclado: false, certificado_reciclado: false,
};

function OCCard({ oc, onEdit, onDelete }) {
  const cfg = estadoConfig[oc.estado] || estadoConfig["Borrador"];
  const Icon = cfg.icon;
  const diasRetraso = oc.fecha_entrega_prometida && oc.estado !== 'Recibida' && oc.estado !== 'Cancelada'
    ? Math.floor((new Date() - new Date(oc.fecha_entrega_prometida)) / 86400000)
    : null;

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all ${diasRetraso > 0 ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-poppins font-semibold text-sm">{oc.proveedor}</p>
            {oc.numero_oc && <span className="text-xs text-muted-foreground font-mono">#{oc.numero_oc}</span>}
            {oc.es_material_reciclado && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">♻</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{oc.categoria}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(oc)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(oc.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
          <Icon className="w-3 h-3" />{oc.estado}
        </span>
        {diasRetraso > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">⚠ {diasRetraso}d atraso</span>
        )}
      </div>

      {oc.descripcion && <p className="text-xs text-muted-foreground mb-3 italic line-clamp-1">"{oc.descripcion}"</p>}

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="font-semibold text-sm" style={{ color: '#0F8B6C' }}>{oc.total_clp ? fmtCLP(oc.total_clp) : '—'}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Emisión</p>
          <p className="font-semibold text-xs text-foreground">{fmtDate(oc.fecha_emision)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Entrega</p>
          <p className="font-semibold text-xs" style={{ color: diasRetraso > 0 ? '#D96B4D' : 'inherit' }}>{fmtDate(oc.fecha_entrega_prometida)}</p>
        </div>
      </div>

      {oc.anticipo_pagado && (
        <p className="text-xs text-green-600 mt-2">✓ Anticipo pagado ({oc.porcentaje_anticipo || 50}%)</p>
      )}
    </div>
  );
}

export default function Compras() {
  const [ocs, setOcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCat, setFilterCat] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.OrdenCompra.list('-fecha_emision', 200);
    setOcs(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (o) => { setEditing(o); setForm(o); setShowModal(true); };

  const handleSave = async () => {
    const total = (form.cantidad || 0) * (form.precio_unitario || 0) || form.total_clp;
    const data = { ...form, total_clp: total || form.total_clp };
    if (editing) await base44.entities.OrdenCompra.update(editing.id, data);
    else await base44.entities.OrdenCompra.create(data);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar OC?')) return;
    await base44.entities.OrdenCompra.delete(id);
    loadData();
  };

  const filtered = ocs.filter(o =>
    (filterEstado === 'todos' || o.estado === filterEstado) &&
    (filterCat === 'todas' || o.categoria === filterCat)
  );

  // KPIs
  const activas = ocs.filter(o => !['Recibida', 'Cancelada'].includes(o.estado)).length;
  const enTransito = ocs.filter(o => o.estado === 'En Tránsito').length;
  const totalComprometido = ocs.filter(o => !['Cancelada'].includes(o.estado)).reduce((s, o) => s + (o.total_clp || 0), 0);
  const atrasadas = ocs.filter(o => {
    if (!o.fecha_entrega_prometida || ['Recibida', 'Cancelada'].includes(o.estado)) return false;
    return new Date() > new Date(o.fecha_entrega_prometida);
  }).length;
  const recicladas = ocs.filter(o => o.es_material_reciclado).length;
  const pctReciclado = ocs.length > 0 ? Math.round((recicladas / ocs.length) * 100) : 0;

  // Agrupado por categoría para pipeline
  const porEstado = ESTADOS.map(estado => ({
    estado,
    items: ocs.filter(o => o.estado === estado),
    total: ocs.filter(o => o.estado === estado).reduce((s, o) => s + (o.total_clp || 0), 0),
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Compras & Supply Chain</h1>
          <p className="text-muted-foreground text-sm mt-1">Órdenes de compra · Proveedores · Trazabilidad material reciclado</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nueva OC
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'OCs Activas', value: activas, color: '#0F8B6C' },
          { label: 'En Tránsito', value: enTransito, color: '#8b5cf6' },
          { label: 'Comprometido', value: fmtCLP(totalComprometido), color: '#D96B4D' },
          { label: 'Con Atraso', value: atrasadas, color: atrasadas > 0 ? '#D96B4D' : '#9ca3af' },
          { label: '% Reciclado', value: `${pctReciclado}%`, color: '#0F8B6C' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="font-poppins font-bold text-xl mt-1" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {atrasadas > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {atrasadas} OC(s) con atraso en entrega — revisar con proveedor
        </div>
      )}

      <Tabs defaultValue="lista">
        <TabsList className="bg-muted">
          <TabsTrigger value="lista">Lista OCs</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Supply</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">{filtered.length} OCs</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin órdenes de compra</p>
              <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Nueva OC</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(o => (
                <OCCard key={o.id} oc={o} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {porEstado.map((col) => {
              const cfg = estadoConfig[col.estado] || {};
              return (
                <div key={col.estado} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.estado}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{col.items.length}</span>
                  </div>
                  {col.total > 0 && (
                    <p className="text-xs text-muted-foreground px-1">{fmtCLP(col.total)}</p>
                  )}
                  <div className="space-y-2">
                    {col.items.map(o => (
                      <div key={o.id} className="bg-white rounded-lg p-2.5 border border-border shadow-sm cursor-pointer hover:shadow-md" onClick={() => openEdit(o)}>
                        <p className="text-xs font-semibold truncate">{o.proveedor}</p>
                        <p className="text-xs text-muted-foreground truncate">{o.categoria}</p>
                        {o.total_clp > 0 && <p className="text-xs font-bold mt-1" style={{ color: '#0F8B6C' }}>{fmtCLP(o.total_clp)}</p>}
                        {o.es_material_reciclado && <span className="text-xs text-green-600">♻</span>}
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <div className="border-2 border-dashed border-muted rounded-lg p-3 text-center text-xs text-muted-foreground">Vacío</div>
                    )}
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
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Orden de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Proveedor *</label><Input value={form.proveedor||''} onChange={e=>setForm({...form,proveedor:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">N° OC</label><Input value={form.numero_oc||''} onChange={e=>setForm({...form,numero_oc:e.target.value})} className="mt-1" placeholder="OC-2026-001" /></div>
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
            <div><label className="text-xs font-medium text-muted-foreground">Descripción / Items</label>
              <textarea value={form.descripcion||''} onChange={e=>setForm({...form,descripcion:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" placeholder="Pellet HDPE reciclado 200kg..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Cantidad</label><Input type="number" value={form.cantidad||''} onChange={e=>setForm({...form,cantidad:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Unidad</label><Input value={form.unidad||''} onChange={e=>setForm({...form,unidad:e.target.value})} className="mt-1" placeholder="kg" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Precio Unit. (CLP)</label><Input type="number" value={form.precio_unitario||''} onChange={e=>setForm({...form,precio_unitario:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Total CLP</label>
                <Input type="number" value={form.total_clp || ((form.cantidad||0)*(form.precio_unitario||0)) || ''} onChange={e=>setForm({...form,total_clp:+e.target.value})} className="mt-1" />
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">N° Factura</label><Input value={form.numero_factura||''} onChange={e=>setForm({...form,numero_factura:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Emisión *</label><Input type="date" value={form.fecha_emision||''} onChange={e=>setForm({...form,fecha_emision:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Entrega Prometida</label><Input type="date" value={form.fecha_entrega_prometida||''} onChange={e=>setForm({...form,fecha_entrega_prometida:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">% Anticipo</label><Input type="number" value={form.porcentaje_anticipo||''} onChange={e=>setForm({...form,porcentaje_anticipo:+e.target.value})} className="mt-1" placeholder="50" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Recepción Real</label><Input type="date" value={form.fecha_recepcion_real||''} onChange={e=>setForm({...form,fecha_recepcion_real:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.anticipo_pagado||false} onChange={e=>setForm({...form,anticipo_pagado:e.target.checked})} />
                Anticipo pagado
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.es_material_reciclado||false} onChange={e=>setForm({...form,es_material_reciclado:e.target.checked})} />
                ♻ Es material reciclado / sostenible
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.certificado_reciclado||false} onChange={e=>setForm({...form,certificado_reciclado:e.target.checked})} />
                Incluye certificación ESG
              </label>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-14" /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar OC</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  FileText, Plus, Edit2, Trash2, Download, Loader2,
  CheckCircle2, Clock, XCircle, AlertTriangle, Send
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ESTADOS = ["Borrador", "Enviada", "Aceptada", "Rechazada", "Vencida"];
const TIPOS_PERSONAL = ["Láser UV", "Serigrafía", "Sin personalización"];
const PACKAGING = ["Estándar (stock)", "Personalizado", "Sin packaging"];

const estadoConfig = {
  "Borrador":   { color: "#9ca3af", bg: "#f3f4f6", icon: Clock },
  "Enviada":    { color: "#3b82f6", bg: "#eff6ff", icon: Send },
  "Aceptada":   { color: "#0F8B6C", bg: "#f0faf7", icon: CheckCircle2 },
  "Rechazada":  { color: "#D96B4D", bg: "#fdf3f0", icon: XCircle },
  "Vencida":    { color: "#9ca3af", bg: "#f3f4f6", icon: AlertTriangle },
};

const fmtCLP = (v) => v ? `$${Number(v).toLocaleString('es-CL')}` : '—';
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const DEFAULTS = {
  estado: 'Borrador', cantidad: 1, personalizacion_tipo: 'Sin personalización',
  packaging: 'Estándar (stock)', es_express: false, descuento_pct: 0,
  fecha_envio: new Date().toISOString().split('T')[0],
};

export default function Cotizaciones() {
  const [cots, setCots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [exporting, setExporting] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Cotizacion.list('-created_date', 200);
    setCots(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const calcTotal = (f) => {
    const base = (f.precio_unitario || 0) * (f.cantidad || 1) * (1 - (f.descuento_pct || 0) / 100);
    const fees = (f.fee_personalizacion || 0) + (f.fee_packaging || 0);
    const express = f.es_express ? Math.round(base * 0.12) : 0;
    return Math.round(base + fees + express);
  };

  const handleSave = async () => {
    const total = calcTotal(form);
    const data = { ...form, total };
    if (editing) await base44.entities.Cotizacion.update(editing.id, data);
    else await base44.entities.Cotizacion.create(data);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar cotización?')) return;
    await base44.entities.Cotizacion.delete(id);
    loadData();
  };

  const handleExportPDF = async (cot) => {
    setExporting(cot.id);
    const response = await base44.functions.invoke('exportCotizacionPDF', { cotizacion_id: cot.id });
    // response.data is the PDF in base64 or arraybuffer — handle blob download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion-Peyu-${cot.numero || cot.id.slice(-6)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  };

  const filtered = cots.filter(c => filterEstado === 'todos' || c.estado === filterEstado);

  // KPIs
  const aceptadas = cots.filter(c => c.estado === 'Aceptada');
  const enviadas = cots.filter(c => c.estado === 'Enviada');
  const totalPipeline = enviadas.reduce((s, c) => s + (c.total || 0), 0);
  const totalCerrado = aceptadas.reduce((s, c) => s + (c.total || 0), 0);
  const tasaConversion = (cots.filter(c => ['Aceptada', 'Rechazada'].includes(c.estado)).length > 0)
    ? Math.round(aceptadas.length / cots.filter(c => ['Aceptada', 'Rechazada'].includes(c.estado)).length * 100)
    : null;

  // Agrupado por estado para pipeline
  const pipeline = ESTADOS.map(estado => ({
    estado,
    items: cots.filter(c => c.estado === estado),
    total: cots.filter(c => c.estado === estado).reduce((s, c) => s + (c.total || 0), 0),
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold">Cotizaciones B2B</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de presupuestos · Exportar PDF profesional</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nueva Cotización
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pipeline Abierto', value: `$${(totalPipeline/1_000_000).toFixed(1)}M`, sub: `${enviadas.length} cotizaciones`, color: '#3b82f6' },
          { label: 'Cerrado Ganado', value: `$${(totalCerrado/1_000_000).toFixed(1)}M`, sub: `${aceptadas.length} aceptadas`, color: '#0F8B6C' },
          { label: 'Tasa Conversión', value: tasaConversion !== null ? `${tasaConversion}%` : 'N/D', sub: 'Aceptadas / Decididas', color: tasaConversion >= 50 ? '#0F8B6C' : '#D96B4D' },
          { label: 'Total Cotizaciones', value: cots.length, sub: 'históricas', color: '#4B4F54' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="font-poppins font-bold text-2xl mt-1" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="lista">
        <TabsList className="bg-muted">
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        {/* ── LISTA ── */}
        <TabsContent value="lista" className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} cotizaciones</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Sin cotizaciones</p>
              <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Nueva</Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">N° / Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">SKU / Personal.</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Fecha</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const cfg = estadoConfig[c.estado] || estadoConfig["Borrador"];
                    const Icon = cfg.icon;
                    return (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold">{c.empresa}</p>
                          <p className="text-xs text-muted-foreground font-mono">{c.numero || `—`}</p>
                          {c.contacto && <p className="text-xs text-muted-foreground">{c.contacto}</p>}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="font-medium">{c.sku || '—'}</p>
                          <p className="text-xs text-muted-foreground">{c.personalizacion_tipo || '—'} · {c.cantidad || 0}u</p>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                          <p>{fmtDate(c.fecha_envio)}</p>
                          {c.fecha_vencimiento && <p className="text-red-400">vence {fmtDate(c.fecha_vencimiento)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>{fmtCLP(c.total)}</p>
                          {c.descuento_pct > 0 && <p className="text-xs text-muted-foreground">-{c.descuento_pct}% desc.</p>}
                          {c.es_express && <p className="text-xs text-amber-500">⚡ Express</p>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                            <Icon className="w-3 h-3" />{c.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleExportPDF(c)}
                              disabled={exporting === c.id}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="Exportar PDF"
                            >
                              {exporting === c.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                : <Download className="w-3.5 h-3.5" style={{ color: '#0F8B6C' }} />}
                            </button>
                            <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-muted rounded-lg">
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── PIPELINE ── */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {pipeline.map(col => {
              const cfg = estadoConfig[col.estado] || {};
              return (
                <div key={col.estado} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: cfg.color }}>{col.estado}</span>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{col.items.length}</span>
                  </div>
                  {col.total > 0 && <p className="text-xs text-muted-foreground px-1">${(col.total/1_000_000).toFixed(1)}M</p>}
                  <div className="space-y-2">
                    {col.items.map(c => (
                      <div key={c.id} className="bg-white rounded-xl p-3 border border-border shadow-sm cursor-pointer hover:shadow-md" onClick={() => openEdit(c)}>
                        <p className="text-xs font-semibold truncate">{c.empresa}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.sku || '—'} · {c.cantidad || 0}u</p>
                        <p className="text-xs font-bold mt-1" style={{ color: '#0F8B6C' }}>{fmtCLP(c.total)}</p>
                        <div className="flex gap-1 mt-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExportPDF(c); }}
                            className="flex-1 text-xs py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                          >
                            {exporting === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                          </button>
                        </div>
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <div className="border-2 border-dashed border-muted rounded-xl p-3 text-center text-xs text-muted-foreground">Vacío</div>
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
        <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Cotización</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">N° Cotización</label><Input value={form.numero||''} onChange={e=>setForm({...form,numero:e.target.value})} className="mt-1" placeholder="COT-2026-001" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Estado</label>
                <Select value={form.estado||''} onValueChange={v=>setForm({...form,estado:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Empresa *</label><Input value={form.empresa||''} onChange={e=>setForm({...form,empresa:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Contacto</label><Input value={form.contacto||''} onChange={e=>setForm({...form,contacto:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">SKU / Producto *</label><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} className="mt-1" placeholder="SOPC-001" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Cantidad (u) *</label><Input type="number" value={form.cantidad||''} onChange={e=>setForm({...form,cantidad:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Precio Unitario (CLP)</label><Input type="number" value={form.precio_unitario||''} onChange={e=>setForm({...form,precio_unitario:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Descuento (%)</label><Input type="number" value={form.descuento_pct||''} onChange={e=>setForm({...form,descuento_pct:+e.target.value})} className="mt-1" placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Tipo Personalización</label>
                <Select value={form.personalizacion_tipo||''} onValueChange={v=>setForm({...form,personalizacion_tipo:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_PERSONAL.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Packaging</label>
                <Select value={form.packaging||''} onValueChange={v=>setForm({...form,packaging:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PACKAGING.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Fee Personalización (CLP)</label><Input type="number" value={form.fee_personalizacion||''} onChange={e=>setForm({...form,fee_personalizacion:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fee Packaging (CLP)</label><Input type="number" value={form.fee_packaging||''} onChange={e=>setForm({...form,fee_packaging:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Lead Time (días)</label><Input type="number" value={form.lead_time_dias||''} onChange={e=>setForm({...form,lead_time_dias:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Envío</label><Input type="date" value={form.fecha_envio||''} onChange={e=>setForm({...form,fecha_envio:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Fecha Vencimiento</label><Input type="date" value={form.fecha_vencimiento||''} onChange={e=>setForm({...form,fecha_vencimiento:e.target.value})} className="mt-1" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.es_express||false} onChange={e=>setForm({...form,es_express:e.target.checked})} />
              ⚡ Pedido Express (+12%)
            </label>
            <div><label className="text-xs font-medium text-muted-foreground">URL Mockup</label><Input value={form.mockup_url||''} onChange={e=>setForm({...form,mockup_url:e.target.value})} className="mt-1" placeholder="https://..." /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label>
              <textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" />
            </div>
            {/* Total calculado */}
            <div className="flex justify-between items-center bg-muted/40 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">Total estimado</span>
              <span className="font-poppins font-bold text-lg" style={{ color: '#0F8B6C' }}>{fmtCLP(calcTotal(form))}</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
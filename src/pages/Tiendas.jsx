import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Store, Plus, Edit2, Trash2, MapPin, DollarSign, Zap, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const TIENDAS = [
  { id: "Providencia (F. Bilbao 3775)", nombre: "Providencia", dir: "Francisco Bilbao 3775, local 6", horario: "Lun-Vie 10:00-18:00", color: "#0F8B6C" },
  { id: "Macul (P. de Valdivia 6603)", nombre: "Macul", dir: "Pedro de Valdivia 6603", horario: "Lun-Vie 10:00-18:00", color: "#D96B4D" },
];
const TIPOS_VENTA = ["Producto stock", "Personalización en tienda", "Retiro pedido web", "Regalo corporativo"];
const MEDIOS_PAGO = ["Efectivo", "Débito", "Crédito", "Transferencia", "WebPay"];
const COLORS = ["#0F8B6C", "#D96B4D", "#A7D9C9", "#4B4F54", "#E7D8C6"];

const fmtClp = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

const DEFAULTS = {
  tienda: "Providencia (F. Bilbao 3775)",
  fecha: new Date().toISOString().split('T')[0],
  tipo_venta: "Producto stock",
  cantidad: 1,
  medio_pago: "Débito",
  personalizacion_laser: false,
  listo_en_min: 15,
};

function VentaRow({ venta, onEdit, onDelete }) {
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="py-3 px-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          venta.tienda?.includes('Providencia') ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>{venta.tienda?.includes('Providencia') ? 'Providencia' : 'Macul'}</span>
      </td>
      <td className="py-3 px-3 text-sm text-muted-foreground">{venta.fecha}</td>
      <td className="py-3 px-3 text-sm text-foreground">{venta.tipo_venta}</td>
      <td className="py-3 px-3 text-sm text-muted-foreground">{venta.sku || '—'}</td>
      <td className="py-3 px-3 text-sm text-center">{venta.cantidad || 1}</td>
      <td className="py-3 px-3 text-sm font-semibold text-right" style={{ color: '#0F8B6C' }}>
        {venta.total ? fmtClp(venta.total) : '—'}
      </td>
      <td className="py-3 px-3 text-sm text-center">
        {venta.personalizacion_laser && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">⚡ Láser</span>}
      </td>
      <td className="py-3 px-3">
        <div className="flex gap-1 justify-end">
          <button onClick={() => onEdit(venta)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(venta.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </td>
    </tr>
  );
}

export default function Tiendas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTienda, setFilterTienda] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.VentaTienda.list('-fecha', 500);
    setVentas(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (v) => { setEditing(v); setForm(v); setShowModal(true); };

  const handleSave = async () => {
    const total = (form.cantidad || 1) * (form.precio_unitario || 0);
    const data = { ...form, total: form.total || total };
    if (editing) await base44.entities.VentaTienda.update(editing.id, data);
    else await base44.entities.VentaTienda.create(data);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar venta?')) return;
    await base44.entities.VentaTienda.delete(id);
    loadData();
  };

  const filtered = ventas.filter(v =>
    filterTienda === 'todas' || v.tienda === filterTienda
  );

  // Stats por tienda
  const statsTienda = TIENDAS.map(t => {
    const tv = ventas.filter(v => v.tienda === t.id);
    const total = tv.reduce((s, v) => s + (v.total || 0), 0);
    const laser = tv.filter(v => v.personalizacion_laser).length;
    return { ...t, ventas: tv.length, total, laser };
  });

  const totalGlobal = ventas.reduce((s, v) => s + (v.total || 0), 0);
  const laserTotal = ventas.filter(v => v.personalizacion_laser).length;

  // Chart data: ventas por tipo
  const porTipo = TIPOS_VENTA.map(t => ({
    name: t.split(' ')[0],
    value: ventas.filter(v => v.tipo_venta === t).length,
    monto: ventas.filter(v => v.tipo_venta === t).reduce((s, v) => s + (v.total || 0), 0),
  })).filter(t => t.value > 0);

  // Chart ultimas semanas
  const semanas = [...new Set(ventas.map(v => v.fecha?.substring(0, 7)))].sort().slice(-6);
  const chartMensual = semanas.map(mes => ({
    mes,
    providencia: ventas.filter(v => v.fecha?.startsWith(mes) && v.tienda?.includes('Providencia')).reduce((s, v) => s + (v.total || 0), 0) / 1000,
    macul: ventas.filter(v => v.fecha?.startsWith(mes) && v.tienda?.includes('Macul')).reduce((s, v) => s + (v.total || 0), 0) / 1000,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Tiendas Físicas</h1>
          <p className="text-muted-foreground text-sm mt-1">2 locales · Providencia + Macul · Ventas & Grabado Láser</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Registrar Venta
        </Button>
      </div>

      {/* Tiendas cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsTienda.map(t => (
          <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.color}20` }}>
                  <Store className="w-5 h-5" style={{ color: t.color }} />
                </div>
                <div>
                  <p className="font-poppins font-semibold text-foreground">{t.nombre}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{t.dir}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">{t.horario}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="text-center p-2 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Ventas</p>
                <p className="font-poppins font-bold text-lg" style={{ color: t.color }}>{t.ventas}</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Ingresos</p>
                <p className="font-poppins font-bold text-lg" style={{ color: t.color }}>{t.total > 0 ? fmtClp(t.total) : '—'}</p>
              </div>
              <div className="text-center p-2 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">⚡ Laser</p>
                <p className="font-poppins font-bold text-lg" style={{ color: t.color }}>{t.laser}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
          <p className="text-xs text-muted-foreground">Ingresos Totales</p>
          <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: '#0F8B6C' }}>{totalGlobal > 0 ? fmtClp(totalGlobal) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
          <p className="text-xs text-muted-foreground">Grabados Láser</p>
          <p className="font-poppins font-bold text-xl mt-0.5 text-blue-600">{laserTotal}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border text-center">
          <p className="text-xs text-muted-foreground">Total Transacciones</p>
          <p className="font-poppins font-bold text-xl mt-0.5 text-foreground">{ventas.length}</p>
        </div>
      </div>

      {/* Charts + tabla */}
      <Tabs defaultValue="ventas">
        <TabsList className="bg-muted">
          <TabsTrigger value="ventas">Registro Ventas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas" className="space-y-3 mt-4">
          <div className="flex gap-2">
            <Select value={filterTienda} onValueChange={setFilterTienda}>
              <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Ambas tiendas</SelectItem>
                {TIENDAS.map(t => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">{filtered.length} registros</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin ventas registradas</p>
              <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Registrar primera venta</Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                      <th className="text-left px-3 py-3 font-medium">Tienda</th>
                      <th className="text-left px-3 py-3 font-medium">Fecha</th>
                      <th className="text-left px-3 py-3 font-medium">Tipo</th>
                      <th className="text-left px-3 py-3 font-medium">SKU</th>
                      <th className="text-center px-3 py-3 font-medium">Cant.</th>
                      <th className="text-right px-3 py-3 font-medium">Total</th>
                      <th className="text-center px-3 py-3 font-medium">Extras</th>
                      <th className="text-right px-3 py-3 font-medium">Acc.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => (
                      <VentaRow key={v.id} venta={v} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartMensual.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-poppins font-semibold mb-1">Ingresos por Tienda (CLP K)</h3>
                <p className="text-xs text-muted-foreground mb-4">Mensual · últimos 6 meses</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartMensual} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={v => [`$${v.toLocaleString()}K`]} />
                    <Bar dataKey="providencia" fill="#0F8B6C" name="Providencia" radius={[3,3,0,0]} />
                    <Bar dataKey="macul" fill="#D96B4D" name="Macul" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {porTipo.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
                <h3 className="font-poppins font-semibold mb-1">Mix por Tipo de Venta</h3>
                <p className="text-xs text-muted-foreground mb-4">Transacciones</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={porTipo} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                      {porTipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nueva'} Venta en Tienda</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Tienda *</label>
                <Select value={form.tienda||''} onValueChange={v=>setForm({...form,tienda:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIENDAS.map(t=><SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha *</label><Input type="date" value={form.fecha||''} onChange={e=>setForm({...form,fecha:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Tipo de Venta *</label>
              <Select value={form.tipo_venta||''} onValueChange={v=>setForm({...form,tipo_venta:v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_VENTA.map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">SKU / Producto</label><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} className="mt-1" placeholder="BOT-001" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Cantidad</label><Input type="number" min="1" value={form.cantidad||1} onChange={e=>setForm({...form,cantidad:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Precio Unitario (CLP)</label><Input type="number" value={form.precio_unitario||''} onChange={e=>setForm({...form,precio_unitario:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Total (CLP)</label><Input type="number" value={form.total||''} onChange={e=>setForm({...form,total:+e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Medio de Pago</label>
              <Select value={form.medio_pago||''} onValueChange={v=>setForm({...form,medio_pago:v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MEDIOS_PAGO.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nombre Cliente</label><Input value={form.cliente_nombre||''} onChange={e=>setForm({...form,cliente_nombre:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Teléfono</label><Input value={form.cliente_telefono||''} onChange={e=>setForm({...form,cliente_telefono:e.target.value})} className="mt-1" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.personalizacion_laser||false} onChange={e=>setForm({...form,personalizacion_laser:e.target.checked})} />
              Incluye grabado láser en tienda
            </label>
            {form.personalizacion_laser && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Texto / Logo grabado</label><Input value={form.texto_laser||''} onChange={e=>setForm({...form,texto_laser:e.target.value})} className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Tiempo (min)</label><Input type="number" value={form.listo_en_min||15} onChange={e=>setForm({...form,listo_en_min:+e.target.value})} className="mt-1" /></div>
              </div>
            )}
            <div><label className="text-xs font-medium text-muted-foreground">Notas</label><textarea value={form.notas||''} onChange={e=>setForm({...form,notas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
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
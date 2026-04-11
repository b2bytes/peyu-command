import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Search, Package, Tag, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORIAS = ["Escritorio", "Hogar", "Entretenimiento", "Corporativo", "Carcasas B2C"];
const MATERIALES = ["Plástico 100% Reciclado", "Fibra de Trigo (Compostable)"];
const CANALES = ["B2B + B2C", "B2C Exclusivo", "B2B Exclusivo"];

const catColor = {
  "Escritorio": "bg-blue-100 text-blue-700",
  "Hogar": "bg-green-100 text-green-700",
  "Entretenimiento": "bg-purple-100 text-purple-700",
  "Corporativo": "bg-amber-100 text-amber-700",
  "Carcasas B2C": "bg-pink-100 text-pink-700",
};

const DEFAULTS = {
  sku: '', nombre: '', categoria: 'Escritorio', material: 'Plástico 100% Reciclado',
  canal: 'B2B + B2C', precio_b2c: 0, precio_base_b2b: 0, precio_50_199: 0,
  precio_200_499: 0, precio_500_mas: 0, moq_personalizacion: 10,
  personalizacion_gratis_desde: 10, lead_time_sin_personal: 5,
  lead_time_con_personal: 7, inyecciones_requeridas: 1, stock_actual: 0,
  activo: true, garantia_anios: 10
};

function ProductCard({ prod, onEdit, onDelete }) {
  const margenEst = prod.precio_b2c > 0 ? Math.round((prod.precio_b2c - prod.precio_base_b2b) / prod.precio_b2c * 100) : null;
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-shadow hover:shadow-md ${!prod.activo ? 'opacity-60' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{prod.sku}</span>
            {prod.activo ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
          </div>
          <p className="font-poppins font-semibold text-sm text-foreground mt-1">{prod.nombre}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(prod)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(prod.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[prod.categoria] || 'bg-gray-100'}`}>{prod.categoria}</span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{prod.canal}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        {prod.precio_b2c > 0 && (
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">B2C</p>
            <p className="font-poppins font-bold" style={{ color: '#4B4F54' }}>${prod.precio_b2c.toLocaleString('es-CL')}</p>
          </div>
        )}
        {prod.precio_base_b2b > 0 && (
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">B2B base</p>
            <p className="font-poppins font-bold" style={{ color: '#0F8B6C' }}>${prod.precio_base_b2b.toLocaleString('es-CL')}</p>
          </div>
        )}
      </div>

      {/* Precios escalonados */}
      {prod.precio_50_199 > 0 && (
        <div className="text-xs space-y-0.5 p-2 rounded-lg" style={{ background: '#f0faf7' }}>
          <p className="font-medium mb-1" style={{ color: '#0F8B6C' }}>Precios por volumen</p>
          {prod.precio_50_199 > 0 && <div className="flex justify-between"><span className="text-muted-foreground">50-199 u</span><span className="font-medium">${prod.precio_50_199.toLocaleString('es-CL')}</span></div>}
          {prod.precio_200_499 > 0 && <div className="flex justify-between"><span className="text-muted-foreground">200-499 u</span><span className="font-medium">${prod.precio_200_499.toLocaleString('es-CL')}</span></div>}
          {prod.precio_500_mas > 0 && <div className="flex justify-between"><span className="text-muted-foreground">500+ u</span><span className="font-medium">${prod.precio_500_mas.toLocaleString('es-CL')}</span></div>}
        </div>
      )}

      <div className="flex justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
        <span>Láser gratis desde {prod.personalizacion_gratis_desde || 10}u</span>
        <span>Lead time: {prod.lead_time_con_personal || '?'}d</span>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todos');
  const [filterCanal, setFilterCanal] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Producto.list('nombre', 200);
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm(p); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Producto.update(editing.id, form);
    else await base44.entities.Producto.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await base44.entities.Producto.delete(id);
    loadData();
  };

  const filtered = productos.filter(p =>
    (filterCat === 'todos' || p.categoria === filterCat) &&
    (filterCanal === 'todos' || p.canal === filterCanal) &&
    (p.nombre?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  const byCategoria = CATEGORIAS.reduce((acc, cat) => {
    acc[cat] = productos.filter(p => p.categoria === cat).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Catálogo de Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">{productos.length} SKUs • Personalización láser gratis desde 10u</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nuevo Producto
        </Button>
      </div>

      {/* Category stats */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {CATEGORIAS.map(cat => (
          <button key={cat} onClick={() => setFilterCat(filterCat === cat ? 'todos' : cat)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${filterCat === cat ? 'border-current' : 'bg-white border-border hover:border-gray-300'} ${catColor[cat]}`}>
            {cat} ({byCategoria[cat] || 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar SKU o nombre..." className="pl-9 h-9 w-56" />
        </div>
        <Select value={filterCanal} onValueChange={setFilterCanal}>
          <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los canales</SelectItem>
            {CANALES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground self-center">{filtered.length} productos</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando catálogo...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay productos aún</p>
          <p className="text-sm mt-1">Agrega productos del catálogo Peyu (109 SKUs totales)</p>
          <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Agregar primer producto</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => <ProductCard key={p.id} prod={p} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">SKU *</label><Input value={form.sku||''} onChange={e=>setForm({...form,sku:e.target.value})} className="mt-1 font-mono" /></div>
              <div className="col-span-2"><label className="text-xs font-medium text-muted-foreground">Nombre *</label><Input value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <Select value={form.categoria||''} onValueChange={v=>setForm({...form,categoria:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Material</label>
                <Select value={form.material||''} onValueChange={v=>setForm({...form,material:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIALES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={form.canal||''} onValueChange={v=>setForm({...form,canal:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-3">Precios (CLP)</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Precio B2C</label><Input type="number" value={form.precio_b2c||''} onChange={e=>setForm({...form,precio_b2c:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Precio Base B2B (1-49u)</label><Input type="number" value={form.precio_base_b2b||''} onChange={e=>setForm({...form,precio_base_b2b:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">50-199 u (-10%)</label><Input type="number" value={form.precio_50_199||''} onChange={e=>setForm({...form,precio_50_199:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">200-499 u (-15%)</label><Input type="number" value={form.precio_200_499||''} onChange={e=>setForm({...form,precio_200_499:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">500+ u (-22%)</label><Input type="number" value={form.precio_500_mas||''} onChange={e=>setForm({...form,precio_500_mas:+e.target.value})} className="mt-1" /></div>
            </div>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-t pt-3">Producción & Personalización</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">MOQ Personalización (u)</label><Input type="number" value={form.moq_personalizacion||10} onChange={e=>setForm({...form,moq_personalizacion:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Personaliz. gratis desde (u)</label><Input type="number" value={form.personalizacion_gratis_desde||10} onChange={e=>setForm({...form,personalizacion_gratis_desde:+e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Lead time sin pers. (días)</label><Input type="number" value={form.lead_time_sin_personal||''} onChange={e=>setForm({...form,lead_time_sin_personal:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Lead time con pers. (días)</label><Input type="number" value={form.lead_time_con_personal||''} onChange={e=>setForm({...form,lead_time_con_personal:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Área Láser (mm)</label><Input value={form.area_laser_mm||''} onChange={e=>setForm({...form,area_laser_mm:e.target.value})} placeholder="ej: 60x40" className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Inyecciones requeridas</label><Input type="number" value={form.inyecciones_requeridas||1} onChange={e=>setForm({...form,inyecciones_requeridas:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Stock actual (u)</label><Input type="number" value={form.stock_actual||''} onChange={e=>setForm({...form,stock_actual:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Garantía (años)</label><Input type="number" value={form.garantia_anios||''} onChange={e=>setForm({...form,garantia_anios:+e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Descripción</label><textarea value={form.descripcion||''} onChange={e=>setForm({...form,descripcion:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm resize-none h-16" /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.activo!==false} onChange={e=>setForm({...form,activo:e.target.checked})} className="rounded" />
              Activo en catálogo
            </label>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar Producto</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
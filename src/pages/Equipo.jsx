import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Edit2, Trash2, Star, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AREAS = ["Producción", "Administración", "Ventas", "Marketing", "Operaciones", "Tienda Física", "Dirección"];
const ESTADOS = ["Activo", "Vacaciones", "Licencia", "Desvinculado"];
const CONTRATOS = ["Indefinido", "Plazo Fijo", "Por Obra", "Honorarios", "Part-Time"];
const TURNOS = ["Mañana (07-15)", "Tarde (15-23)", "Completo (08-17)", "Flexible"];

const areaColor = {
  "Producción": "bg-blue-100 text-blue-700",
  "Administración": "bg-gray-100 text-gray-600",
  "Ventas": "bg-green-100 text-green-700",
  "Marketing": "bg-pink-100 text-pink-600",
  "Operaciones": "bg-amber-100 text-amber-700",
  "Tienda Física": "bg-purple-100 text-purple-700",
  "Dirección": "bg-slate-100 text-slate-700",
};

const fmtClp = (n) => `$${(n/1000).toFixed(0)}K`;

const DEFAULTS = {
  nombre: '', cargo: '', area: 'Producción', estado: 'Activo',
  tipo_contrato: 'Indefinido', turno: 'Completo (08-17)'
};

// Organigrama simplificado blueprint Peyu
const ORGANIGRAMA = [
  { area: "Dirección", cargo: "CEO / Fundador", reporta: null, color: "#0F8B6C" },
  { area: "Administración", cargo: "Administración & Finanzas", reporta: "CEO / Fundador", color: "#4B4F54" },
  { area: "Ventas", cargo: "Ejecutivo Comercial B2B", reporta: "CEO / Fundador", color: "#0F8B6C" },
  { area: "Marketing", cargo: "Community Manager", reporta: "CEO / Fundador", color: "#D96B4D" },
  { area: "Operaciones", cargo: "Jefe de Producción", reporta: "CEO / Fundador", color: "#4B4F54" },
  { area: "Producción", cargo: "Operario Inyección x3", reporta: "Jefe de Producción", color: "#6b7280" },
  { area: "Producción", cargo: "Operario Láser x1", reporta: "Jefe de Producción", color: "#6b7280" },
  { area: "Tienda Física", cargo: "Encargado Tienda Providencia", reporta: "CEO / Fundador", color: "#0F8B6C" },
  { area: "Tienda Física", cargo: "Encargado Tienda Macul", reporta: "CEO / Fundador", color: "#D96B4D" },
];

function ColaboradorCard({ colab, onEdit, onDelete }) {
  const score = colab.score_evaluacion;
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all hover:shadow-md ${
      colab.estado === 'Desvinculado' ? 'opacity-50 border-gray-200' :
      colab.estado === 'Licencia' ? 'border-amber-200' : 'border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-poppins font-semibold text-sm truncate">{colab.nombre}</p>
          <p className="text-xs text-muted-foreground">{colab.cargo}</p>
        </div>
        <div className="flex gap-1 ml-2">
          <button onClick={() => onEdit(colab)} className="p-1.5 hover:bg-muted rounded-lg"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={() => onDelete(colab.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${areaColor[colab.area] || 'bg-gray-100'}`}>{colab.area}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          colab.estado === 'Activo' ? 'bg-green-100 text-green-700' :
          colab.estado === 'Vacaciones' ? 'bg-blue-100 text-blue-600' :
          colab.estado === 'Licencia' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
        }`}>{colab.estado}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{colab.tipo_contrato}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Sueldo</p>
          <p className="font-semibold text-sm text-foreground">{colab.sueldo_bruto ? fmtClp(colab.sueldo_bruto) : '—'}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Turno</p>
          <p className="font-semibold text-xs text-foreground">{colab.turno?.split(' ')[0] || '—'}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-1.5">
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="font-semibold text-sm" style={{ color: score >= 4 ? '#0F8B6C' : score >= 3 ? '#f59e0b' : '#D96B4D' }}>
            {score ? `${score}/5` : '—'}
          </p>
        </div>
      </div>

      {colab.kpi_meta && (
        <p className="text-xs text-muted-foreground mt-2 bg-muted/30 rounded-lg px-2 py-1">
          🎯 {colab.kpi_meta}
        </p>
      )}
      {colab.maquina_asignada && (
        <p className="text-xs text-muted-foreground mt-1">⚙️ {colab.maquina_asignada}</p>
      )}
    </div>
  );
}

export default function Equipo() {
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState('todas');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(DEFAULTS);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Colaborador.list('-created_date', 100);
    setEquipo(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setForm(DEFAULTS); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm(c); setShowModal(true); };

  const handleSave = async () => {
    if (editing) await base44.entities.Colaborador.update(editing.id, form);
    else await base44.entities.Colaborador.create(form);
    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar colaborador?')) return;
    await base44.entities.Colaborador.delete(id);
    loadData();
  };

  const filtered = equipo.filter(c =>
    (filterArea === 'todas' || c.area === filterArea) && c.estado !== 'Desvinculado'
  );

  const activos = equipo.filter(c => c.estado === 'Activo').length;
  const masaNominal = equipo.filter(c => c.sueldo_bruto && c.estado === 'Activo').reduce((s, c) => s + c.sueldo_bruto, 0);
  const enLicencia = equipo.filter(c => ['Vacaciones','Licencia'].includes(c.estado)).length;
  const promScore = equipo.filter(c => c.score_evaluacion).length > 0
    ? (equipo.filter(c => c.score_evaluacion).reduce((s, c) => s + c.score_evaluacion, 0) / equipo.filter(c => c.score_evaluacion).length).toFixed(1)
    : null;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground text-sm mt-1">RRHH · Organigrama · KPIs individuales · Masa salarial</p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Agregar Colaborador
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Activos', value: activos, color: '#0F8B6C' },
          { label: 'Masa Salarial/mes', value: masaNominal > 0 ? `$${(masaNominal/1_000_000).toFixed(1)}M` : '—', color: '#D96B4D' },
          { label: 'En licencia/vacac.', value: enLicencia, color: enLicencia > 0 ? '#f59e0b' : '#9ca3af' },
          { label: 'Score Prom.', value: promScore ? `${promScore}/5` : '—', color: '#0F8B6C' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-poppins font-bold text-xl mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="equipo">
        <TabsList className="bg-muted">
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="organigrama">Organigrama Blueprint</TabsTrigger>
        </TabsList>

        <TabsContent value="equipo" className="space-y-3 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las áreas</SelectItem>
                {AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">{filtered.length} colaboradores</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin colaboradores registrados</p>
              <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Agregar</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(c => (
                <ColaboradorCard key={c.id} colab={c} onEdit={openEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="organigrama" className="mt-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border">
            <h3 className="font-poppins font-semibold mb-1">Organigrama Blueprint Peyu</h3>
            <p className="text-xs text-muted-foreground mb-5">Estructura organizacional recomendada · Fase actual: 8-10 personas</p>

            {/* CEO */}
            <div className="flex justify-center mb-6">
              <div className="text-center p-3 rounded-xl border-2 border-green-300 bg-green-50 min-w-[160px]">
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="font-poppins font-semibold text-sm text-foreground">CEO / Fundador</p>
              </div>
            </div>

            {/* Nivel 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              {["Administración & Finanzas", "Ejecutivo Comercial B2B", "Community Manager", "Jefe de Producción"].map((c, i) => {
                const item = ORGANIGRAMA.find(o => o.cargo === c);
                return (
                  <div key={i} className="text-center p-3 rounded-xl border border-border bg-muted/30 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-px h-3 bg-border" />
                    <p className="text-xs text-muted-foreground">{item?.area}</p>
                    <p className="font-medium text-xs text-foreground mt-0.5">{c}</p>
                    <div className="w-2 h-2 rounded-full mx-auto mt-1" style={{ background: item?.color || '#ccc' }} />
                  </div>
                );
              })}
            </div>

            {/* Producción reportando a Jefe */}
            <div className="mt-6 border-t pt-4">
              <p className="text-xs text-muted-foreground text-center mb-3">→ Reportan a Jefe de Producción</p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {["Operario Inyección x3", "Operario Láser x1"].map((c, i) => (
                  <div key={i} className="text-center p-2 rounded-xl border border-border bg-muted/20">
                    <p className="font-medium text-xs text-foreground">{c}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Producción</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiendas */}
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground text-center mb-3">→ Reportan directo a CEO</p>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {["Encargado Tienda Providencia", "Encargado Tienda Macul"].map((c, i) => (
                  <div key={i} className="text-center p-2 rounded-xl border border-border bg-muted/20">
                    <p className="font-medium text-xs text-foreground">{c}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tienda Física</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground">
              💡 <strong>Blueprint recomienda:</strong> contratar Ejecutivo Comercial B2B dedicado en Mes 2 para escalar a 16+ pedidos/mes. Masa salarial estimada: $3.2M CLP/mes (8 personas).
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-poppins">{editing ? 'Editar' : 'Nuevo'} Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nombre *</label><Input value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Cargo *</label><Input value={form.cargo||''} onChange={e=>setForm({...form,cargo:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Área *</label>
                <Select value={form.area||''} onValueChange={v=>setForm({...form,area:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{AREAS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
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
              <div><label className="text-xs font-medium text-muted-foreground">Tipo Contrato</label>
                <Select value={form.tipo_contrato||''} onValueChange={v=>setForm({...form,tipo_contrato:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRATOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Turno</label>
                <Select value={form.turno||''} onValueChange={v=>setForm({...form,turno:v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{TURNOS.map(o=><SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Sueldo Bruto (CLP)</label><Input type="number" value={form.sueldo_bruto||''} onChange={e=>setForm({...form,sueldo_bruto:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Fecha Ingreso</label><Input type="date" value={form.fecha_ingreso||''} onChange={e=>setForm({...form,fecha_ingreso:e.target.value})} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Teléfono</label><Input value={form.telefono||''} onChange={e=>setForm({...form,telefono:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Máquina / Estación</label><Input value={form.maquina_asignada||''} onChange={e=>setForm({...form,maquina_asignada:e.target.value})} className="mt-1" placeholder="Inyectora 3..." /></div>
            <div><label className="text-xs font-medium text-muted-foreground">KPI / Meta Principal</label><Input value={form.kpi_meta||''} onChange={e=>setForm({...form,kpi_meta:e.target.value})} className="mt-1" placeholder="Scrap < 3% / mes" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-muted-foreground">Score Evaluación (1-5)</label><Input type="number" min="1" max="5" step="0.5" value={form.score_evaluacion||''} onChange={e=>setForm({...form,score_evaluacion:+e.target.value})} className="mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Última Evaluación</label><Input type="date" value={form.ultima_evaluacion||''} onChange={e=>setForm({...form,ultima_evaluacion:e.target.value})} className="mt-1" /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Habilidades / Certificaciones</label><Input value={form.habilidades||''} onChange={e=>setForm({...form,habilidades:e.target.value})} className="mt-1" /></div>
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
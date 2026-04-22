import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Truck, Plus, Globe2, Grid3x3, Map, List, AlertTriangle, Shield, Leaf, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProveedorCard2027 from "@/components/proveedores/ProveedorCard2027";
import ProveedorFormModal from "@/components/proveedores/ProveedorFormModal";
import ProveedorProfileDrawer from "@/components/proveedores/ProveedorProfileDrawer";
import SupplierMap from "@/components/proveedores/SupplierMap";
import { fmtClp, computeGlobalScore } from "@/lib/supplier-scorecard";

const CATEGORIAS = ["Material Reciclado","Packaging","Tintes / Pigmentos","Maquinaria","Servicios Externos","Logística","Marketing","Tecnología","Dropshipping","Otro"];
const ESTADOS = ["Activo","Inactivo","En Evaluación","En Onboarding","Bloqueado"];
const TIERS = ["Tier 1 - Estratégico","Tier 2 - Preferente","Tier 3 - Transaccional","Tier 4 - Backup"];

/**
 * Portal de Suministro 2027 — nivel SAP Ariba / Coupa adaptado a PEYU.
 * 3 vistas: Grid (cards 360°) · Mapa mundial · Lista compacta
 * KPIs enterprise: Score promedio, Gasto anual, Proveedores en riesgo, Certificados ESG.
 */
export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // grid | map | list

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('todas');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTier, setFilterTier] = useState('todos');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [profileProv, setProfileProv] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Proveedor.list('-created_date', 200);
    setProveedores(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setShowForm(true); setProfileProv(null); };
  const openProfile = (p) => setProfileProv(p);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar proveedor?')) return;
    await base44.entities.Proveedor.delete(id);
    loadData();
  };

  const filtered = proveedores.filter(p => {
    if (filterCat !== 'todas' && p.categoria !== filterCat) return false;
    if (filterEstado !== 'todos' && p.estado !== filterEstado) return false;
    if (filterTier !== 'todos' && p.tier !== filterTier) return false;
    if (search && !`${p.nombre} ${p.contacto||''} ${p.ciudad||''} ${p.pais||''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // KPIs
  const activos = proveedores.filter(p => p.estado === 'Activo').length;
  const internacionales = proveedores.filter(p => p.es_internacional).length;
  const enRiesgo = proveedores.filter(p => p.riesgo_nivel === 'Alto' || p.riesgo_nivel === 'Crítico').length;
  const certificados = proveedores.filter(p => p.certificacion_reciclado || (p.certificaciones||[]).length > 0).length;
  const gastoTotal = proveedores.reduce((s, p) => s + (p.monto_anual_clp || 0), 0);
  const scores = proveedores.map(p => p.score_global ?? computeGlobalScore(p)).filter(Boolean);
  const scoreProm = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) : null;
  const sinCert = proveedores.filter(p => p.categoria === 'Material Reciclado' && !p.certificacion_reciclado).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-primary" />
            Portal de Suministro
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Perfiles 360° · Scorecard ponderado · Gestión de riesgo · Cadena global
          </p>
        </div>
        <Button onClick={openNew} style={{ background: '#0F8B6C' }} className="text-white hover:opacity-90 gap-2">
          <Plus className="w-4 h-4" />Nuevo Proveedor
        </Button>
      </div>

      {/* KPIs ejecutivos */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
        <KpiCard icon={<Truck className="w-4 h-4" />} label="Activos" value={activos} color="#0F8B6C" />
        <KpiCard icon={<Globe2 className="w-4 h-4" />} label="Internacionales" value={internacionales} color="#0EA5E9" />
        <KpiCard icon={<Shield className="w-4 h-4" />} label="Score prom." value={scoreProm ?? '—'} color="#8B5CF6" />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="En riesgo" value={enRiesgo} color={enRiesgo > 0 ? '#DC2626' : '#9CA3AF'} />
        <KpiCard icon={<Leaf className="w-4 h-4" />} label="Certificados" value={certificados} color="#10B981" />
        <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Gasto anual" value={fmtClp(gastoTotal)} color="#D96B4D" />
      </div>

      {/* Alerta ESG */}
      {sinCert > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {sinCert} proveedor(es) de material reciclado sin certificación — prioridad para trazabilidad ESG.
        </div>
      )}

      {/* Toolbar: filtros + view switcher */}
      <div className="flex gap-2 flex-wrap items-center">
        <Input
          placeholder="🔎 Buscar por nombre, contacto, país…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-full sm:w-64"
        />
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tier</SelectItem>
            {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* View switcher */}
        <div className="ml-auto flex bg-muted rounded-lg p-0.5">
          <ViewBtn active={view==='grid'} onClick={()=>setView('grid')} icon={<Grid3x3 className="w-3.5 h-3.5" />} label="Grid" />
          <ViewBtn active={view==='map'}  onClick={()=>setView('map')}  icon={<Map className="w-3.5 h-3.5" />}      label="Mapa" />
          <ViewBtn active={view==='list'} onClick={()=>setView('list')} icon={<List className="w-3.5 h-3.5" />}     label="Lista" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Vistas */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando cadena de suministro...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin resultados</p>
          <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Agregar proveedor</Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => (
            <ProveedorCard2027 key={p.id} prov={p} onEdit={openEdit} onDelete={handleDelete} onOpen={openProfile} />
          ))}
        </div>
      ) : view === 'map' ? (
        <SupplierMap proveedores={filtered} height={480} onSelect={openProfile} />
      ) : (
        <ListView proveedores={filtered} onOpen={openProfile} />
      )}

      {/* Modales */}
      <ProveedorFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        proveedor={editing}
        onSaved={() => { setShowForm(false); loadData(); }}
      />
      <ProveedorProfileDrawer
        open={!!profileProv}
        onClose={() => setProfileProv(null)}
        proveedor={profileProv}
        onEdit={openEdit}
      />
    </div>
  );
}

// ───────── Sub-components ─────────

function KpiCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground" style={{ color }}>{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <p className="font-poppins font-black text-xl" style={{ color }}>{value}</p>
    </div>
  );
}

function ViewBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
        active ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}{label}
    </button>
  );
}

function ListView({ proveedores, onOpen }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">Proveedor</th>
            <th className="text-left px-3 py-2 font-semibold">Categoría</th>
            <th className="text-left px-3 py-2 font-semibold">Tier</th>
            <th className="text-left px-3 py-2 font-semibold">País</th>
            <th className="text-center px-3 py-2 font-semibold">Score</th>
            <th className="text-center px-3 py-2 font-semibold">Riesgo</th>
            <th className="text-right px-3 py-2 font-semibold">Gasto anual</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map(p => {
            const score = p.score_global ?? computeGlobalScore(p);
            return (
              <tr key={p.id} onClick={() => onOpen(p)} className="border-t border-border hover:bg-muted/20 cursor-pointer">
                <td className="px-3 py-2 font-medium">{p.nombre}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{p.categoria}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{p.tier?.split(' - ')[0] || '—'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{[p.ciudad, p.pais].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-3 py-2 text-center font-bold">{score ?? '—'}</td>
                <td className="px-3 py-2 text-center text-xs">{p.riesgo_nivel || '—'}</td>
                <td className="px-3 py-2 text-right font-semibold" style={{ color: '#0F8B6C' }}>{fmtClp(p.monto_anual_clp)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
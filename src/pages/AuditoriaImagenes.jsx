// Página de auditoría 1:1 de imágenes de producto.
// Lista los 64 productos no-carcasa con su carpeta Drive sugerida y permite
// aplicar imagen por imagen, manteniendo control humano total.
import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Loader2, Search, Filter } from 'lucide-react';
import ProductMatchRow from '@/components/imagenes/ProductMatchRow';

export default function AuditoriaImagenes() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ plan: [], folderCatalog: [] });
  const [search, setSearch] = useState('');
  const [hideDone, setHideDone] = useState(false);
  const [doneIds, setDoneIds] = useState(new Set());
  const [filterCat, setFilterCat] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('buildProductDriveMatchPlan', { mode: 'plan' });
      setData({
        plan: res?.data?.plan || [],
        folderCatalog: res?.data?.folderCatalog || [],
      });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApplied = (producto_id) => {
    setDoneIds(prev => new Set([...prev, producto_id]));
  };

  const categories = useMemo(() => {
    const s = new Set();
    data.plan.forEach(p => p.categoria && s.add(p.categoria));
    return [...s];
  }, [data.plan]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.plan.filter(p => {
      if (hideDone && doneIds.has(p.producto_id)) return false;
      if (filterCat !== 'all' && p.categoria !== filterCat) return false;
      if (q && !p.nombre?.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.plan, search, hideDone, doneIds, filterCat]);

  const stats = {
    total: data.plan.length,
    done: doneIds.size,
    pending: data.plan.length - doneIds.size,
    noMatch: data.plan.filter(p => p.status === 'no_match').length,
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white">
            Auditoría 1:1 de Imágenes
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            Asignación manual producto → carpeta Drive. Sin IA generativa, sólo fotos reales.
          </p>
        </div>
        <Button onClick={load} disabled={loading} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recargar plan
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Total" value={stats.total} />
        <Stat label="Procesados" value={stats.done} accent="emerald" />
        <Stat label="Pendientes" value={stats.pending} accent="amber" />
        <Stat label="Sin carpeta" value={stats.noMatch} accent="red" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar SKU o nombre…"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="h-9 bg-white/5 border border-white/10 rounded px-3 text-sm text-white"
        >
          <option value="all" className="bg-slate-900">Todas las categorías</option>
          {categories.map(c => (
            <option key={c} value={c} className="bg-slate-900">{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
          <input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} />
          Ocultar procesados
        </label>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light space-y-2 min-h-0">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando plan completo…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Nada para mostrar con esos filtros
          </div>
        ) : (
          filtered.map(item => (
            <ProductMatchRow
              key={item.producto_id}
              item={item}
              folderCatalog={data.folderCatalog}
              onApplied={handleApplied}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent = 'cyan' }) {
  const colorMap = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
      <div className="text-[11px] text-white/50">{label}</div>
      <div className={`text-xl font-poppins font-bold ${colorMap[accent]}`}>{value}</div>
    </div>
  );
}
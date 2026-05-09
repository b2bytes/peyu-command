import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Image as ImageIcon, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GaleriaMaestraCard from '@/components/imagenes/GaleriaMaestraCard';

/**
 * Galería Maestra — vista unificada de TODAS las imágenes referenciadas
 * por productos del catálogo. Filtros por origen, rol y producto.
 * Acciones: promover a principal, setear como promo, copiar URL, eliminar.
 */
export default function GaleriaMaestra() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterOrigen, setFilterOrigen] = useState('all');
  const [filterRol, setFilterRol] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [visibleCount, setVisibleCount] = useState(60);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('listAllProductImages', {});
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const imagenes = data?.imagenes || [];
  const stats = data?.stats || {};

  const categorias = useMemo(() => {
    const set = new Set();
    imagenes.forEach(i => i.producto_categoria && set.add(i.producto_categoria));
    return [...set].sort();
  }, [imagenes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return imagenes.filter(img => {
      if (filterOrigen !== 'all' && img.origin !== filterOrigen) return false;
      if (filterRol !== 'all' && img.role !== filterRol) return false;
      if (filterCategoria !== 'all' && img.producto_categoria !== filterCategoria) return false;
      if (q && !img.producto_nombre?.toLowerCase().includes(q) && !img.producto_sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [imagenes, search, filterOrigen, filterRol, filterCategoria]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset paginación al filtrar
  useEffect(() => { setVisibleCount(60); }, [search, filterOrigen, filterRol, filterCategoria]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400 flex-shrink-0" />
            Galería Maestra
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            Todas las imágenes referenciadas por productos · CDN base44, recuperaciones Wayback/Drive/Woo, IA y manuales
          </p>
        </div>
        <Button onClick={load} disabled={loading} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      {!loading && stats.total !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 flex-shrink-0">
          <KPI label="Total imágenes" value={stats.total} color="text-white" />
          <KPI label="Productos" value={stats.productos_total} color="text-cyan-300" />
          <KPI label="Sin principal" value={stats.productos_sin_principal} color="text-rose-300" highlight />
          <KPI label="Sólo principal" value={stats.productos_solo_principal} color="text-amber-300" />
          <KPI label="En CDN base44" value={stats.por_origen?.base44 || 0} color="text-emerald-300" />
          <KPI label="Legacy WordPress" value={stats.por_origen?.wordpress || 0} color="text-amber-300" />
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-400/30 text-rose-300 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU del producto…"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterGroup
            label="Origen"
            value={filterOrigen}
            onChange={setFilterOrigen}
            options={[
              { id: 'all', label: `Todos · ${stats.total || 0}` },
              { id: 'base44', label: `Base44 · ${stats.por_origen?.base44 || 0}` },
              { id: 'wordpress', label: `WordPress · ${stats.por_origen?.wordpress || 0}` },
              { id: 'unsplash', label: `Unsplash · ${stats.por_origen?.unsplash || 0}` },
              { id: 'external', label: `Externa · ${stats.por_origen?.external || 0}` },
            ]}
          />
          <FilterGroup
            label="Rol"
            value={filterRol}
            onChange={setFilterRol}
            options={[
              { id: 'all', label: `Todos` },
              { id: 'principal', label: `⭐ Principal · ${stats.por_rol?.principal || 0}` },
              { id: 'galeria', label: `Galería · ${stats.por_rol?.galeria || 0}` },
              { id: 'promo', label: `📣 Promo · ${stats.por_rol?.promo || 0}` },
              { id: 'galeria_dup_principal', label: `⚠️ Duplicadas · ${stats.por_rol?.galeria_dup_principal || 0}` },
            ]}
          />
          {categorias.length > 0 && (
            <FilterGroup
              label="Categoría"
              value={filterCategoria}
              onChange={setFilterCategoria}
              options={[
                { id: 'all', label: 'Todas' },
                ...categorias.map(c => ({ id: c, label: c })),
              ]}
            />
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 pb-6">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando todas las imágenes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay imágenes con esos filtros</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/50 mb-3">
              Mostrando <strong className="text-white">{visible.length}</strong> de <strong className="text-white">{filtered.length}</strong> imágenes
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {visible.map((img, i) => (
                <GaleriaMaestraCard
                  key={`${img.producto_id}-${img.role}-${img.url}-${i}`}
                  img={img}
                  onChange={load}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setVisibleCount(c => c + 60)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Cargar más ({filtered.length - visibleCount} restantes)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KPI({ label, value, color = 'text-white', highlight }) {
  return (
    <div className={`bg-white/5 border rounded-xl px-3 py-2 ${highlight && value > 0 ? 'border-amber-400/40' : 'border-white/10'}`}>
      <div className="text-[11px] text-white/50 mb-0.5 truncate">{label}</div>
      <div className={`text-xl font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">{label}</span>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
            value === opt.id
              ? 'bg-cyan-500 text-white shadow-sm'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
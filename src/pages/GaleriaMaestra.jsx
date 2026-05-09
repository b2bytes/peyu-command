// ============================================================================
// GaleriaMaestra — Vista unificada de TODAS las imágenes del catálogo.
// Permite filtrar por rol (principal/galería/promo), origen, producto, y
// gestionar cada imagen (promover, mover, eliminar).
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Image as ImageIcon, Loader2, RefreshCw, Star, Share2, Layers } from 'lucide-react';
import GaleriaMaestraCard from '@/components/imagenes/GaleriaMaestraCard';

const FILTROS_ROL = [
  { id: 'all', label: 'Todas', icon: Layers },
  { id: 'principal', label: 'Principales', icon: Star },
  { id: 'gallery', label: 'Galería', icon: ImageIcon },
  { id: 'promo', label: 'Promo social', icon: Share2 },
];

export default function GaleriaMaestra() {
  const [data, setData] = useState({ images: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listAllProductImages', {});
      setData(res.data || { images: [], stats: null });
    } catch (e) {
      console.error('listAllProductImages error:', e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sources = useMemo(() => {
    const s = new Set();
    data.images.forEach(img => img.source && s.add(img.source));
    return [...s].sort();
  }, [data.images]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.images.filter(img => {
      if (filterRol !== 'all' && img.role !== filterRol) return false;
      if (filterSource !== 'all' && img.source !== filterSource) return false;
      if (q && !img.producto_nombre?.toLowerCase().includes(q) && !img.producto_sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.images, search, filterRol, filterSource]);

  const counts = useMemo(() => ({
    all: data.images.length,
    principal: data.images.filter(i => i.role === 'principal').length,
    gallery: data.images.filter(i => i.role === 'gallery').length,
    promo: data.images.filter(i => i.role === 'promo').length,
  }), [data.images]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
            Galería Maestra
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            Todas las imágenes del catálogo en un solo lugar. Filtra, promueve, elimina o ajusta su rol.
          </p>
        </div>
        <Button onClick={load} disabled={loading} className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recargar
        </Button>
      </div>

      {/* KPIs / filtros rol */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
        {FILTROS_ROL.map(f => {
          const Icon = f.icon;
          const active = filterRol === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterRol(f.id)}
              className={`text-left bg-white/5 border rounded-xl px-3 py-2.5 transition-all ${
                active ? 'border-cyan-400/60 bg-cyan-500/10 ring-1 ring-cyan-400/30' : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-white/50 mb-0.5">
                <Icon className="w-3 h-3" /> {f.label}
              </div>
              <div className="text-xl font-poppins font-bold text-white">{counts[f.id]}</div>
            </button>
          );
        })}
      </div>

      {/* Filtros secundarios */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto o SKU…"
            className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        {sources.length > 1 && (
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="h-9 bg-white/5 border border-white/10 rounded-md px-3 text-sm text-white"
          >
            <option value="all" className="bg-slate-900">Todos los orígenes</option>
            {sources.map(s => (
              <option key={s} value={s} className="bg-slate-900">{s}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-white/50">
          {filtered.length} imagen{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Escaneando catálogo de imágenes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay imágenes con esos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(img => (
              <GaleriaMaestraCard key={`${img.producto_id}-${img.url}`} image={img} onUpdated={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
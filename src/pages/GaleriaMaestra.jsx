// ============================================================================
// GaleriaMaestra — Vista unificada de TODAS las imágenes del catálogo.
// Navegación tipo carpetas:
//   1. Categoría (Escritorio, Hogar, ...) → muestra carpetas con preview.
//   2. Click en categoría → entra y agrupa por producto (sub-carpetas).
//   3. Filtros transversales (rol, origen, búsqueda) siguen funcionando.
// ============================================================================
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Image as ImageIcon, Loader2, RefreshCw, Star, Share2, Layers, ArrowLeft } from 'lucide-react';
import GaleriaCategoryFolders from '@/components/imagenes/GaleriaCategoryFolders';
import GaleriaProductGroup from '@/components/imagenes/GaleriaProductGroup';
import CarcasasMatchPanel from '@/components/imagenes/CarcasasMatchPanel';

const FILTROS_ROL = [
  { id: 'all', label: 'Todas', icon: Layers },
  { id: 'principal', label: 'Principales', icon: Star },
  { id: 'galeria', label: 'Galería', icon: ImageIcon },
  { id: 'promo', label: 'Promo social', icon: Share2 },
];

export default function GaleriaMaestra() {
  const [data, setData] = useState({ images: [], stats: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [activeCategory, setActiveCategory] = useState(null); // null = vista carpetas

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listAllProductImages', {});
      const payload = res?.data || {};
      const list = Array.isArray(payload.imagenes)
        ? payload.imagenes
        : (Array.isArray(payload.images) ? payload.images : []);
      setData({
        images: list,
        stats: payload.stats || null,
      });
    } catch (e) {
      console.error('listAllProductImages error:', e);
      setData({ images: [], stats: null });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const images = data.images || [];

  const sources = useMemo(() => {
    const s = new Set();
    images.forEach(img => img?.origin && s.add(img.origin));
    return [...s].sort();
  }, [images]);

  // Filtros transversales (rol, origen, búsqueda) — se aplican antes de agrupar
  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return images.filter(img => {
      if (filterRol !== 'all' && img.role !== filterRol) return false;
      if (filterSource !== 'all' && img.origin !== filterSource) return false;
      if (q && !img.producto_nombre?.toLowerCase().includes(q) && !img.producto_sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [images, search, filterRol, filterSource]);

  // Si hay búsqueda activa, salimos del modo carpetas para mostrar resultados directos
  const searchActive = search.trim().length > 0;
  const inCategoryView = activeCategory !== null && !searchActive;

  // Imágenes de la categoría activa (o todas si hay búsqueda)
  const visibleImages = useMemo(() => {
    if (searchActive) return baseFiltered;
    if (activeCategory) return baseFiltered.filter(i => (i.producto_categoria || 'Sin categoría') === activeCategory);
    return baseFiltered;
  }, [baseFiltered, activeCategory, searchActive]);

  // Agrupar por producto cuando estamos en categoría o búsqueda activa
  const productGroups = useMemo(() => {
    const map = new Map();
    for (const img of visibleImages) {
      const key = img.producto_id || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          producto_id: img.producto_id,
          producto_nombre: img.producto_nombre,
          producto_sku: img.producto_sku,
          images: [],
        });
      }
      map.get(key).images.push(img);
    }
    return [...map.values()].sort((a, b) =>
      (a.producto_nombre || '').localeCompare(b.producto_nombre || '')
    );
  }, [visibleImages]);

  const counts = useMemo(() => ({
    all: images.length,
    principal: images.filter(i => i?.role === 'principal').length,
    galeria: images.filter(i => i?.role === 'galeria').length,
    promo: images.filter(i => i?.role === 'promo').length,
  }), [images]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {inCategoryView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActiveCategory(null)}
              className="text-white/70 hover:text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
              Galería Maestra
              {inCategoryView && (
                <span className="text-white/50 text-base font-normal"> · {activeCategory}</span>
              )}
            </h1>
            <p className="text-white/60 text-xs lg:text-sm mt-1">
              {inCategoryView
                ? 'Imágenes agrupadas por producto. Expandí para ver detalles y gestionar cada una.'
                : 'Navegá por categoría o usá el buscador para encontrar imágenes específicas.'}
            </p>
          </div>
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
          {visibleImages.length} imagen{visibleImages.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0">
        {loading ? (
          <div className="text-center py-16 text-white/50">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Escaneando catálogo de imágenes…
          </div>
        ) : visibleImages.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay imágenes con esos filtros</p>
          </div>
        ) : !inCategoryView && !searchActive ? (
          // Vista raíz: carpetas por categoría
          <GaleriaCategoryFolders images={baseFiltered} onPick={setActiveCategory} />
        ) : (
          // Vista categoría o búsqueda: agrupado por producto
          <div className="space-y-2">
            {activeCategory === 'Carcasas B2C' && (
              <CarcasasMatchPanel onApplied={load} />
            )}
            {productGroups.map((group, idx) => (
              <GaleriaProductGroup
                key={group.producto_id || idx}
                producto_id={group.producto_id}
                producto_nombre={group.producto_nombre}
                producto_sku={group.producto_sku}
                images={group.images}
                onUpdated={load}
                defaultOpen={searchActive || productGroups.length <= 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
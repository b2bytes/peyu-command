// GaleriaMaestra — Vista unificada de todas las imágenes del catálogo.
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Image as ImageIcon, Loader2, RefreshCw, Star, Share2, Layers, ArrowLeft } from 'lucide-react';
import GaleriaCategoryFolders from '@/components/imagenes/GaleriaCategoryFolders';
import GaleriaProductGroup from '@/components/imagenes/GaleriaProductGroup';
import CarcasasMatchPanel from '@/components/imagenes/CarcasasMatchPanel';
import AllProductsMatchPanel from '@/components/imagenes/AllProductsMatchPanel';

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
  const [activeCategory, setActiveCategory] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('listAllProductImages', {});
      const payload = res?.data || {};
      const list = Array.isArray(payload.imagenes) ? payload.imagenes : (Array.isArray(payload.images) ? payload.images : []);
      setData({ images: list, stats: payload.stats || null });
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

  const baseFiltered = useMemo(() => {
    const q = search.toLowerCase();
    return images.filter(img => {
      if (filterRol !== 'all' && img.role !== filterRol) return false;
      if (filterSource !== 'all' && img.origin !== filterSource) return false;
      if (q && !img.producto_nombre?.toLowerCase().includes(q) && !img.producto_sku?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [images, search, filterRol, filterSource]);

  const searchActive = search.trim().length > 0;
  const inCategoryView = activeCategory !== null && !searchActive;

  const visibleImages = useMemo(() => {
    if (searchActive) return baseFiltered;
    if (activeCategory) return baseFiltered.filter(i => (i.producto_categoria || 'Sin categoría') === activeCategory);
    return baseFiltered;
  }, [baseFiltered, activeCategory, searchActive]);

  const productGroups = useMemo(() => {
    const map = new Map();
    for (const img of visibleImages) {
      const key = img.producto_id || 'unknown';
      if (!map.has(key)) map.set(key, { producto_id: img.producto_id, producto_nombre: img.producto_nombre, producto_sku: img.producto_sku, images: [] });
      map.get(key).images.push(img);
    }
    return [...map.values()].sort((a, b) => (a.producto_nombre || '').localeCompare(b.producto_nombre || ''));
  }, [visibleImages]);

  const counts = useMemo(() => ({
    all: images.length,
    principal: images.filter(i => i?.role === 'principal').length,
    galeria: images.filter(i => i?.role === 'galeria').length,
    promo: images.filter(i => i?.role === 'promo').length,
  }), [images]);

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0 bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {inCategoryView && (
            <Button size="sm" variant="ghost" onClick={() => setActiveCategory(null)} className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-poppins font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600" />
              Galería Maestra
              {inCategoryView && <span className="text-gray-500 text-base font-normal"> · {activeCategory}</span>}
            </h1>
            <p className="text-gray-500 text-xs lg:text-sm mt-1">
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

      {/* Filtros rol — KPI chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-shrink-0">
        {FILTROS_ROL.map(f => {
          const Icon = f.icon;
          const active = filterRol === f.id;
          return (
            <button key={f.id} onClick={() => setFilterRol(f.id)}
              className={`text-left border rounded-xl px-3 py-2.5 transition-all ${
                active ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-400/40' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className={`flex items-center gap-1.5 text-[11px] font-medium mb-0.5 ${active ? 'text-cyan-700' : 'text-gray-500'}`}>
                <Icon className="w-3 h-3" /> {f.label}
              </div>
              <div className={`text-xl font-poppins font-bold ${active ? 'text-cyan-800' : 'text-gray-900'}`}>{counts[f.id]}</div>
            </button>
          );
        })}
      </div>

      {/* Filtros secundarios */}
      <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto o SKU…"
            className="pl-9 h-10 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-cyan-500" />
        </div>
        {sources.length > 1 && (
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="h-10 w-[200px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Todos los orígenes" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              <SelectItem value="all" className="text-gray-900">Todos los orígenes</SelectItem>
              {sources.map(s => <SelectItem key={s} value={s} className="text-gray-900">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <span className="text-xs text-gray-500 font-medium">
          {visibleImages.length} imagen{visibleImages.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar min-h-0">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Escaneando catálogo de imágenes…
          </div>
        ) : visibleImages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay imágenes con esos filtros</p>
          </div>
        ) : !inCategoryView && !searchActive ? (
          <GaleriaCategoryFolders images={baseFiltered} onPick={setActiveCategory} />
        ) : (
          <div className="space-y-2">
            {activeCategory === 'Carcasas B2C' && <CarcasasMatchPanel onApplied={load} />}
            {activeCategory && activeCategory !== 'Carcasas B2C' && <AllProductsMatchPanel onApplied={load} />}
            {productGroups.map((group, idx) => (
              <GaleriaProductGroup key={group.producto_id || idx}
                producto_id={group.producto_id} producto_nombre={group.producto_nombre}
                producto_sku={group.producto_sku} images={group.images} onUpdated={load}
                defaultOpen={searchActive || productGroups.length <= 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
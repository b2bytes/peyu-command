import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Image as ImageIcon, FileText, ChevronRight, Package, Loader2, AlertCircle } from 'lucide-react';
import AIContentGenerator from '@/components/admin-products/AIContentGenerator';
import AIImageEnhancer from '@/components/admin-products/AIImageEnhancer';

/**
 * AdminProducts — Centro de mejora de catálogo con IA.
 * Foco: enriquecer productos existentes con descripciones SEO y mejores imágenes.
 * Para CRUD básico, usa /admin/catalogo.
 */
export default function AdminProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos'); // todos | sin_descripcion | sin_imagen
  const [selectedId, setSelectedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Producto.list('nombre', 200);
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return productos.filter(p => {
      if (filter === 'sin_descripcion' && p.descripcion) return false;
      if (filter === 'sin_imagen' && p.imagen_url) return false;
      const q = search.toLowerCase();
      return !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    });
  }, [productos, search, filter]);

  const stats = useMemo(() => ({
    total: productos.length,
    sinDescripcion: productos.filter(p => !p.descripcion).length,
    sinImagen: productos.filter(p => !p.imagen_url).length,
    completos: productos.filter(p => p.descripcion && p.imagen_url).length,
  }), [productos]);

  const selected = productos.find(p => p.id === selectedId);

  // Auto-select first product on load
  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const updateLocalProduct = (patch) => {
    setProductos(prev => prev.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Mejora de Productos con IA
          </h1>
          <p className="text-white/60 text-sm mt-1">Enriquece descripciones e imágenes del catálogo PEYU usando IA generativa</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total productos" value={stats.total} icon={Package} color="text-white" />
        <KPI label="Sin descripción" value={stats.sinDescripcion} icon={FileText} color="text-amber-300" highlight />
        <KPI label="Sin imagen" value={stats.sinImagen} icon={ImageIcon} color="text-rose-300" highlight />
        <KPI label="Completos" value={stats.completos} icon={Sparkles} color="text-emerald-300" />
      </div>

      {/* Layout: lista + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        {/* Lista */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-3 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto peyu-scrollbar-light">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar SKU o nombre…"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'todos', label: `Todos (${stats.total})` },
              { id: 'sin_descripcion', label: `Sin desc. (${stats.sinDescripcion})` },
              { id: 'sin_imagen', label: `Sin img (${stats.sinImagen})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  filter === f.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8 text-white/50 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando productos…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-white/50 text-sm">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Sin productos
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2.5 ${
                    selectedId === p.id
                      ? 'bg-violet-500/20 border border-violet-400/40'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-4 h-4 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-white/40">{p.sku}</span>
                      {!p.descripcion && <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">sin desc</span>}
                      {!p.imagen_url && <span className="text-[10px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300">sin img</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-5 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto peyu-scrollbar-light">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/40">
              <AlertCircle className="w-10 h-10 mb-3" />
              <p className="text-sm">Selecciona un producto de la lista</p>
            </div>
          ) : (
            <>
              {/* Header producto */}
              <div className="pb-4 border-b border-white/10">
                <p className="text-xs font-mono text-white/40">{selected.sku}</p>
                <h2 className="text-xl font-poppins font-bold text-white mt-1">{selected.nombre}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{selected.categoria}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{selected.material}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{selected.canal}</span>
                </div>
              </div>

              {/* Imagen IA */}
              <AIImageEnhancer
                producto={selected}
                onSaved={(url) => updateLocalProduct({ imagen_url: url })}
              />

              <div className="border-t border-white/10" />

              {/* Contenido IA */}
              <AIContentGenerator
                producto={selected}
                onSaved={(desc) => updateLocalProduct({ descripcion: desc })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, color, highlight }) {
  return (
    <div className={`bg-white/5 border ${highlight && value > 0 ? 'border-amber-400/30' : 'border-white/10'} rounded-xl p-3`}>
      <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className={`text-2xl font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}
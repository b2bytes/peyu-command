import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Image as ImageIcon, FileText, Package, Loader2, AlertCircle, X } from 'lucide-react';
import AIContentGenerator from '@/components/admin-products/AIContentGenerator';
import AIImageEnhancer from '@/components/admin-products/AIImageEnhancer';
import ProductQuickEdit from '@/components/admin-products/ProductQuickEdit';

/**
 * AdminProducts — Centro de mejora y administración de productos.
 * Layout estable de dos paneles: lista (izq) + detalle scrollable (der).
 * Incluye edición rápida + IA para descripción e imagen.
 */
export default function AdminProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('datos'); // datos | imagen | descripcion

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
      if (filter === 'inactivos' && p.activo !== false) return false;
      const q = search.toLowerCase();
      return !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    });
  }, [productos, search, filter]);

  const stats = useMemo(() => ({
    total: productos.length,
    sinDescripcion: productos.filter(p => !p.descripcion).length,
    sinImagen: productos.filter(p => !p.imagen_url).length,
    completos: productos.filter(p => p.descripcion && p.imagen_url).length,
    inactivos: productos.filter(p => p.activo === false).length,
  }), [productos]);

  const selected = productos.find(p => p.id === selectedId);

  useEffect(() => {
    if (!selected && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selected]);

  const updateLocalProduct = (patch) => {
    setProductos(prev => prev.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-violet-400 flex-shrink-0" />
            <span className="truncate">Administración de Productos</span>
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">Edita precios, stock e imágenes · Genera descripciones SEO con IA</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 flex-shrink-0">
        <KPI label="Total" value={stats.total} color="text-white" />
        <KPI label="Sin descripción" value={stats.sinDescripcion} color="text-amber-300" highlight />
        <KPI label="Sin imagen" value={stats.sinImagen} color="text-rose-300" highlight />
        <KPI label="Completos" value={stats.completos} color="text-emerald-300" />
        <KPI label="Inactivos" value={stats.inactivos} color="text-white/60" />
      </div>

      {/* Layout: lista + detalle (estable, sin desbordes) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-3 flex-1 min-h-0">
        {/* Lista (izquierda) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
          <div className="p-3 space-y-2 border-b border-white/10 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar SKU o nombre…"
                className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { id: 'todos', label: `Todos · ${stats.total}` },
                { id: 'sin_descripcion', label: `Sin desc · ${stats.sinDescripcion}` },
                { id: 'sin_imagen', label: `Sin img · ${stats.sinImagen}` },
                { id: 'inactivos', label: `Inactivos · ${stats.inactivos}` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filter === f.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-2 min-h-0">
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
              <div className="space-y-1">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2.5 ${
                      selectedId === p.id
                        ? 'bg-violet-500/20 border border-violet-400/40'
                        : 'bg-white/5 border border-transparent hover:bg-white/10'
                    } ${p.activo === false ? 'opacity-60' : ''}`}
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
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-white/40 truncate">{p.sku}</span>
                        {!p.descripcion && <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">desc</span>}
                        {!p.imagen_url && <span className="text-[10px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300">img</span>}
                        {p.activo === false && <span className="text-[10px] px-1 py-0.5 rounded bg-white/10 text-white/50">off</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalle (derecha) — nunca desborda, scroll interno */}
        <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
              <AlertCircle className="w-10 h-10 mb-3" />
              <p className="text-sm">Selecciona un producto de la lista</p>
            </div>
          ) : (
            <>
              {/* Header producto + tabs */}
              <div className="px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-white/40">{selected.sku}</p>
                    <h2 className="text-lg lg:text-xl font-poppins font-bold text-white mt-0.5 truncate">{selected.nombre}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Pill>{selected.categoria}</Pill>
                      <Pill>{selected.material}</Pill>
                      <Pill>{selected.canal}</Pill>
                      {selected.activo === false && <Pill className="bg-rose-500/20 text-rose-300">Inactivo</Pill>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-md hover:bg-white/10 text-white/40 lg:hidden flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-3 border-b border-white/5 -mb-3">
                  {[
                    { id: 'datos', label: 'Datos', icon: Package },
                    { id: 'imagen', label: 'Imagen IA', icon: ImageIcon },
                    { id: 'descripcion', label: 'Descripción IA', icon: FileText },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                        tab === t.id
                          ? 'border-violet-400 text-violet-300'
                          : 'border-transparent text-white/50 hover:text-white/80'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido tab — scroll interno */}
              <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-5 min-h-0">
                {tab === 'datos' && (
                  <ProductQuickEdit
                    key={selected.id}
                    producto={selected}
                    onSaved={(patch) => updateLocalProduct(patch)}
                  />
                )}
                {tab === 'imagen' && (
                  <AIImageEnhancer
                    producto={selected}
                    onSaved={(url) => updateLocalProduct({ imagen_url: url })}
                  />
                )}
                {tab === 'descripcion' && (
                  <AIContentGenerator
                    producto={selected}
                    onSaved={(desc) => updateLocalProduct({ descripcion: desc })}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, color, highlight }) {
  return (
    <div className={`bg-white/5 border ${highlight && value > 0 ? 'border-amber-400/30' : 'border-white/10'} rounded-xl px-3 py-2`}>
      <div className="text-[11px] text-white/50 mb-0.5 truncate">{label}</div>
      <div className={`text-xl font-poppins font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Pill({ children, className = '' }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 ${className}`}>
      {children}
    </span>
  );
}
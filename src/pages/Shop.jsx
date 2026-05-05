import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, Recycle, Truck, Shield, Check, Building2, Loader2 } from 'lucide-react';
import CategoryTabs from '@/components/shop/CategoryTabs';
import ProductCard from '@/components/shop/ProductCard';
import { getProductImage } from '@/utils/productImages';
import PublicSEO from '@/components/PublicSEO';
import { SITE_URL } from '@/lib/seo-catalog';

const CATEGORIAS_META = [
  { id: 'Todos',           label: 'Todos',           icon: '🌍' },
  { id: 'Escritorio',      label: 'Escritorio',      icon: '💼' },
  { id: 'Hogar',           label: 'Hogar',           icon: '🏠' },
  { id: 'Entretenimiento', label: 'Entretenimiento', icon: '🎲' },
  { id: 'Corporativo',     label: 'Corporativo',     icon: '🏢' },
  { id: 'Carcasas B2C',    label: 'Carcasas',        icon: '📱' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Todos', min: 0, max: Infinity },
  { id: 'r1', label: 'Menos de $10.000', min: 0, max: 10000 },
  { id: 'r2', label: '$10.000 – $25.000', min: 10000, max: 25000 },
  { id: 'r3', label: '$25.000 – $50.000', min: 25000, max: 50000 },
  { id: 'r4', label: 'Más de $50.000', min: 50000, max: Infinity },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Más populares' },
  { id: 'price_asc', label: 'Precio: menor a mayor' },
  { id: 'price_desc', label: 'Precio: mayor a menor' },
  { id: 'name', label: 'Nombre A–Z' },
];

const PAGE_SIZE = 12;

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregandoId, setAgregandoId] = useState(null);

  // Paginación progresiva
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const gridTopRef = useRef(null);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data.filter(p => p.canal !== 'B2B Exclusivo')))
      .finally(() => setLoading(false));
  }, []);

  // Productos filtrados (sin paginar)
  const filtered = useMemo(() => {
    let result = [...productos];
    if (selectedCategory !== 'Todos') result = result.filter(p => p.categoria === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice);
    if (priceRange && priceRange.id !== 'all') {
      result = result.filter(p => {
        const price = p.precio_b2c || 0;
        return price >= priceRange.min && price < priceRange.max;
      });
    }
    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => (a.precio_b2c || 0) - (b.precio_b2c || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.precio_b2c || 0) - (a.precio_b2c || 0)); break;
      case 'name': result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')); break;
      default: break;
    }
    return result;
  }, [productos, search, selectedCategory, selectedPrice, sortBy]);

  // Conteos por categoría (en base al search + price activos, NO a la categoría)
  const categoriasConConteo = useMemo(() => {
    let baseList = [...productos];
    if (search) {
      const q = search.toLowerCase();
      baseList = baseList.filter(p => p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    }
    const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice);
    if (priceRange && priceRange.id !== 'all') {
      baseList = baseList.filter(p => {
        const price = p.precio_b2c || 0;
        return price >= priceRange.min && price < priceRange.max;
      });
    }
    return CATEGORIAS_META.map(meta => ({
      ...meta,
      count: meta.id === 'Todos'
        ? baseList.length
        : baseList.filter(p => p.categoria === meta.id).length,
    }));
  }, [productos, search, selectedPrice]);

  // Productos visibles (paginados)
  const visibleProductos = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const hasMore = visibleCount < filtered.length;

  // Reset paginación + scroll cuando cambian filtros
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedCategory, selectedPrice, sortBy]);

  // IntersectionObserver para infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '400px 0px' } // pre-carga antes de llegar
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, filtered.length]);

  const agregarAlCarrito = useCallback((e, producto) => {
    e.preventDefault();
    e.stopPropagation();
    setAgregandoId(producto.id);
    const precio = Math.floor((producto.precio_b2c || 9990) * 0.85);
    const nuevo = [...carrito, {
      id: Math.random(), productoId: producto.id, nombre: producto.nombre,
      precio, cantidad: 1, sku: producto.sku,
      imagen: getProductImage(producto),
    }];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setTimeout(() => setAgregandoId(null), 1200);
  }, [carrito]);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    // Scroll suave al inicio de la grilla cuando se cambia categoría
    setTimeout(() => {
      gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('Todos');
    setSelectedPrice('all');
    setSortBy('popular');
  };

  const hasActiveFilters = search || selectedCategory !== 'Todos' || selectedPrice !== 'all';

  // ItemList schema para Google Shopping/Search — listas de productos enriquecidas.
  // Se construye con los productos visibles (max 24 para no inflar el HTML).
  const itemListJsonLd = !loading && filtered.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: selectedCategory === 'Todos' ? 'Catálogo PEYU Chile' : `${selectedCategory} · PEYU Chile`,
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 24).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/producto/${p.id}`,
      name: p.nombre,
    })),
  } : null;

  return (
    <div className="flex-1 overflow-auto font-inter">
      <PublicSEO
        pageKey="shop"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'Tienda', url: 'https://peyuchile.cl/shop' },
        ]}
        jsonLd={itemListJsonLd}
      />
      {/* HERO — ultra compacto en mobile (header + 1 línea de trust badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-10 pb-3 sm:pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm">
              <Recycle className="w-3 h-3" />
              <span className="hidden sm:inline">100% plástico reciclado · Hecho en Chile</span>
              <span className="sm:hidden">100% reciclado · Chile</span>
            </div>
            {/* H1 con keyword principal "Tienda" + "regalos sostenibles Chile" */}
            <h1 className="text-[1.5rem] sm:text-4xl md:text-5xl font-poppins font-bold leading-[1.1] text-white drop-shadow-lg tracking-tight">
              Tienda PEYU · Regalos Sostenibles
              <br className="hidden sm:block" />
              <span className="text-cyan-400 sm:block"> Hechos en Chile.</span>
            </h1>
            <p className="hidden sm:block text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
              Productos fabricados en Santiago con plástico recuperado. Personalización láser UV y garantía 10 años.
            </p>
          </div>
          {/* Trust badges — fila scrolleable en mobile, completa en desktop */}
          <div className="flex gap-2 overflow-x-auto sm:flex-wrap scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 w-[calc(100%+2rem)] sm:w-auto">
            {[
              { icon: Shield, label: '10 años', sub: 'garantía' },
              { icon: Truck, label: 'Envío gratis', sub: 'sobre $40K' },
              { icon: Check, label: '500+', sub: 'reseñas 5★' },
            ].map((b, i) => (
              <div key={i} className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/15 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 flex items-center gap-1.5 sm:gap-2.5 shadow-lg">
                <b.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-xs font-bold text-white leading-tight whitespace-nowrap">{b.label}</p>
                  <p className="text-[9px] sm:text-[10px] text-white/50 leading-tight whitespace-nowrap">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Search bar inline — sticky en mobile para acceso rápido */}
        <div className="mb-3 sm:mb-3 sticky top-14 sm:static z-20 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 sm:py-0 bg-slate-900/80 sm:bg-transparent backdrop-blur-xl sm:backdrop-blur-none">
          <div className="flex items-center gap-2 bg-white/10 border border-white/25 rounded-xl px-3.5 py-2.5 backdrop-blur-sm focus-within:border-teal-400/60 focus-within:bg-white/15 transition-all max-w-xl">
            <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar productos, SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-0 text-white placeholder:text-white/40 focus:ring-0 focus:outline-none text-sm w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CATEGORY TABS — sticky con conteos en vivo */}
        <CategoryTabs
          categorias={categoriasConConteo}
          selected={selectedCategory}
          onSelect={handleSelectCategory}
        />

        {/* Sub-controls bar (sort + filtros) — conteo oculto en mobile para reducir scroll */}
        <div className="flex items-center justify-between gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4 flex-wrap">
          <p className="hidden sm:block text-sm text-white/65" ref={gridTopRef}>
            {loading ? (
              'Cargando...'
            ) : (
              <>
                Mostrando <span className="font-bold text-white">{visibleProductos.length}</span> de{' '}
                <span className="font-bold text-white">{filtered.length}</span>
                {selectedCategory !== 'Todos' && <> en <span className="text-teal-300 font-semibold">{selectedCategory}</span></>}
              </>
            )}
          </p>
          {/* Anchor invisible para scroll en mobile (el conteo está oculto) */}
          <span ref={gridTopRef} className="sm:hidden block w-full h-0" />
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-teal-400/60 cursor-pointer backdrop-blur-sm">
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>)}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 backdrop-blur-sm ${
                filtersOpen || selectedPrice !== 'all'
                  ? 'bg-teal-500/30 text-white border-teal-400/50'
                  : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'
              }`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {selectedPrice !== 'all' && <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-2xl p-4 mb-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">Precio</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-white/50 hover:text-white font-medium flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpiar todo
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRICE_RANGES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedPrice(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedPrice === r.id
                      ? 'bg-teal-500/30 text-white border border-teal-400/50'
                      : 'bg-white/5 text-white/70 border border-white/15 hover:bg-white/10'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse backdrop-blur-sm">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-6 bg-white/10 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/15 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-white font-semibold">No encontramos productos</p>
            <p className="text-sm text-white/50 mt-1">Intenta con otros filtros</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4 rounded-xl bg-white/10 border-white/25 text-white hover:bg-white/20">Limpiar filtros</Button>
          </div>
        ) : (
          <>
            <div
              key={`${selectedCategory}-${selectedPrice}-${sortBy}`}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5"
            >
              {visibleProductos.map((p, i) => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  index={i}
                  onAddToCart={agregarAlCarrito}
                  agregandoId={agregandoId}
                />
              ))}
            </div>

            {/* Sentinel + indicador "load more" */}
            {hasMore && (
              <div ref={sentinelRef} className="mt-8 flex flex-col items-center justify-center gap-3 py-6">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando más productos...
                </div>
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length))}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
                >
                  Cargar {Math.min(PAGE_SIZE, filtered.length - visibleCount)} más
                </button>
              </div>
            )}

            {/* Fin del catálogo */}
            {!hasMore && filtered.length > PAGE_SIZE && (
              <div className="mt-8 text-center py-6">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  Has visto los {filtered.length} productos
                </div>
              </div>
            )}
          </>
        )}

        {/* B2B Banner — paddings reducidos en mobile */}
        <div className="mt-10 sm:mt-12 bg-gradient-to-br from-teal-600/20 via-cyan-600/15 to-blue-600/15 backdrop-blur-md border border-teal-400/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full mb-3">
              <Building2 className="w-3 h-3" /> Canal corporativo
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-poppins font-bold leading-tight mb-3">
              ¿Necesitas +10 unidades con tu logo?
            </h2>
            <p className="text-white/70 text-[13px] sm:text-sm md:text-base mb-4 sm:mb-5 leading-relaxed">
              Cotización con mockup en menos de 24 horas. Precios por volumen y personalización láser UV gratis desde 10 unidades.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/b2b/contacto" className="flex-1 sm:flex-initial">
                <Button className="w-full sm:w-auto rounded-xl bg-white text-slate-900 hover:bg-white/90 font-semibold px-6">
                  Cotizar ahora
                </Button>
              </Link>
              <a href="https://wa.me/56933766573" target="_blank" rel="noreferrer" className="flex-1 sm:flex-initial">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl bg-transparent border-white/25 text-white hover:bg-white/10 font-semibold px-6">
                  💬 WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
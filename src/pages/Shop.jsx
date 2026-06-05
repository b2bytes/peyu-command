import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal, X, Recycle, Truck, Shield, Check, Building2, Loader2 } from 'lucide-react';
import CategoryTabs from '@/components/shop/CategoryTabs';
import ProductCard from '@/components/shop/ProductCard.jsx';
import ShopHeroCollage from '@/components/shop/ShopHeroCollage';
import CartBubble from '@/components/shop/CartBubble';
import { getProductImage } from '@/utils/productImages';
import PublicSEO from '@/components/PublicSEO';
import { SITE_URL } from '@/lib/seo-catalog';
import CyberCatalogBanner from '@/components/cyber/CyberCatalogBanner';
import CyberFeaturedRow from '@/components/cyber/CyberFeaturedRow';
import { isCyberActive, tieneOfertaCyber } from '@/lib/cyber-campaign';
import { searchProductos } from '@/lib/product-search';
import ShopSearchBar from '@/components/shop/ShopSearchBar';
import ShopCategoryCards from '@/components/shop/ShopCategoryCards';
import { ordenarCarcasas } from '@/lib/carcasa-sort';

// FIX 2 · "Corporativo" es un CANAL B2B, no una categoría de producto. Se quita
// del filtro (tenía 0 productos y confundía). El acceso B2B vive en el botón
// "Cotizar B2B", no como filtro. Categorías reales: Carcasas, Hogar,
// Entretenimiento, Escritorio.
const CATEGORIAS_META = [
  { id: 'Todos',           label: 'Todos',           icon: '🌍' },
  { id: 'Carcasas B2C',    label: 'Carcasas',        icon: '📱' },
  { id: 'Hogar',           label: 'Hogar',           icon: '🏠' },
  { id: 'Entretenimiento', label: 'Entretenimiento', icon: '🎲' },
  { id: 'Escritorio',      label: 'Escritorio',      icon: '💼' },
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
  const [soloCyber, setSoloCyber] = useState(false);
  const [carrito, setCarrito] = useState(() => {
    // Lectura defensiva: si el localStorage está corrupto no debe crashear la página.
    try { return JSON.parse(localStorage.getItem('carrito') || '[]') || []; }
    catch { return []; }
  });
  const [agregandoId, setAgregandoId] = useState(null);

  // Paginación progresiva
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);
  const gridTopRef = useRef(null);

  // 🔗 FIX 4 · Lee ?categoria= de la URL al montar (deep-link desde home y
  // tarjetas de categoría). Mapea el valor a una categoría real del catálogo.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('categoria') || params.get('cat');
      if (cat && CATEGORIAS_META.some(m => m.id === cat)) {
        setSelectedCategory(cat);
      }
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.filter({ activo: true })
      .then(data => {
        if (!alive) return;
        setProductos((data || []).filter(p => p.canal !== 'B2B Exclusivo'));
      })
      .catch(err => {
        // Si la BD falla, no dejamos la tienda en "loading" eterno: mostramos
        // vacío y dejamos que el usuario reintente recargando. Evita pantalla muerta.
        console.error('[Shop] Error cargando productos:', err);
        if (alive) setProductos([]);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Productos filtrados (sin paginar)
  const filtered = useMemo(() => {
    let result = [...productos];
    if (soloCyber) result = result.filter(tieneOfertaCyber);
    if (selectedCategory !== 'Todos') result = result.filter(p => p.categoria === selectedCategory);
    // 🔎 Búsqueda tolerante (nombre, SKU, categoría, modelo de teléfono, typos/acentos)
    if (search) {
      result = searchProductos(result, search);
    }
    const priceRange = PRICE_RANGES.find(r => r.id === selectedPrice);
    if (priceRange && priceRange.id !== 'all') {
      result = result.filter(p => {
        const price = p.precio_b2c || 0;
        return price >= priceRange.min && price < priceRange.max;
      });
    }
    if (soloCyber) result = result.filter(tieneOfertaCyber);
    // Si hay búsqueda activa y el sort es "popular", respetamos el orden por
    // relevancia que ya devolvió searchProductos (no lo pisamos).
    if (search && sortBy === 'popular') return result;
    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => (a.precio_b2c || 0) - (b.precio_b2c || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.precio_b2c || 0) - (a.precio_b2c || 0)); break;
      case 'name': result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')); break;
      default:
        // "Más populares" en categoría "Todos": empujar carcasas al final.
        // Solicitud cliente: son muchas carcasas y tapaban productos estrella
        // de plástico. En categorías específicas mantenemos el orden natural.
        if (selectedCategory === 'Todos') {
          result.sort((a, b) => {
            const aCarcasa = a.categoria === 'Carcasas B2C' ? 1 : 0;
            const bCarcasa = b.categoria === 'Carcasas B2C' ? 1 : 0;
            return aCarcasa - bCarcasa;
          });
        } else if (selectedCategory === 'Carcasas B2C') {
          // 📱 Orden estilo sitio oficial: por marca (Apple→Samsung→Huawei→
          // Xiaomi) y dentro de cada marca por modelo (nuevo→viejo).
          result = ordenarCarcasas(result);
        }
        break;
    }
    return result;
  }, [productos, search, selectedCategory, selectedPrice, sortBy, soloCyber]);

  // ¿Hay productos en oferta Cyber en todo el catálogo? (para mostrar el chip)
  const hayOfertasCyber = useMemo(() => isCyberActive() && productos.some(tieneOfertaCyber), [productos]);

  // Conteos por categoría (en base al search + price activos, NO a la categoría)
  const categoriasConConteo = useMemo(() => {
    let baseList = [...productos];
    if (search) {
      baseList = searchProductos(baseList, search);
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

  // Resumen del carrito para la CartBubble flotante
  const cartSummary = useMemo(() => {
    const cantidad = carrito.reduce((acc, it) => acc + (it.cantidad || 1), 0);
    const total = carrito.reduce((acc, it) => acc + ((it.precio || 0) * (it.cantidad || 1)), 0);
    return { cantidad, total };
  }, [carrito]);

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
    <div className="flex-1 overflow-x-hidden overflow-y-auto font-inter">
      <PublicSEO
        pageKey="shop"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'Tienda', url: 'https://peyuchile.cl/shop' },
        ]}
        jsonLd={itemListJsonLd}
      />
      {/* HERO Liquid Dual — split editorial con imagen */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6 sm:pb-10">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10 items-stretch min-w-0">
          {/* IZQUIERDA — Texto + trust */}
          <div className="flex flex-col justify-center space-y-5 lg:py-6 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.22em] uppercase self-start" style={{ color: 'var(--ld-action)' }}>
              <Recycle className="w-3 h-3" />
              <span>100% Plástico Reciclado · Chile</span>
            </div>
            <h1 className="ld-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-ld-fg leading-[0.95] break-words">
              Tienda PEYU.{' '}
              <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
                Regalos sostenibles.
              </span>
            </h1>
            <p className="text-ld-fg-muted text-base sm:text-lg leading-relaxed max-w-lg">
              Fabricados en Santiago con plástico recuperado. Grabado láser en escala de grises, tono opuesto al color del producto.
            </p>
            {/* Despacho BlueExpress — plazo real (FIX 3) */}
            <p className="text-ld-fg-muted text-sm leading-relaxed max-w-lg -mt-2">
              <span className="font-semibold text-ld-fg">Despacho BlueExpress</span> · 1 día hábil en RM si compras antes de las 14:00. Resto del país: 1 a 3 días hábiles.
            </p>
            {/* Trust badges Liquid Dual — envío con plazo (FIX 3), sin "10 años" genérico (FIX 1) */}
            <div className="flex gap-2 flex-wrap pt-2">
              {[
                { icon: Truck, label: 'Envío gratis', sub: 'sobre $40K' },
                { icon: Truck, label: '1 día RM', sub: 'antes 14:00' },
                { icon: Check, label: '500+', sub: 'reseñas 5★' },
              ].map((b, i) => (
                <div key={i} className="ld-glass flex-shrink-0 rounded-2xl px-3.5 py-2.5 flex items-center gap-2">
                  <b.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ld-action)' }} />
                  <div>
                    <p className="text-xs font-bold text-ld-fg leading-tight whitespace-nowrap">{b.label}</p>
                    <p className="text-[10px] text-ld-fg-muted leading-tight whitespace-nowrap">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DERECHA — Hero collage con productos REALES del catálogo */}
          <ShopHeroCollage productos={productos} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Banner Cyber + destacados (solo si campaña activa) */}
        <CyberCatalogBanner />
        <CyberFeaturedRow productos={productos} />

        {/* Search bar Liquid Dual — SIEMPRE arriba del catálogo, sticky en mobile */}
        <div className="mb-3 sm:mb-4 sticky top-14 sm:static z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2 sm:py-0 ld-glass-strong sm:bg-transparent sm:backdrop-blur-none">
          <ShopSearchBar value={search} onChange={setSearch} productos={productos} />
        </div>

        {/* FIX 4 · Tarjetas de categoría con foto real — primero, click filtra.
            Solo en la vista inicial (sin búsqueda ni categoría específica). */}
        {!loading && !search && selectedCategory === 'Todos' && (
          <ShopCategoryCards productos={productos} onSelect={handleSelectCategory} />
        )}

        {/* CATEGORY TABS — sticky con conteos en vivo */}
        <CategoryTabs
          categorias={categoriasConConteo}
          selected={selectedCategory}
          onSelect={handleSelectCategory}
        />

        {/* Sub-controls bar (sort + filtros) — conteo oculto en mobile para reducir scroll */}
        <div className="flex items-center justify-between gap-3 mt-3 sm:mt-4 mb-3 sm:mb-4 flex-wrap">
          <p className="hidden sm:block text-sm text-ld-fg-muted">
            {loading ? (
              'Cargando...'
            ) : (
              <>
                Mostrando <span className="font-bold text-ld-fg">{visibleProductos.length}</span> de{' '}
                <span className="font-bold text-ld-fg">{filtered.length}</span>
                {selectedCategory !== 'Todos' && <> en <span className="font-semibold" style={{ color: 'var(--ld-action)' }}>{selectedCategory}</span></>}
              </>
            )}
          </p>
          {/* Un único anchor para scrollIntoView. React no acepta el mismo ref
              duplicado, así que lo dejamos sólo aquí (un sentinel invisible). */}
          <span ref={gridTopRef} className="block w-full h-0" aria-hidden="true" />
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {hayOfertasCyber && (
              <button
                onClick={() => setSoloCyber(v => !v)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  soloCyber ? 'text-white shadow-sm' : 'ld-glass-soft text-ld-fg border border-ld-border'
                }`}
                style={soloCyber ? { background: 'var(--ld-highlight)' } : undefined}
              >
                ⚡ Solo ofertas Cyber
              </button>
            )}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="ld-glass-soft rounded-full px-3.5 py-2 text-sm text-ld-fg font-semibold focus:outline-none cursor-pointer border border-ld-border">
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id} style={{ background: 'var(--ld-bg)', color: 'var(--ld-fg)' }}>{s.label}</option>)}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                filtersOpen || selectedPrice !== 'all'
                  ? 'ld-btn-primary text-white'
                  : 'ld-glass-soft text-ld-fg border border-ld-border'
              }`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {selectedPrice !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ld-highlight)' }} />}
            </button>
          </div>
        </div>

        {/* Filter panel Liquid Dual */}
        {filtersOpen && (
          <div className="ld-card p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--ld-action)' }}>Precio</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-ld-fg-muted hover:text-ld-fg font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpiar todo
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRICE_RANGES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedPrice(r.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedPrice === r.id
                      ? 'ld-btn-primary text-white'
                      : 'ld-glass-soft text-ld-fg-soft border border-ld-border hover:text-ld-fg'
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
              <div key={i} className="ld-card overflow-hidden animate-pulse">
                <div className="aspect-square peyu-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded w-3/4 peyu-shimmer" />
                  <div className="h-3 rounded w-1/2 peyu-shimmer" />
                  <div className="h-6 rounded w-1/3 mt-3 peyu-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 ld-card">
            <div className="w-16 h-16 rounded-2xl ld-glass-soft flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-ld-fg-muted" />
            </div>
            <p className="text-ld-fg font-semibold">No encontramos productos</p>
            <p className="text-sm text-ld-fg-muted mt-1">Intenta con otros filtros</p>
            <Button onClick={clearFilters} className="ld-btn-ghost mt-4 rounded-full text-ld-fg">Limpiar filtros</Button>
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
                <div className="flex items-center gap-2 text-ld-fg-muted text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando más productos...
                </div>
                <button
                  onClick={() => setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length))}
                  className="ld-btn-ghost px-5 py-2 rounded-full text-xs font-semibold text-ld-fg"
                >
                  Cargar {Math.min(PAGE_SIZE, filtered.length - visibleCount)} más
                </button>
              </div>
            )}

            {/* Fin del catálogo */}
            {!hasMore && filtered.length > PAGE_SIZE && (
              <div className="mt-8 text-center py-6">
                <div className="ld-glass inline-flex items-center gap-2 text-xs font-semibold text-ld-fg-muted px-4 py-2 rounded-full">
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--ld-action)' }} />
                  Has visto los {filtered.length} productos
                </div>
              </div>
            )}
          </>
        )}

        {/* B2B Banner Liquid Dual */}
        <div className="ld-card mt-10 sm:mt-12 relative overflow-hidden p-5 sm:p-8 md:p-10">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-action-soft)', opacity: 0.7 }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-highlight-soft)', opacity: 0.5 }}
          />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--ld-action)' }}>
              <Building2 className="w-3 h-3" /> Canal Corporativo
            </div>
            <h2 className="ld-display text-2xl sm:text-3xl md:text-4xl text-ld-fg leading-tight mb-3">
              ¿Necesitas +10 unidades{' '}
              <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
                con tu logo?
              </span>
            </h2>
            <p className="text-ld-fg-muted text-sm md:text-base mb-5 leading-relaxed">
              Cotización con mockup en menos de 24 horas. Precios por volumen y grabado láser gratis desde 10 unidades — en escala de grises, tono opuesto al color. No se imprime a color.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/b2b/contacto" className="flex-1 sm:flex-initial">
                <Button className="ld-btn-primary w-full sm:w-auto rounded-full font-semibold px-6 h-11">
                  Cotizar ahora
                </Button>
              </Link>
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer" className="flex-1 sm:flex-initial">
                <Button className="ld-btn-ghost w-full sm:w-auto rounded-full text-ld-fg font-semibold px-6 h-11">
                  💬 WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CartBubble flotante — solo visible cuando hay items */}
      <CartBubble cantidad={cartSummary.cantidad} total={cartSummary.total} />
    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getProductImage } from '@/utils/productImages';
import { Search, ShoppingCart, Star, SlidersHorizontal, X, Check, Recycle, Truck, Shield, Building2 } from 'lucide-react';

const CATEGORIAS = ['Todos', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

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

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data.filter(p => p.canal !== 'B2B Exclusivo')))
      .finally(() => setLoading(false));
  }, []);

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

  const agregarAlCarrito = (e, producto) => {
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
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('Todos');
    setSelectedPrice('all');
    setSortBy('popular');
  };

  const hasActiveFilters = search || selectedCategory !== 'Todos' || selectedPrice !== 'all';

  return (
    <div className="flex-1 overflow-auto font-inter">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full backdrop-blur-sm">
              <Recycle className="w-3 h-3" /> 100% plástico reciclado · Hecho en Chile
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold leading-[1.1] text-white drop-shadow-lg">
              Regalos con propósito,
              <br />
              <span className="text-cyan-400">diseñados para durar.</span>
            </h1>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-lg">
              Productos fabricados en Santiago con plástico recuperado. Personalización láser UV y garantía 10 años.
            </p>
          </div>
          {/* Trust badges */}
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: Shield, label: '10 años', sub: 'garantía' },
              { icon: Truck, label: 'Envío gratis', sub: 'sobre $40K' },
              { icon: Check, label: '500+', sub: 'reseñas 5★' },
            ].map((b, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-lg">
                <b.icon className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{b.label}</p>
                  <p className="text-[10px] text-white/50 leading-tight">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-4">
        {/* Search bar inline */}
        <div className="mb-4">
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

        {/* Controls bar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 flex-1 min-w-0">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 backdrop-blur-sm ${
                  selectedCategory === cat
                    ? 'bg-teal-500/30 text-white border border-teal-400/50 shadow-lg'
                    : 'bg-white/5 text-white/70 border border-white/15 hover:bg-white/10 hover:text-white'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-teal-400/60 cursor-pointer backdrop-blur-sm">
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>)}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 backdrop-blur-sm ${filtersOpen || selectedPrice !== 'all' ? 'bg-teal-500/30 text-white border-teal-400/50' : 'bg-white/5 text-white/70 border-white/20 hover:bg-white/10'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
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

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-white/60">
            {loading ? 'Cargando...' : <><span className="font-semibold text-white">{filtered.length}</span> producto{filtered.length !== 1 ? 's' : ''}</>}
          </p>
        </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(p => {
              const precioOnline = Math.floor((p.precio_b2c || 9990) * 0.85);
              return (
                <Link
                  key={p.id}
                  to={`/producto/${p.id}`}
                  className="group bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl overflow-hidden hover:border-teal-400/40 hover:bg-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                    <img 
                      src={getProductImage(p)}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop'}
                    />
                    {/* Floating badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-white/20">
                        {p.categoria}
                      </span>
                      {p.material?.includes('Trigo') && (
                        <span className="bg-green-600/90 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          🌾 Compostable
                        </span>
                      )}
                    </div>
                    {/* Discount pill */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        −15%
                      </span>
                    </div>
                    {/* Quick add */}
                    <button
                      onClick={(e) => agregarAlCarrito(e, p)}
                      className={`absolute bottom-3 right-3 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-lg ${
                        agregandoId === p.id
                          ? 'bg-green-500 scale-110'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:from-teal-600 hover:to-cyan-600 active:scale-95'
                      }`}>
                      {agregandoId === p.id ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-1.5">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/50 font-medium">(4.9)</span>
                    </div>
                    <h3 className="font-semibold text-sm text-white line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors min-h-[40px]">
                      {p.nombre}
                    </h3>
                    <div className="flex items-baseline justify-between mt-3">
                      <div>
                        <p className="text-[10px] text-white/40 line-through font-medium">
                          ${(p.precio_b2c || 9990).toLocaleString('es-CL')}
                        </p>
                        <p className="font-poppins font-bold text-lg text-white leading-none">
                          ${precioOnline.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <span className="text-[10px] text-white/40 font-medium">Envío 7 días</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* B2B Banner */}
        <div className="mt-12 bg-gradient-to-br from-teal-600/20 via-cyan-600/15 to-blue-600/15 backdrop-blur-md border border-teal-400/30 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full mb-3">
              <Building2 className="w-3 h-3" /> Canal corporativo
            </div>
            <h2 className="text-2xl md:text-3xl font-poppins font-bold leading-tight mb-3">
              ¿Necesitas +10 unidades con tu logo?
            </h2>
            <p className="text-white/70 text-sm md:text-base mb-5 leading-relaxed">
              Cotización con mockup en menos de 24 horas. Precios por volumen y personalización láser UV gratis desde 10 unidades.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/b2b/contacto">
                <Button className="rounded-xl bg-white text-slate-900 hover:bg-white/90 font-semibold px-6">
                  Cotizar ahora
                </Button>
              </Link>
              <a href="https://wa.me/56933766573" target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-xl bg-transparent border-white/25 text-white hover:bg-white/10 font-semibold px-6">
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
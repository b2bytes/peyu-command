import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductImage } from '@/utils/productImages';
import { Search, ShoppingCart, Star, SlidersHorizontal, X, Check, Recycle, Truck, Shield } from 'lucide-react';
import MobileMenu from '@/components/MobileMenu';
import { Home, Grid3x3, Building2, HelpCircle, Heart } from 'lucide-react';

const MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/shop', label: 'Tienda', icon: ShoppingCart },
  { href: '/catalogo-visual', label: 'Catálogo', icon: Grid3x3 },
  { href: '/b2b/contacto', label: 'B2B', icon: Building2 },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
  { href: '/soporte', label: 'Soporte', icon: HelpCircle },
];

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
      imagen: getProductImage(producto.sku, producto.categoria),
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
    <div className="min-h-full bg-[#FAFAF8] font-inter">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <MobileMenu items={MENU_ITEMS} />
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-bold">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-poppins font-bold leading-none text-gray-900">PEYU</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Tienda</p>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200/70 transition-colors rounded-2xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar productos, SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none text-sm w-full"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-900">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/b2b/contacto" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="rounded-xl text-gray-500 hover:text-gray-900 font-medium">B2B</Button>
            </Link>
            <Link to="/cart" className="relative">
              <button className="w-10 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 flex items-center justify-center text-white transition-all active:scale-95">
                <ShoppingCart className="w-4 h-4" />
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    {carrito.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
              <Recycle className="w-3 h-3" /> 100% plástico reciclado · Hecho en Chile
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold leading-[1.1] text-gray-900">
              Regalos con propósito,
              <br />
              <span className="text-teal-600">diseñados para durar.</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg pt-1">
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
              <div key={i} className="bg-white border border-gray-100 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
                <b.icon className="w-4 h-4 text-teal-600" />
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-tight">{b.label}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-4">
        {/* Controls bar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 flex-1 min-w-0">
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-medium focus:outline-none focus:border-gray-400 cursor-pointer">
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5 ${filtersOpen || selectedPrice !== 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Filter pills / active filters */}
        {filtersOpen && (
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-900 font-medium flex items-center gap-1">
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
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : <><span className="font-semibold text-gray-900">{filtered.length}</span> producto{filtered.length !== 1 ? 's' : ''}</>}
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-6 bg-gray-100 rounded w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-gray-900 font-semibold">No encontramos productos</p>
            <p className="text-sm text-gray-400 mt-1">Intenta con otros filtros</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4 rounded-xl">Limpiar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(p => {
              const precioOnline = Math.floor((p.precio_b2c || 9990) * 0.85);
              return (
                <Link
                  key={p.id}
                  to={`/producto/${p.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <img 
                      src={getProductImage(p.sku, p.categoria)}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop'}
                    />
                    {/* Floating badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="bg-white/95 backdrop-blur text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {p.categoria}
                      </span>
                      {p.material?.includes('Trigo') && (
                        <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          🌾 Compostable
                        </span>
                      )}
                    </div>
                    {/* Discount pill */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-teal-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                        −15%
                      </span>
                    </div>
                    {/* Quick add */}
                    <button
                      onClick={(e) => agregarAlCarrito(e, p)}
                      className={`absolute bottom-3 right-3 w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all shadow-lg ${
                        agregandoId === p.id
                          ? 'bg-green-500 scale-110'
                          : 'bg-gray-900 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:bg-gray-800 active:scale-95'
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
                      <span className="text-[10px] text-gray-400 font-medium">(4.9)</span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors min-h-[40px]">
                      {p.nombre}
                    </h3>
                    <div className="flex items-baseline justify-between mt-3">
                      <div>
                        <p className="text-[10px] text-gray-400 line-through font-medium">
                          ${(p.precio_b2c || 9990).toLocaleString('es-CL')}
                        </p>
                        <p className="font-poppins font-bold text-lg text-gray-900 leading-none">
                          ${precioOnline.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">Envío 7 días</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* B2B Banner */}
        <div className="mt-12 bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 bg-teal-500/10 border border-teal-400/20 px-3 py-1 rounded-full mb-3">
              <Building2 className="w-3 h-3" /> Canal corporativo
            </div>
            <h2 className="text-2xl md:text-3xl font-poppins font-bold leading-tight mb-3">
              ¿Necesitas +10 unidades con tu logo?
            </h2>
            <p className="text-white/60 text-sm md:text-base mb-5 leading-relaxed">
              Cotización con mockup en menos de 24 horas. Precios por volumen y personalización láser UV gratis desde 10 unidades.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/b2b/contacto">
                <Button className="rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6">
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
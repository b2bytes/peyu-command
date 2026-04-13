import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getProductImage } from '@/utils/productImages';
import { ShoppingCart, Building2, Sparkles, Search, SlidersHorizontal, X, Star, Zap, ArrowRight } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const EMOJI_MAP = {
  'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱'
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Destacados' },
  { value: 'precio_asc', label: 'Menor precio' },
  { value: 'precio_desc', label: 'Mayor precio' },
  { value: 'nombre', label: 'A–Z' },
];

function sortProductos(products, sort) {
  const p = [...products];
  if (sort === 'precio_asc') return p.sort((a, b) => (a.precio_b2c || 0) - (b.precio_b2c || 0));
  if (sort === 'precio_desc') return p.sort((a, b) => (b.precio_b2c || 0) - (a.precio_b2c || 0));
  if (sort === 'nombre') return p.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  return p;
}

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [sort, setSort] = useState('default');
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregandoId, setAgregandoId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data))
      .finally(() => setLoading(false));
  }, []);

  const categorias = [...new Set(productos.map(p => p.categoria))];

  const filtrado = sortProductos(
    productos.filter(p => {
      const matchCat = !categoriaFiltro || p.categoria === categoriaFiltro;
      const matchBusq = !busqueda || p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.categoria?.toLowerCase().includes(busqueda.toLowerCase());
      return matchCat && matchBusq;
    }),
    sort
  );

  const agregarRapido = (e, p) => {
    e.preventDefault();
    e.stopPropagation();
    const item = { id: Math.random(), productoId: p.id, nombre: p.nombre, precio: Math.floor((p.precio_b2c || 9990) * 0.85), cantidad: 1 };
    const nuevo = [...carrito, item];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setAgregandoId(p.id);
    setTimeout(() => setAgregandoId(null), 1800);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="h-16 bg-white/80 border-b border-black/5" />
      <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-3xl overflow-hidden bg-white border border-gray-100">
            <div className="h-44 bg-gray-100 animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-3 bg-gray-100 rounded-xl w-2/3 animate-pulse" />
              <div className="h-6 bg-gray-100 rounded-xl w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <Link to="/">
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow-md shadow-[#0F8B6C]/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-poppins font-bold leading-none tracking-tight text-gray-900">PEYU</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Tienda Sustentable</p>
              </div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 focus:border-[#0F8B6C]/30 transition-all"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/b2b/catalogo">
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100">
                <Building2 className="w-4 h-4" /> B2B
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Carrito</span>
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#D96B4D] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5">

        {/* ── FILTROS BAR ────────────────────── */}
        <div className="py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {/* All */}
            <button onClick={() => setCategoriaFiltro('')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${!categoriaFiltro ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'}`}>
              Todo ({productos.length})
            </button>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat === categoriaFiltro ? '' : cat)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${categoriaFiltro === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'}`}>
                {EMOJI_MAP[cat] || '📦'} {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:inline">{filtrado.length} productos</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── PROMO BANNER ──────────────────── */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-5 mb-6 flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#0F8B6C] opacity-10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Oferta del día</span>
            </div>
            <p className="text-white font-poppins font-bold text-lg leading-tight">−15% en toda la tienda · Envío gratis +$40.000</p>
          </div>
          <Link to="/b2b/contacto" className="flex-shrink-0">
            <Button size="sm" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl shadow-md">
              <Building2 className="w-4 h-4" /> B2B →
            </Button>
          </Link>
        </div>

        {/* ── GRID PRODUCTOS ─────────────────── */}
        {filtrado.length === 0 ? (
          <div className="text-center py-24 text-gray-400 space-y-3">
            <div className="text-6xl">🔍</div>
            <p className="text-lg font-medium">No encontramos productos</p>
            <p className="text-sm">Prueba con otra categoría o búsqueda</p>
            <Button variant="outline" className="rounded-2xl mt-2" onClick={() => { setBusqueda(''); setCategoriaFiltro(''); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-16">
            {filtrado.map((p, idx) => (
              <Link key={p.id} to={`/producto/${p.id}`}>
                <div className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 hover:border-gray-200 transition-all duration-300 cursor-pointer flex flex-col h-full">

                {/* Image */}
                <div className="relative overflow-hidden flex-shrink-0" style={{ aspectRatio: '1' }}>
                  <img
                    src={getProductImage(p.sku, p.categoria)}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                  />
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-[#0F8B6C]/10 via-[#A7D9C9]/20 to-[#E7D8C6]/30 items-center justify-center">
                    <span className="text-7xl">{EMOJI_MAP[p.categoria] || '📦'}</span>
                  </div>

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                  {/* Top left badge */}
                  <div className="absolute top-3 left-3">
                    {p.material?.includes('100%') ? (
                      <span className="text-[10px] font-bold bg-[#0F8B6C] text-white px-2.5 py-1 rounded-full shadow-md">♻️ Reciclado</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-md">🌾 Compostable</span>
                    )}
                  </div>

                  {/* Top right laser badge */}
                  {p.moq_personalizacion && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/95 backdrop-blur text-purple-600 px-2.5 py-1 rounded-full shadow-md border border-purple-100">✨ Laser</span>
                  )}

                  {/* Highlight ribbon */}
                  {idx === 0 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold bg-[#D96B4D] text-white px-2.5 py-1 rounded-full shadow-md">⭐ Más vendido</span>
                    </div>
                  )}
                  {idx === 2 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold bg-purple-600 text-white px-2.5 py-1 rounded-full shadow-md">🔥 Popular</span>
                    </div>
                  )}

                  {/* Quick add overlay */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                    <button
                      onClick={(e) => agregarRapido(e, p)}
                      className={`w-full py-2.5 rounded-2xl text-xs font-bold shadow-xl transition-all ${
                        agregandoId === p.id
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-900/90 backdrop-blur-sm text-white hover:bg-gray-900'
                      }`}>
                      {agregandoId === p.id ? '✓ Agregado al carrito' : '+ Agregar al carrito'}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.categoria}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <div className="flex gap-px">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <span className="text-[10px] text-gray-400">(127)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-50">
                    <div>
                      <p className="text-[10px] text-gray-300 line-through leading-none">${(p.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                      <p className="font-poppins font-bold text-xl leading-tight text-gray-900">${Math.floor((p.precio_b2c || 9990) * 0.85).toLocaleString('es-CL')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-bold border border-green-100">−15%</span>
                      {p.stock_actual !== undefined && p.stock_actual <= 5 && p.stock_actual > 0 && (
                        <span className="text-[9px] text-orange-500 font-bold">⚡ {p.stock_actual} left</span>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── BANNERS BOTTOM ─────────────────── */}
        <div className="grid md:grid-cols-2 gap-4 pb-16">
          <div className="bg-gray-900 rounded-3xl p-7 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 opacity-5 rounded-full blur-3xl" />
            <div className="relative space-y-2">
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">✨ Grabado en tienda · 5 min</div>
              <h3 className="text-white font-poppins font-bold text-xl leading-tight">Personalización láser UV</h3>
              <p className="text-white/40 text-sm">Tu nombre o logo grabado con precisión permanente e irrepetible</p>
            </div>
            <Link to="/personalizar">
              <Button size="sm" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-md w-fit">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Personalizar ahora
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl p-7 flex flex-col gap-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0A1F18,#0F2E24)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#0F8B6C] opacity-20 rounded-full blur-3xl" />
            <div className="relative space-y-2">
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">🏭 Desde 10 u. · Propuesta &lt;24h</div>
              <h3 className="text-white font-poppins font-bold text-xl leading-tight">Regalos Corporativos B2B</h3>
              <p className="text-white/40 text-sm">Personalización láser UV gratis incluida · Fabricado en Chile</p>
            </div>
            <Link to="/b2b/catalogo">
              <Button size="sm" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-bold rounded-xl shadow-md shadow-[#0F8B6C]/30 w-fit">
                <Building2 className="w-4 h-4" /> Ver catálogo B2B <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <WhatsAppWidget context="general" />
    </div>
  );
}
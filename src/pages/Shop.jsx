import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getProductImage } from '@/utils/productImages';
import { ShoppingCart, Building2, Sparkles, Search, X, Star, Zap, ArrowRight, Package } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const EMOJI_MAP = {
  'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱'
};

const CAT_LABEL = {
  'Carcasas B2C': 'Carcasas',
  'Entretenimiento': 'Entretenimiento',
  'Hogar': 'Hogar',
  'Escritorio': 'Escritorio',
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
    // Only show B2C + B2B+B2C (exclude B2B Exclusivo)
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data.filter(p => p.canal !== 'B2B Exclusivo')))
      .finally(() => setLoading(false));
  }, []);

  const categorias = [...new Set(productos.map(p => p.categoria))].sort();

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
    <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0F8B6C]/20 border-t-[#0F8B6C] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 font-medium">Cargando catálogo...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F8F6] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/">
            <div className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <span className="text-white text-sm font-bold font-poppins">P</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[15px] font-poppins font-bold leading-none tracking-tight text-gray-900">PEYU</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Tienda Sustentable</p>
              </div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 focus:border-[#0F8B6C]/40 transition-all"
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

      <div className="max-w-7xl mx-auto px-4">

        {/* ── FILTROS BAR ────────────────────── */}
        <div className="py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setCategoriaFiltro('')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${!categoriaFiltro ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'}`}>
              Todo ({productos.length})
            </button>
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat === categoriaFiltro ? '' : cat)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${categoriaFiltro === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900'}`}>
                {EMOJI_MAP[cat] || '📦'} {CAT_LABEL[cat] || cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:inline">{filtrado.length} productos</span>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── PROMO BANNER ──────────────────── */}
        <div className="bg-gradient-to-r from-[#0A1F18] to-[#0F2E24] rounded-3xl p-5 mb-6 flex items-center justify-between gap-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#0F8B6C] opacity-10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Oferta vigente</span>
            </div>
            <p className="text-white font-poppins font-bold text-base sm:text-lg leading-tight">−15% en toda la tienda · Envío gratis sobre $40.000</p>
            <p className="text-white/40 text-xs mt-1">♻️ Hecho en Chile con plástico 100% reciclado</p>
          </div>
          <Link to="/b2b/contacto" className="flex-shrink-0">
            <Button size="sm" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl shadow-md whitespace-nowrap">
              <Building2 className="w-4 h-4" /> B2B
            </Button>
          </Link>
        </div>

        {/* ── GRID PRODUCTOS ─────────────────── */}
        {filtrado.length === 0 ? (
          <div className="text-center py-24 text-gray-400 space-y-3">
            <div className="text-5xl">🔍</div>
            <p className="text-lg font-semibold text-gray-600">Sin resultados</p>
            <p className="text-sm">Prueba con otra categoría o búsqueda</p>
            <Button variant="outline" className="rounded-2xl mt-2" onClick={() => { setBusqueda(''); setCategoriaFiltro(''); }}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
            {filtrado.map((p, idx) => {
              const img = getProductImage(p.sku, p.categoria);
              const precio = p.precio_b2c || 0;
              const precioOferta = Math.floor(precio * 0.85);
              const isNuevo = p.sku === 'ENT-JENGA';
              return (
                <Link key={p.id} to={`/producto/${p.id}`}>
                  <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 transition-all duration-300 flex flex-col h-full">
                    {/* Image */}
                    <div className="relative overflow-hidden flex-shrink-0 bg-gray-50" style={{ aspectRatio: '1' }}>
                      <img
                        src={img}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
                      />
                      {/* Badges top-left */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {isNuevo && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow">NUEVO</span>}
                        {!isNuevo && p.material?.includes('100%') && <span className="text-[10px] font-bold bg-[#0F8B6C] text-white px-2 py-0.5 rounded-full shadow">♻️ Reciclado</span>}
                        {!isNuevo && p.material?.includes('Trigo') && <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">🌾 Bio</span>}
                      </div>
                      {/* Quick add */}
                      <div className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                        <button
                          onClick={(e) => agregarRapido(e, p)}
                          className={`w-full py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
                            agregandoId === p.id ? 'bg-green-500 text-white' : 'bg-gray-900/90 backdrop-blur-sm text-white hover:bg-gray-900'
                          }`}>
                          {agregandoId === p.id ? '✓ Agregado' : '+ Agregar al carrito'}
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 flex flex-col flex-1 gap-1.5">
                      <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                      <p className="text-[10px] text-gray-400">{CAT_LABEL[p.categoria] || p.categoria}</p>
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-[9px] text-gray-400">(127)</span>
                      </div>
                      {/* Price */}
                      <div className="flex items-end justify-between mt-auto pt-2 border-t border-gray-50">
                        <div>
                          <p className="text-[9px] text-gray-300 line-through leading-none">${precio.toLocaleString('es-CL')}</p>
                          <p className="font-poppins font-bold text-base leading-tight text-gray-900">${precioOferta.toLocaleString('es-CL')}</p>
                        </div>
                        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-lg font-bold border border-green-100">−15%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── BANNERS BOTTOM ─────────────────── */}
        <div className="grid md:grid-cols-2 gap-4 pb-16">
          <div className="bg-gray-900 rounded-3xl p-7 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 opacity-5 rounded-full blur-3xl" />
            <div className="relative space-y-1.5">
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">✨ Grabado en tienda · 5 min</div>
              <h3 className="text-white font-poppins font-bold text-xl leading-tight">Personalización láser UV</h3>
              <p className="text-white/40 text-sm">Tu nombre o logo grabado con precisión permanente</p>
            </div>
            <Link to="/personalizar">
              <Button size="sm" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-md w-fit">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Personalizar ahora
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl p-7 flex flex-col gap-3 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0A1F18,#0F2E24)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#0F8B6C] opacity-20 rounded-full blur-3xl" />
            <div className="relative space-y-1.5">
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">🏭 Desde 10 u. · Propuesta &lt;24h</div>
              <h3 className="text-white font-poppins font-bold text-xl leading-tight">Regalos Corporativos B2B</h3>
              <p className="text-white/40 text-sm">Personalización láser UV gratis · Fabricado en Chile</p>
            </div>
            <Link to="/b2b/catalogo">
              <Button size="sm" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-bold rounded-xl shadow-md w-fit">
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
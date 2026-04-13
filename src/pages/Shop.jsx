import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Building2, Sparkles, Search, Zap } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const EMOJI_MAP = {
  'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱'
};

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [filtrado, setFiltrado] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => { setProductos(data); setFiltrado(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleFiltro = (cat) => {
    setCategoriaFiltro(cat);
    setFiltrado(cat ? productos.filter(p => p.categoria === cat) : productos);
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white/80 border-b border-black/5 h-16" />
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
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
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
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
          <div className="flex-1 max-w-sm relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-2xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 focus:border-[#0F8B6C]/30 transition-all"
              placeholder="Buscar productos..."
              onChange={(e) => {
                const q = e.target.value.toLowerCase();
                setFiltrado(q ? productos.filter(p => p.nombre?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q)) : productos);
                if (q) setCategoriaFiltro('');
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Link to="/b2b/catalogo">
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-sm font-medium rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Building2 className="w-4 h-4" /> B2B
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Carrito</span>
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#D96B4D] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-5 py-8">

        {/* ── HEADER + FILTROS ───────────────── */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-1">Catálogo</p>
          <h1 className="text-2xl font-poppins font-bold text-gray-900 mb-5">{filtrado.length} producto{filtrado.length !== 1 ? 's' : ''}</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFiltro('')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${!categoriaFiltro ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'}`}
            >
              Todos ({productos.length})
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => handleFiltro(cat)}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-all ${categoriaFiltro === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'}`}
              >
                {EMOJI_MAP[cat] || '📦'} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── GRID PRODUCTOS ─────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrado.map((p, idx) => (
            <Link key={p.id} to={`/producto/${p.id}`}>
              <div className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 transition-all duration-300 cursor-pointer">
                {/* Image */}
                <div className="relative bg-gradient-to-br from-[#0F8B6C]/10 via-[#A7D9C9]/20 to-[#E7D8C6]/30 h-44 flex items-center justify-center overflow-hidden">
                  <div className="text-center group-hover:scale-110 transition-transform duration-300">
                    <div className="text-5xl mb-1">{EMOJI_MAP[p.categoria] || '📦'}</div>
                    <p className="text-[10px] font-semibold text-[#0F8B6C] px-3 leading-tight">{p.sku}</p>
                  </div>
                  {/* Badges left */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {p.material?.includes('100%') ? (
                      <span className="bg-[#0F8B6C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">♻️ Reciclado</span>
                    ) : (
                      <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">🌾 Compostable</span>
                    )}
                    {idx === 0 && <span className="bg-[#D96B4D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">⭐ Top</span>}
                  </div>
                  {/* Laser badge right */}
                  {p.moq_personalizacion && (
                    <span className="absolute top-2.5 right-2.5 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">✨ Laser</span>
                  )}
                  {/* Quick view */}
                  <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-gray-900/85 backdrop-blur text-white text-xs font-semibold text-center py-1.5 rounded-xl">Ver producto →</div>
                  </div>
                </div>
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-tight mb-0.5 text-gray-900 line-clamp-1 group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                  <p className="text-xs text-gray-400 mb-3">{p.categoria}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gray-300 line-through">${p.precio_b2c?.toLocaleString('es-CL')}</p>
                      <p className="font-poppins font-bold text-lg text-gray-900">${Math.floor((p.precio_b2c || 9990) * 0.85)?.toLocaleString('es-CL')}</p>
                    </div>
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-xl font-bold">−15%</span>
                  </div>
                  {p.stock_actual !== undefined && p.stock_actual <= 5 && p.stock_actual > 0 && (
                    <p className="text-[10px] text-orange-500 mt-1.5 font-semibold">⚡ Solo {p.stock_actual} en stock</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtrado.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">No hay productos en esta categoría</p>
          </div>
        )}

        {/* ── BANNERS ───────────────────────── */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-3xl p-7 flex flex-col gap-3">
            <div className="text-white/50 text-xs font-medium">✨ Grabado en tienda · Listo en 5 min</div>
            <h3 className="text-white font-poppins font-bold text-xl leading-tight">Personalización láser UV</h3>
            <p className="text-white/50 text-sm">Tu nombre o logo grabado con precisión permanente</p>
            <Link to="/personalizar" className="mt-1">
              <Button size="sm" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl shadow-md w-fit">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Personalizar ahora
              </Button>
            </Link>
          </div>
          <div className="rounded-3xl p-7 flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, #0A1F18 0%, #0F2E24 100%)' }}>
            <div className="text-white/50 text-xs font-medium">🏭 Desde 10 u · Propuesta en &lt;24h</div>
            <h3 className="text-white font-poppins font-bold text-xl leading-tight">Regalos Corporativos B2B</h3>
            <p className="text-white/50 text-sm">Personalización láser UV gratis incluida</p>
            <Link to="/b2b/catalogo" className="mt-1">
              <Button size="sm" className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] text-white font-semibold rounded-xl shadow-md shadow-[#0F8B6C]/30 w-fit">
                <Building2 className="w-4 h-4" /> Ver catálogo B2B
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <WhatsAppWidget context="general" />
    </div>
  );
}
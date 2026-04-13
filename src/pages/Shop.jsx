import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Building2, Sparkles, Search, Recycle, Leaf } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const EMOJI_MAP = {
  'Escritorio': '🖥️', 'Hogar': '🏠', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱'
};

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [filtrado, setFiltrado] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await base44.entities.Producto.filter({ activo: true });
        setProductos(data);
        setFiltrado(data);
      } finally {
        setLoading(false);
      }
    };
    cargarProductos();
  }, []);

  const handleFiltro = (cat) => {
    setCategoriaFiltro(cat);
    if (!cat) {
      setFiltrado(productos);
    } else {
      setFiltrado(productos.filter(p => p.categoria === cat));
    }
  };

  const categorias = [...new Set(productos.map(p => p.categoria))];

  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-border h-16" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Navbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/">
            <div className="flex items-center gap-2.5 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full bg-[#0F8B6C] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-poppins font-bold leading-none" style={{ color: '#0F8B6C' }}>PEYU</h1>
                <p className="text-xs text-muted-foreground leading-none">Tienda Sustentable</p>
              </div>
            </div>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-sm relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-full bg-muted/40 focus:outline-none focus:ring-1 focus:ring-ring"
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
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-sm">
                <Building2 className="w-4 h-4" /> B2B
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button size="sm" className="gap-2" style={{ backgroundColor: '#0F8B6C' }}>
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Carrito</span>
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFiltro('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                !categoriaFiltro ? 'text-white border-transparent' : 'bg-white border-border text-muted-foreground hover:border-[#0F8B6C] hover:text-[#0F8B6C]'
              }`}
              style={!categoriaFiltro ? { backgroundColor: '#0F8B6C' } : {}}
            >
              Todos ({productos.length})
            </button>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => handleFiltro(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  categoriaFiltro === cat ? 'text-white border-transparent' : 'bg-white border-border text-muted-foreground hover:border-[#0F8B6C] hover:text-[#0F8B6C]'
                }`}
                style={categoriaFiltro === cat ? { backgroundColor: '#0F8B6C' } : {}}
              >
                {EMOJI_MAP[cat] || '📦'} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtrado.map(p => (
            <Link key={p.id} to={`/producto/${p.id}`}>
              <div className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="relative bg-gradient-to-br from-[#0F8B6C]/15 to-[#A7D9C9]/25 h-44 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-1">{EMOJI_MAP[p.categoria] || '📦'}</div>
                    <p className="text-xs font-medium text-[#0F8B6C] px-3 leading-tight">{p.sku}</p>
                  </div>
                  {p.material?.includes('100%') ? (
                    <span className="absolute top-2 left-2 bg-[#0F8B6C] text-white text-xs px-2 py-0.5 rounded-full">♻️</span>
                  ) : (
                    <span className="absolute top-2 left-2 bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">🌾</span>
                  )}
                  {p.moq_personalizacion && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">✨</span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm leading-tight mb-1 text-foreground group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.categoria}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">${p.precio_b2c?.toLocaleString('es-CL')}</p>
                      <p className="font-poppins font-bold text-lg" style={{ color: '#0F8B6C' }}>
                        ${Math.floor(p.precio_b2c * 0.85)?.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">−15%</span>
                  </div>
                  {p.stock_actual !== undefined && p.stock_actual <= 5 && p.stock_actual > 0 && (
                    <p className="text-xs text-orange-500 mt-1.5 font-medium">⚡ Solo {p.stock_actual} en stock</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtrado.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No hay productos en esta categoría</p>
          </div>
        )}

        {/* Banners */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#4B4F54] rounded-2xl p-6 flex flex-col gap-3">
            <div className="text-white/60 text-xs">✨ Grabado en tienda · Listo en 5 min</div>
            <h3 className="text-white font-poppins font-bold text-lg">Personalización láser UV</h3>
            <p className="text-white/70 text-sm">Tu nombre o logo grabado con precisión</p>
            <Link to="/personalizar" className="mt-1">
              <Button size="sm" className="gap-2 bg-white text-[#1a1a1a] hover:bg-white/90 font-semibold">
                <Sparkles className="w-4 h-4" /> Personalizar
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-r from-[#0F172A] to-[#006D5B] rounded-2xl p-6 flex flex-col gap-3">
            <div className="text-white/60 text-xs">🏭 Desde 10 u · Propuesta en &lt;24h</div>
            <h3 className="text-white font-poppins font-bold text-lg">Regalos Corporativos B2B</h3>
            <p className="text-white/70 text-sm">Personalización láser UV gratis incluida</p>
            <Link to="/b2b/catalogo" className="mt-1">
              <Button size="sm" className="gap-2 bg-white text-[#006D5B] hover:bg-white/90 font-semibold">
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
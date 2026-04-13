import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ShoppingCart, ArrowRight, Sparkles } from 'lucide-react';

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregandoId, setAgregandoId] = useState(null);

  const categorias = ['Todos', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await base44.entities.Producto.filter({ activo: true });
        const filtered = data.filter(p => p.canal !== 'B2B Exclusivo');
        setProductos(filtered);
      } catch (e) {
        console.error('Error:', e);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    let result = productos;
    
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.categoria === selectedCategory);
    }
    
    if (search) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFiltered(result);
  }, [search, selectedCategory, productos]);

  const agregarAlCarrito = async (e, producto) => {
    e.stopPropagation();
    setAgregandoId(producto.id);
    
    const nuevoCarrito = [...carrito, {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_b2c,
      cantidad: 1,
      sku: producto.sku,
      imagen: ''
    }];
    
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    
    setTimeout(() => setAgregandoId(null), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center font-bold text-white">P</div>
            <div>
              <p className="font-poppins font-bold text-sm">PEYU</p>
              <p className="text-white/50 text-[10px]">Historias en Regalos</p>
            </div>
          </Link>

          <div className="flex-1 mx-8 flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2">
            <Search className="w-4 h-4 text-white/50" />
            <Input
              type="text"
              placeholder="Buscar por nombre, SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-0 text-white placeholder:text-white/40 focus:ring-0 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-1 text-base">💬</Button>
            </a>
            <Link to="/cart" className="relative">
              <Button size="sm" className="bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] hover:from-[#0a7558] hover:to-[#084d3a] text-white rounded-lg gap-1">
                <ShoppingCart className="w-4 h-4" />
                {carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="border-b border-white/5 py-8 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl font-poppins font-bold">
              <span className="text-white">MATERIALES PARA TU</span><br />
              <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">PROYECTO</span>
            </h1>
            <p className="text-white/70 text-sm max-w-xl">
              Kits modulares, estructura metálica y terminaciones. Cotiza directo con IA.
            </p>
            
            {/* Quick Badges */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs">
                <span>⭐ 5+ productos</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs">
                <span>🚚 Despacho express</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs">
                <span>✅ Certificados</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs">
                <span>⚡ Ausencias reales</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 py-8 grid lg:grid-cols-5 gap-6">
        {/* SIDEBAR - CATEGORÍAS */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Categories */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-3 border-b border-white/10">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Categorías</p>
              </div>
              <div className="space-y-1 p-3">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-3 border-b border-white/10">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Precio (UF)</p>
              </div>
              <div className="space-y-1 p-3">
                {['0 - 10 UF', '10 - 50 UF', '50 - 200 UF', '200 - 1.000 UF', 'Más de 1000 UF'].map(range => (
                  <label key={range} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded bg-white/20 border-white/30" />
                    <span className="text-xs text-white/70 group-hover:text-white">{range}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Stock Filter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded bg-white/20 border-white/30" />
                <span className="text-xs font-medium text-white/70">Solo en stock</span>
              </label>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="lg:col-span-4">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center font-bold">🏭</div>
              <div>
                <h2 className="text-2xl font-poppins font-bold text-white">Kits Modulares y Viviendas</h2>
                <p className="text-xs text-white/60">Oficinas, viviendas y componentes hechos en mano</p>
              </div>
              <span className="ml-auto text-sm text-white/60 font-semibold">{filtered.length} productos</span>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all hover:shadow-xl hover:shadow-orange-500/10"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Badge */}
                  {p.categoria === 'Escritorio' && (
                    <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      MODULAR
                    </div>
                  )}
                  {p.categoria === 'Corporativo' && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      CORPORATIVO
                    </div>
                  )}
                  
                  {/* Placeholder */}
                  <div className="text-6xl group-hover:scale-110 transition-transform duration-300">📦</div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-1">{p.sku}</p>
                    <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                      {p.nombre}
                    </h3>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2 text-xs text-white/60">
                    {p.material && <span>• {p.material}</span>}
                    {p.stock_actual > 0 && <span>• En stock</span>}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-white">
                      ${(p.precio_b2c / 1000).toFixed(0)}K
                    </p>
                    {p.precio_base_b2b && (
                      <p className="text-xs text-white/50">
                        Descuento B2B desde {(p.precio_base_b2b / 1000).toFixed(0)}K
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => agregarAlCarrito(e, p)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all ${
                      agregandoId === p.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    }`}
                  >
                    {agregandoId === p.id ? '✓ Agregado' : 'Cotizar ahora'}
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-white/60">No hay productos que coincidan con tu búsqueda</p>
            </div>
          )}
        </main>
      </div>

      {/* Promotional Banners */}
      <section className="max-w-7xl mx-auto px-5 pb-12 grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-yellow-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">Personalización con Láser</p>
              <p className="text-xs text-white/70">Crea tus propios diseños con grabado UV</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-400 ml-auto" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <span className="text-2xl">💼</span>
            <div>
              <p className="font-bold text-white text-sm">Catálogo B2B Corporativo</p>
              <p className="text-xs text-white/70">Precios especiales y propuestas personalizadas</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-400 ml-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
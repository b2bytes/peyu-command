import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Star, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregandoId, setAgregandoId] = useState(null);

  const productImageMap = {
    'Kit Escritorio Pro': 'https://images.unsplash.com/photo-1572365992253-3cb3e56dd362?w=600&h=600&fit=crop',
    'Carcasa': 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=600&h=600&fit=crop',
    'Cachos': 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop',
    'Accesorios Escritorio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
    'Macetero': 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&h=600&fit=crop',
    'Posavasos': 'https://images.unsplash.com/photo-1578507065211-a61d7d29cd83?w=600&h=600&fit=crop',
  };

  const getProductImage = (producto) => {
    return productImageMap[producto.nombre] || 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop';
  };

  const categorias = ['Todos', 'Navidad', 'Patrias', 'Año Nuevo', 'Día del Trabajador', 'Día de la Secretaria', 'Día del Profesor', 'Bienvenida', 'Día de la Mujer', 'Día de la Madre'];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <PEYULogo size="md" showText={true} />
          </Link>

          <div className="flex-1 mx-6 max-w-md">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5">
              <Search className="w-4 h-4 text-white/50" />
              <Input
                type="text"
                placeholder="Buscar por nombre, SKU..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-0 text-white placeholder:text-white/40 focus:ring-0 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
              🔔
            </button>
            <Link to="/cart" className="relative">
              <button className="w-10 h-10 rounded-full bg-[#0F8B6C] hover:bg-[#0a7558] flex items-center justify-center text-white transition">
                <ShoppingCart className="w-5 h-5" />
                {carrito.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-slate-800 to-blue-800 border-b border-white/10 px-6 py-16">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-6xl lg:text-7xl font-poppins font-black text-white leading-tight">
            Regalos Corporativos<br />
            <span className="text-yellow-300">100% Sostenibles</span> Con<br />
            <span className="text-emerald-400">Propósito ESG</span>
          </h1>
          <p className="text-white/80 text-lg max-w-3xl leading-relaxed">Productos de plástico reciclado con personalización láser. Diseña, crea y mide el impacto de tu programa de gifting corporativo.</p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/shop">
              <Button className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full px-8 py-3 gap-2 text-base">
                📮 Explorar Regalos
              </Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full px-8 py-3 gap-2 text-base">
                ✨ Regalos Corporativos con Propósito
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-4 gap-6">
        {/* SIDEBAR - CATEGORÍAS */}
        <aside className="lg:col-span-1 h-fit">
          <div className="sticky top-24 space-y-4">
            {/* Categories */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl overflow-hidden">
              <div className="bg-yellow-500/30 px-4 py-3 border-b border-yellow-500/20">
                <p className="text-xs font-bold text-yellow-200 uppercase tracking-widest">CATEGORÍAS</p>
              </div>
              <div className="space-y-1 p-3">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-yellow-500 text-gray-900'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-white/10 px-4 py-3 border-b border-white/10">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">PRECIO (CLP)</p>
              </div>
              <div className="space-y-1 p-3">
                {['Todos', '$0 - $50.000 CLP', '$50.000 - $200.000 CLP', '$200.000 - $1.000.000 CLP', 'Más de $1.000.000 CLP'].map(range => (
                  <label key={range} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded bg-white/20 border-white/30" />
                    <span className="text-xs text-white/70 group-hover:text-white">{range}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="lg:col-span-3">

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                className="group bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-white/15 rounded-3xl overflow-hidden hover:border-white/30 transition-all hover:shadow-2xl hover:shadow-orange-500/20"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden">
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    {p.categoria === 'Escritorio' && (
                      <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Sostenible
                      </div>
                    )}
                    {p.categoria === 'Corporativo' && (
                      <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Exclusivo
                      </div>
                    )}
                    {p.categoria === 'Entretenimiento' && (
                      <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Experiencia
                      </div>
                    )}
                    {p.categoria === 'Hogar' && (
                      <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Tecnología
                      </div>
                    )}
                    {p.categoria === 'Carcasas B2C' && (
                      <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Especial
                      </div>
                    )}
                  </div>
                  
                  {/* Product Image */}
                  <img 
                    src={getProductImage(p)}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop'}
                  />
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-white group-hover:text-yellow-300 transition-colors line-clamp-2 mb-2">
                      {p.nombre}
                    </h3>
                    <p className="text-xs text-white/60">{p.descripcion}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                      ))}
                    </div>
                    <span className="text-xs text-white/60">(4.8)</span>
                  </div>

                  {/* Pricing */}
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-3 space-y-1">
                    <p className="text-2xl font-black text-white">
                      CLP ${(p.precio_b2c).toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs text-white/60">Entrega en 7 días</p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => agregarAlCarrito(e, p)}
                    className="w-full py-3 rounded-xl text-sm font-bold shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all uppercase tracking-wide"
                  >
                    {agregandoId === p.id ? '✓ Agregado' : 'Explorar Regalo'}
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
    </div>
  );
}
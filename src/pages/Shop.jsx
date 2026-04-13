import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Star } from 'lucide-react';
import PEYULogo from '@/components/PEYULogo';

export default function Shop() {
  const [productos, setProductos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregandoId, setAgregandoId] = useState(null);

  const productImageMap = {
    'Kit Escritorio Pro': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
    'Soporte Celular Aguas': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5085b8b77_WhatsAppImage2026-03-23at51806PM2.jpg',
    'Soporte Notebook': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/f9a08d799_kitclasico.jpg',
    'Soporte Aguas Andinas': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/407f18312_WhatsAppImage2026-03-23at51544PM.jpg',
    'Carcasa': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b5b3cf211_kitclassssprro2.jpg',
    'Cachos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/da02d09c2_kitclassssprro4.jpg',
    'Accesorios Escritorio': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/8f212c064_kitclassssprro1.jpg',
    'Macetero': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/355ca531a_sopooll1.jpg',
    'Posavasos': 'https://media.base44.com/images/public/69d99b9d61f699701129c103/4bfe4fc51_sopooll.jpg',
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
    <div className="min-h-screen font-inter" style={{
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 78, 137, 0.75) 50%, rgba(15, 23, 42, 0.75) 100%), url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-105 transition-transform">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[15px] font-poppins font-bold leading-none text-white">PEYU</p>
              <p className="text-[10px] text-white/60 leading-none mt-0.5">Tienda B2C</p>
            </div>
          </Link>
          <div className="flex-1 mx-4 sm:mx-6 max-w-sm">
            <div className="flex items-center gap-2 bg-white/10 border border-white/30 rounded-lg px-3 py-2 backdrop-blur-sm">
              <Search className="w-4 h-4 text-white/50" />
              <Input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-0 text-white placeholder:text-white/40 focus:ring-0 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/b2b/catalogo">
              <Button variant="ghost" size="sm" className="rounded-lg text-white/70 hover:text-white hidden sm:inline-flex">B2B</Button>
            </Link>
            <Link to="/cart" className="relative">
              <button className="w-10 h-10 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 flex items-center justify-center text-white transition-all active:scale-95 shadow-lg shadow-teal-500/30">
                <ShoppingCart className="w-5 h-5" />
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                    {carrito.length}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-5 py-16 sm:py-20 text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-poppins font-bold leading-[1.1] text-white drop-shadow-lg">
            Regalos corporativos
            <br /><span className="text-cyan-300">100% sostenibles</span>
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed drop-shadow font-medium">
            Plástico reciclado con personalización láser. Productos de calidad con garantía 10 años.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 py-12 grid lg:grid-cols-4 gap-6">
        {/* SIDEBAR - CATEGORÍAS */}
        <aside className="lg:col-span-1 h-fit">
          <div className="sticky top-20 space-y-4">
            {/* Categories */}
            <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="bg-white/10 px-4 py-3 border-b border-white/20">
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Categorías</p>
              </div>
              <div className="space-y-1 p-3">
                {categorias.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-teal-500/30 text-white border border-teal-500/50'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="bg-white/10 px-4 py-3 border-b border-white/20">
                <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Precio (CLP)</p>
              </div>
              <div className="space-y-2 p-3">
                {['Todos', '$0 - $50K', '$50K - $200K', '$200K - $1M', '+$1M'].map(range => (
                  <label key={range} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/30 accent-teal-400" />
                    <span className="text-sm text-white/70 group-hover:text-white">{range}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="lg:col-span-3">
          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <Link
                key={p.id}
                to={`/producto/${p.id}`}
                className="group bg-white/5 border border-white/20 rounded-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
              >
                {/* Product Image */}
                <div className="relative w-full aspect-square bg-gradient-to-br from-yellow-300/50 via-orange-400/40 to-red-500/30 flex items-center justify-center overflow-hidden">
                  <img 
                    src={getProductImage(p)}
                    alt={p.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop'}
                  />
                  <div className="absolute top-3 left-3 bg-teal-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    {p.categoria}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3 bg-gradient-to-b from-white/10 to-white/5">
                  <div>
                    <h3 className="font-poppins font-bold text-white line-clamp-2 text-sm drop-shadow">
                      {p.nombre}
                    </h3>
                    <p className="text-xs text-white/70 mt-1 line-clamp-2">{p.descripcion}</p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400 drop-shadow" />
                      ))}
                    </div>
                    <span className="text-xs text-white/60">(4.8)</span>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/20 border border-teal-400/40 rounded-lg p-3 backdrop-blur">
                    <p className="text-2xl font-poppins font-bold text-white drop-shadow">
                      ${(p.precio_b2c).toLocaleString('es-CL')}
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">Entrega 7 días</p>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={(e) => agregarAlCarrito(e, p)}
                    className="w-full py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white transition-all active:scale-95 shadow-lg shadow-teal-500/30"
                  >
                    {agregandoId === p.id ? '✓ En carrito' : 'Agregar'}
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/70 font-medium">No hay productos que coincidan</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
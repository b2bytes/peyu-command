import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Filter, Building2, Sparkles } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

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

  if (loading) return <div className="p-6 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F8B6C' }}>PEYU</h1>
            <p className="text-sm text-muted-foreground">Productos Sustentables</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/b2b/catalogo">
              <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex" style={{ borderColor: '#006D5B', color: '#006D5B' }}>
                <Building2 className="w-4 h-4" />
                Corporativo
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                {carrito.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Categorías</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!categoriaFiltro ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFiltro('')}
              style={!categoriaFiltro ? { backgroundColor: '#0F8B6C' } : {}}
            >
              Todos
            </Button>
            {categorias.map(cat => (
              <Button
                key={cat}
                variant={categoriaFiltro === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltro(cat)}
                style={categoriaFiltro === cat ? { backgroundColor: '#0F8B6C' } : {}}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrado.map(p => (
            <Link key={p.id} to={`/producto/${p.id}`}>
              <div className="group cursor-pointer border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Placeholder para imagen */}
                <div className="bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] h-48 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm font-semibold">{p.nombre}</p>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{p.nombre}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{p.categoria}</p>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground line-through">
                        ${p.precio_b2c?.toLocaleString('es-CL') || '—'}
                      </div>
                      <div className="text-lg font-bold" style={{ color: '#0F8B6C' }}>
                        ${Math.floor(p.precio_b2c * 0.85)?.toLocaleString('es-CL')}
                      </div>
                    </div>
                    <div className="text-xs bg-[#0F8B6C] text-white px-2 py-1 rounded-full">
                      {p.material?.includes('100%') ? '♻️ Reciclado' : '🌾 Compostable'}
                    </div>
                  </div>

                  {p.moq_personalizacion && (
                    <p className="text-xs text-blue-600 mt-2">✨ Personalizable</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtrado.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay productos en esta categoría</p>
          </div>
        )}

        {/* Personalización B2C Banner */}
        <div className="mt-6 bg-gradient-to-r from-[#1a1a1a] to-[#4B4F54] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 justify-between">
          <div className="text-white space-y-1.5">
            <div className="text-sm text-white/60">Nuevo · Personalización en tienda</div>
            <h3 className="text-xl font-bold font-poppins">Grabado láser UV en tu producto</h3>
            <p className="text-white/70 text-sm">Tu nombre, empresa o frase favorita grabada con láser · Listo en 5 minutos</p>
          </div>
          <Link to="/personalizar" className="shrink-0">
            <Button size="lg" className="gap-2 bg-white text-[#1a1a1a] hover:bg-white/90 font-semibold whitespace-nowrap">
              <Sparkles className="w-5 h-5" />
              Personalizar mi producto
            </Button>
          </Link>
        </div>

        {/* B2B Banner */}
        <div className="mt-6 bg-gradient-to-r from-[#0F172A] to-[#006D5B] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 justify-between">
          <div className="text-white space-y-2">
            <div className="text-sm text-white/60">Compra en volumen</div>
            <h3 className="text-xl font-bold font-poppins">Regalos corporativos desde 10 unidades</h3>
            <p className="text-white/70 text-sm">Personalización láser UV gratis · Propuesta en &lt;24h · -25% desde 500 u.</p>
          </div>
          <Link to="/b2b/catalogo" className="shrink-0">
            <Button size="lg" className="gap-2 bg-white text-[#006D5B] hover:bg-white/90 font-semibold whitespace-nowrap">
              <Building2 className="w-5 h-5" />
              Ver Catálogo B2B
            </Button>
          </Link>
        </div>
        </div>

        <WhatsAppWidget context="general" />
    </div>
  );
}
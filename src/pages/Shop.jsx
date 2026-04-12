import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Filter } from 'lucide-react';

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
      </div>
    </div>
  );
}
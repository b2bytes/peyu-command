import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Leaf, Award, Truck } from 'lucide-react';

export default function ShopLanding() {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await base44.entities.Producto.filter({ activo: true });
        setProductosDestacados(data.slice(0, 6));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#0F8B6C' }}>PEYU</h1>
            <p className="text-xs text-muted-foreground">Plástico Reciclado Sustentable</p>
          </div>
          <Link to="/cart">
            <Button variant="outline" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrito
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div>
            <h2 className="text-5xl font-bold mb-4">Productos Sustentables</h2>
            <p className="text-lg opacity-90">Plástico 100% reciclado para un futuro mejor</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link to="/shop">
              <Button size="lg" className="gap-2 bg-white text-[#0F8B6C] hover:bg-gray-100">
                <ShoppingCart className="w-5 h-5" />
                Explorar Tienda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8" style={{ color: '#0F8B6C' }} />
            </div>
            <h3 className="font-bold text-lg mb-2">100% Reciclado</h3>
            <p className="text-muted-foreground">Todos nuestros productos usan plástico reciclado de calidad premium</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Certificado ESG</h3>
            <p className="text-muted-foreground">Con certificación ambiental internacional</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Envío Rápido</h3>
            <p className="text-muted-foreground">Despachamos en 24-48 horas a todo Chile</p>
          </div>
        </div>

        {/* Productos destacados */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-2">Productos Destacados</h3>
            <p className="text-muted-foreground">Nuestros artículos más populares</p>
          </div>

          {loading ? (
            <div className="text-center py-12">Cargando productos...</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {productosDestacados.map(p => (
                <Link key={p.id} to={`/producto/${p.id}`}>
                  <div className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                    <div className="bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] h-48 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <div className="text-center text-white">
                        <div className="text-5xl mb-2">📦</div>
                        <p className="font-semibold">{p.nombre}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold">{p.nombre}</h4>
                        <p className="text-xs text-muted-foreground">{p.categoria}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="text-sm text-muted-foreground line-through">
                          ${p.precio_b2c?.toLocaleString('es-CL')}
                        </div>
                        <div className="text-lg font-bold" style={{ color: '#0F8B6C' }}>
                          ${Math.floor(p.precio_b2c * 0.85)?.toLocaleString('es-CL')}
                        </div>
                      </div>
                      {p.moq_personalizacion && (
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                          ✨ Personalizable
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center pt-8">
            <Link to="/shop">
              <Button size="lg" style={{ backgroundColor: '#0F8B6C' }}>
                Ver Todos los Productos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-[#E7D8C6] py-12 px-4 mt-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-bold">¿Buscas personalización?</h3>
          <p className="text-muted-foreground">
            Todos nuestros productos pueden personalizarse con tu logo o texto. Mínimo 10 unidades.
          </p>
          <Link to="/cpq">
            <Button className="gap-2" style={{ backgroundColor: '#0F8B6C' }}>
              Solicitar Cotización Personalizada
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-foreground text-white py-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold mb-3">PEYU</h4>
            <p className="text-sm opacity-75">Plástico reciclado para un futuro sustentable</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Información</h4>
            <ul className="text-sm space-y-1 opacity-75">
              <li><a href="#" className="hover:opacity-100">Sobre nosotros</a></li>
              <li><a href="#" className="hover:opacity-100">Política de privacidad</a></li>
              <li><a href="#" className="hover:opacity-100">Términos y condiciones</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Contacto</h4>
            <p className="text-sm opacity-75">
              Correo: ventas@peyu.cl<br />
              WhatsApp: +56 9 xxxx xxxx
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm opacity-50">
          © 2026 Peyu Chile SPA. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
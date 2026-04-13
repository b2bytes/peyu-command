import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Leaf, Award, Truck, Building2 } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

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
          <Link to="/">
            <div className="cursor-pointer hover:opacity-80 transition">
              <h1 className="text-2xl font-bold" style={{ color: '#0F8B6C' }}>PEYU</h1>
              <p className="text-xs text-muted-foreground">Plástico Reciclado Sustentable</p>
            </div>
          </Link>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button size="lg" className="gap-2 bg-white text-[#006D5B] hover:bg-gray-50">
                <ShoppingCart className="w-5 h-5" />
                Tienda B2C
              </Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="lg" variant="outline" className="gap-2 border-2 border-white text-white hover:bg-white/15">
                <Building2 className="w-5 h-5" />
                Cotización Corporativa
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

      {/* B2B Section */}
      <div className="bg-[#0F172A] py-16 px-4 mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-white space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium">
              <Building2 className="w-4 h-4" /> Ventas Corporativas B2B
            </div>
            <h3 className="text-2xl font-bold font-poppins">Regalos corporativos con propósito</h3>
            <p className="text-white/70 max-w-xl mx-auto">
              Kit escritorio, posavasos, maceteros y más — todos con plástico 100% reciclado, personalizados con tu logo mediante láser galvo UV.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[{e: '🎨', t: 'Mockup gratis', d: 'Con tu logo en 30 minutos'}, {e: '⚡', t: 'Propuesta en <24h', d: 'Con precios y condiciones'}, {e: '🏭', t: 'Fabricación local', d: '6 inyectoras automáticas en Chile'}].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 text-white text-center">
                <div className="text-2xl mb-2">{f.e}</div>
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-white/60 text-xs mt-1">{f.d}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/b2b/contacto">
              <Button size="lg" style={{ backgroundColor: '#006D5B' }} className="gap-2 font-semibold">
                <Building2 className="w-5 h-5" />
                Solicitar cotización corporativa
              </Button>
            </Link>
            <p className="text-white/50 text-xs mt-3">Respondemos en menos de 24 horas · Adidas, Nestlé, BancoEstado confían en Peyu</p>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-[#E7D8C6] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h3 className="text-2xl font-bold font-poppins">¿Tienes plástico para reciclar?</h3>
          <p className="text-muted-foreground">
            Transformamos los residuos plásticos de tu empresa en regalos corporativos personalizados. Economía circular real.
          </p>
          <Link to="/b2b/contacto">
            <Button className="gap-2 font-semibold" style={{ backgroundColor: '#006D5B' }}>
              Cotización Corporativa →
            </Button>
          </Link>
        </div>
      </div>

      <WhatsAppWidget context="general" />

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
              Correo: ventas@peyuchile.cl<br />
              WhatsApp: +56 9 3504 0242
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
import InstagramGallery from '@/components/InstagramGallery';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart } from 'lucide-react';

export default function CatalogoVisual() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-3xl">🐢</div>
            <div>
              <p className="font-poppins font-bold text-gray-900">PEYU Chile</p>
              <p className="text-xs text-gray-500">Regalos Sostenibles</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/shop">
              <Button className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558]">
                <ShoppingCart className="w-4 h-4" />
                Ir a Tienda
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-gray-200 py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-5xl font-poppins font-bold text-gray-900">
              Catálogo Visual PEYU <br/>
              <span className="text-[#0F8B6C]">Regalos Corporativos Sostenibles</span>
            </h1>
            <p className="text-lg text-gray-600">
              100% plástico reciclado • Personalización láser UV • 10 años de garantía
            </p>
            
            <div className="flex gap-3 flex-wrap pt-4">
              <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-full px-4 py-2">
                <span className="text-xl">♻️</span>
                <span className="text-sm font-semibold text-gray-700">100% Reciclado</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded-full px-4 py-2">
                <span className="text-xl">🌱</span>
                <span className="text-sm font-semibold text-gray-700">Eco Certificado</span>
              </div>
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded-full px-4 py-2">
                <span className="text-xl">✨</span>
                <span className="text-sm font-semibold text-gray-700">Personalizable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <InstagramGallery />

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#0F8B6C] to-[#0a7558] text-white py-16 px-5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-poppins font-bold">¿Listo para Transformar tu Regalo Corporativo?</h2>
          <p className="text-lg text-white/90">
            Diseña tu propuesta personalizada. Desde kits pequeños hasta campañas masivas, nosotros te acompañamos.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/shop">
              <Button className="bg-white hover:bg-gray-100 text-[#0F8B6C] font-bold text-lg px-8 py-6 rounded-xl gap-2">
                Explorar Tienda <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
              <Button className="bg-white/20 hover:bg-white/30 text-white font-bold text-lg px-8 py-6 rounded-xl gap-2 border border-white">
                💬 Consultar B2B
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-poppins font-bold text-lg mb-3">PEYU Chile</h3>
            <p className="text-gray-400 text-sm">Regalos corporativos 100% sostenibles con propósito ESG.</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Enlaces</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition">Tienda</Link></li>
              <li><Link to="/b2b/contacto" className="hover:text-white transition">B2B</Link></li>
              <li><Link to="/soporte" className="hover:text-white transition">Soporte</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📱 +56 9 3504 0242</li>
              <li>📧 ventas@peyuchile.cl</li>
              <li>📍 Providencia, Santiago</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 PEYU Chile. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
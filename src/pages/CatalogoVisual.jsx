import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Building2, Grid3x3, Recycle, Star, Zap } from 'lucide-react';
import SocialProductFeed from '@/components/SocialProductFeed';


const BADGES = [
  { icon: '♻️', label: '100% Reciclado' },
  { icon: '🌱', label: 'Eco Certificado' },
  { icon: '✨', label: 'Personalizable' },
  { icon: '🏆', label: 'Garantía 10 años' },
];

const STATS = [
  { value: '500K+', label: 'kg plástico reciclado', icon: Recycle },
  { value: '1,200+', label: 'empresas atendidas', icon: Building2 },
  { value: '4.9★', label: 'calificación promedio', icon: Star },
  { value: '0 días', label: 'envío express disponible', icon: Zap },
];

export default function CatalogoVisual() {
  return (
    <div className="flex-1 overflow-auto font-inter">

        {/* Hero */}
        <section className="px-4 sm:px-8 py-14 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
            <Grid3x3 className="w-4 h-4" /> Catálogo Visual PEYU
          </div>
          <h1 className="text-4xl md:text-6xl font-poppins font-black leading-tight text-white drop-shadow-lg">
            Regalos Corporativos<br />
            <span className="text-cyan-400">100% Sostenibles</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Plástico 100% reciclado · Personalización láser UV · 10 años de garantía · Fabricación local Chile
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {BADGES.map((b, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/15 transition-all">
                <span className="text-lg">{b.icon}</span>
                <span className="text-sm font-semibold text-white">{b.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            {STATS.map((s, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-4 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-poppins font-black text-white">{s.value}</p>
                <p className="text-xs text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feed de Productos estilo Instagram — con compra real */}
        <section className="px-4 sm:px-8 pb-10 max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 border border-pink-400/30 flex items-center justify-center text-lg">📷</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-poppins font-bold text-white text-lg">Feed de Productos</h2>
                <p className="text-white/50 text-xs">Toca una foto para ver el detalle · compra o cotiza B2B</p>
              </div>
            </div>
            <SocialProductFeed />
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-8 pb-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/15 backdrop-blur-md border border-teal-400/30 rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-poppins font-black text-white drop-shadow">
              ¿Listo para transformar<br />
              <span className="text-cyan-400">tu regalo corporativo?</span>
            </h2>
            <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed">
              Desde kits pequeños hasta campañas masivas, diseñamos tu propuesta personalizada con mockup incluido.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/shop">
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-base px-8 py-6 rounded-2xl gap-2 shadow-xl shadow-teal-500/30 border-0">
                  Explorar Tienda <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button className="bg-white/15 hover:bg-white/25 text-white font-bold text-base px-8 py-6 rounded-2xl gap-2 border border-white/30 backdrop-blur-sm">
                  💬 Consultar B2B
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-sm px-4 sm:px-8 py-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-poppins font-bold text-white text-lg mb-2">PEYU Chile</h3>
              <p className="text-white/40 text-sm">Regalos corporativos 100% sostenibles con propósito ESG.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Enlaces</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to="/shop" className="hover:text-white transition">Tienda</Link></li>
                <li><Link to="/b2b/contacto" className="hover:text-white transition">B2B</Link></li>
                <li><Link to="/soporte" className="hover:text-white transition">Soporte</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Contacto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>📱 +56 9 3504 0242</li>
                <li>📧 ventas@peyuchile.cl</li>
                <li>📍 Providencia, Santiago</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/30 text-sm">
            <p>© 2026 PEYU Chile. Todos los derechos reservados.</p>
          </div>
        </footer>
    </div>
  );
}
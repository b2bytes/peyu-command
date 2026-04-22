import { Link } from 'react-router-dom';
import { MessageCircle, Mail, MapPin, ArrowRight } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-24 lg:pb-12 px-5">
      {/* CTA fuerte antes del grid */}
      <div className="max-w-7xl mx-auto mb-10 bg-gradient-to-r from-teal-600/30 to-cyan-600/30 border border-teal-400/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-poppins font-bold text-xl md:text-2xl">¿Listo para regalar con propósito?</h3>
          <p className="text-sm text-white/70 mt-1">Cotiza tu pedido corporativo en menos de 24 horas.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/b2b/contacto" className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-teal-50 transition-colors">
            Cotizar B2B <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/56935040242?text=Hola%20PEYU%2C%20me%20interesa%20cotizar"
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐢</span>
            <h3 className="font-poppins font-bold text-lg">PEYU Chile</h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Regalos corporativos 100% sostenibles con personalización láser UV. Fabricados en Santiago con plástico reciclado.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-[#25D366]/20 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/30 transition-colors text-sm">💬</a>
            <a href="https://instagram.com/peyuchile" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 hover:bg-pink-500/30 transition-colors text-sm">📸</a>
            <a href="https://linkedin.com/company/peyuchile" target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/30 transition-colors text-sm">💼</a>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Tienda</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/shop" className="hover:text-white transition-colors">Todos los productos</Link></li>
            <li><Link to="/catalogo-visual" className="hover:text-white transition-colors">Catálogo visual</Link></li>
            <li><Link to="/personalizar" className="hover:text-white transition-colors">Personalizar producto</Link></li>
            <li><Link to="/seguimiento" className="hover:text-white transition-colors">Seguimiento de pedido</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Empresa</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/b2b/catalogo" className="hover:text-white transition-colors">Catálogo B2B</Link></li>
            <li><Link to="/b2b/contacto" className="hover:text-white transition-colors">Solicitar cotización</Link></li>
            <li><Link to="/nosotros" className="hover:text-white transition-colors">Quiénes somos</Link></li>
            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas frecuentes</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Contacto</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <a href="https://wa.me/56935040242?text=Hola%20PEYU" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" /> +56 9 3504 0242
              </a>
            </li>
            <li>
              <a href="mailto:ventas@peyuchile.cl" className="hover:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400" /> ventas@peyuchile.cl
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <span>F. Bilbao 3775, Providencia<br />P. Valdivia 6603, Macul</span>
            </li>
            <li className="pt-2">
              <Link to="/contacto" className="text-teal-300 hover:text-teal-200 font-semibold inline-flex items-center gap-1">
                Ver todos los canales <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© 2026 PEYU Chile SpA · Todos los derechos reservados</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/terminos" className="hover:text-gray-300">Términos</Link>
          <Link to="/privacidad" className="hover:text-gray-300">Privacidad</Link>
          <Link to="/cookies" className="hover:text-gray-300">Cookies</Link>
          <Link to="/envios" className="hover:text-gray-300">Envíos</Link>
          <Link to="/cambios" className="hover:text-gray-300">Cambios</Link>
          <Link to="/contacto" className="hover:text-gray-300">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}
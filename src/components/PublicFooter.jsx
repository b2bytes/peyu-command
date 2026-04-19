import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-5">
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
          <h4 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Corporativo</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/b2b/catalogo" className="hover:text-white transition-colors">Catálogo B2B</Link></li>
            <li><Link to="/b2b/contacto" className="hover:text-white transition-colors">Solicitar cotización</Link></li>
            <li><Link to="/nosotros" className="hover:text-white transition-colors">Quiénes somos</Link></li>
            <li><Link to="/soporte" className="hover:text-white transition-colors">Centro de ayuda</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-sm text-gray-300 uppercase tracking-wider">Contacto</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>
              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-2">
                💬 +56 9 3504 0242
              </a>
            </li>
            <li>
              <a href="mailto:ventas@peyuchile.cl" className="hover:text-white flex items-center gap-2">
                📧 ventas@peyuchile.cl
              </a>
            </li>
            <li className="flex items-start gap-2">
              <span>📍</span>
              <span>F. Bilbao 3775, Providencia<br />P. Valdivia 6603, Macul</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© 2026 PEYU Chile SpA · RUT 76.XXX.XXX-X · Todos los derechos reservados</p>
        <div className="flex gap-4">
          <Link to="/soporte" className="hover:text-gray-300">Términos y condiciones</Link>
          <Link to="/soporte" className="hover:text-gray-300">Política de privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
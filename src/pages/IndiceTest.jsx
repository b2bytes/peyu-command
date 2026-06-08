import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle2, ShoppingCart, Building2, Sparkles, Package, Globe, BookOpen, HelpCircle, Truck } from 'lucide-react';

/**
 * IndiceTest — Índice de todas las rutas públicas para QA / test manual.
 * Accesible en /test-index (no indexada por SEO).
 */

const GRUPOS = [
  {
    label: 'Tienda Nueva (v2)',
    color: 'from-teal-500 to-cyan-500',
    icon: ShoppingCart,
    rutas: [
      { path: '/TiendaNueva', desc: 'Home shop v2' },
      { path: '/CatalogoNuevo', desc: 'Catálogo v2' },
      { path: '/ProductoNuevo', desc: 'Detalle producto v2 (requiere ?id=)' },
      { path: '/CarritoNuevo', desc: 'Carrito v2' },
      { path: '/CheckoutNuevo', desc: 'Checkout v2 (envío + pago + retiro en tienda)' },
      { path: '/CotizacionRapida', desc: 'Cotización rápida' },
    ],
  },
  {
    label: 'Tienda Clásica',
    color: 'from-emerald-500 to-green-500',
    icon: ShoppingCart,
    rutas: [
      { path: '/', desc: 'Landing / chat Peyu' },
      { path: '/shop', desc: 'Tienda clásica' },
      { path: '/cart', desc: 'Carrito clásico' },
      { path: '/personalizar', desc: 'Flujo personalización láser (mockup bubble)' },
      { path: '/gracias', desc: 'Página de gracias (requiere ?numero=&email=)' },
    ],
  },
  {
    label: 'B2B Corporativo',
    color: 'from-amber-500 to-yellow-500',
    icon: Building2,
    rutas: [
      { path: '/b2b/self-service', desc: 'Self-service B2B (cotización + propuesta)' },
      { path: '/b2b/contacto', desc: 'Formulario contacto B2B' },
      { path: '/b2b/catalogo', desc: 'Catálogo corporativo' },
      { path: '/b2b/propuesta', desc: 'Ver propuesta (requiere ?id=)' },
      { path: '/b2b/mi-cuenta', desc: 'Panel cliente B2B' },
      { path: '/EmpresasNuevo', desc: 'Landing empresas v2' },
      { path: '/EmpresaProducto', desc: 'Detalle producto corporativo v2' },
    ],
  },
  {
    label: 'Checkout & Pagos',
    color: 'from-blue-500 to-indigo-500',
    icon: CheckCircle2,
    rutas: [
      { path: '/CheckoutNuevo', desc: '✅ Código postal eliminado · Retiro en tienda disponible' },
      { path: '/canjear', desc: 'Canjear gift card' },
      { path: '/regalar-giftcard', desc: 'Regalar gift card' },
      { path: '/seguimiento', desc: 'Seguimiento pedido (requiere ?pedido=)' },
    ],
  },
  {
    label: 'Logística & Envío',
    color: 'from-cyan-500 to-blue-500',
    icon: Truck,
    rutas: [
      { path: '/envios', desc: 'Política de envíos' },
      { path: '/seguimiento', desc: 'Tracking público' },
      { path: '/cambios', desc: 'Cambios y devoluciones' },
    ],
  },
  {
    label: 'Contenido & SEO',
    color: 'from-purple-500 to-pink-500',
    icon: BookOpen,
    rutas: [
      { path: '/blog', desc: 'Blog' },
      { path: '/nosotros', desc: 'Nosotros' },
      { path: '/catalogo-visual', desc: 'Catálogo visual (SEO)' },
      { path: '/faq', desc: 'FAQ' },
      { path: '/contacto', desc: 'Contacto' },
      { path: '/lanzamiento', desc: 'Landing lanzamiento' },
      { path: '/propuesta-valor-peyu', desc: 'Propuesta de valor (fundadores)' },
    ],
  },
  {
    label: 'Legal',
    color: 'from-slate-500 to-gray-500',
    icon: Globe,
    rutas: [
      { path: '/terminos', desc: 'Términos y condiciones' },
      { path: '/privacidad', desc: 'Política de privacidad' },
      { path: '/cookies', desc: 'Política de cookies' },
    ],
  },
  {
    label: 'Soporte',
    color: 'from-rose-500 to-red-500',
    icon: HelpCircle,
    rutas: [
      { path: '/soporte', desc: 'Centro de soporte público' },
    ],
  },
  {
    label: 'Diseño & Labs',
    color: 'from-fuchsia-500 to-violet-500',
    icon: Sparkles,
    rutas: [
      { path: '/brand', desc: 'Brand Lab (design system)' },
      { path: '/v2', desc: 'Peyu Commerce OS v2' },
      { path: '/design-lab', desc: 'Funnel Design Lab' },
      { path: '/founders-presentation', desc: 'Presentación fundadores' },
    ],
  },
];

const CAMBIOS_RECIENTES = [
  { area: 'Checkout', desc: 'Código postal eliminado del formulario de envío', status: 'done' },
  { area: 'Envío', desc: 'Retiro en tienda · Pedro de Valdivia 6603, Macul · GRATIS', status: 'done' },
  { area: 'Emails', desc: 'B2C → ventas@peyuchile.cl · B2B → corporativos@peyuchile.cl', status: 'done' },
  { area: 'Mockup', desc: 'Bubble de aprobación visible junto al botón pagar en /personalizar', status: 'done' },
  { area: 'Grabado', desc: 'Tinta automática: oscuro→gris claro, claro→gris oscuro', status: 'done' },
];

export default function IndiceTest() {
  const total = GRUPOS.reduce((s, g) => s + g.rutas.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold mb-4">
            🧪 QA · Índice de Test
          </div>
          <h1 className="text-3xl font-poppins font-bold mb-2">PEYU · Rutas Públicas</h1>
          <p className="text-white/60 text-sm">{total} rutas · Generado {new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Cambios recientes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-poppins font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Cambios recientes a testear hoy
          </h2>
          <div className="space-y-2">
            {CAMBIOS_RECIENTES.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                <div>
                  <span className="text-xs font-bold text-green-800 uppercase tracking-wide">{c.area}</span>
                  <p className="text-sm text-gray-700 mt-0.5">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grupos de rutas */}
        {GRUPOS.map((grupo) => {
          const Icon = grupo.icon;
          return (
            <div key={grupo.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${grupo.color} px-5 py-3 flex items-center gap-2.5`}>
                <Icon className="w-4 h-4 text-white" />
                <h2 className="font-poppins font-bold text-white text-sm">{grupo.label}</h2>
                <span className="ml-auto text-white/70 text-xs font-semibold">{grupo.rutas.length} rutas</span>
              </div>
              <div className="divide-y divide-gray-100">
                {grupo.rutas.map((ruta) => (
                  <div key={ruta.path} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <code className="text-xs font-mono text-blue-600 font-semibold w-64 flex-shrink-0 truncate">{ruta.path}</code>
                    <p className="text-sm text-gray-600 flex-1 truncate">{ruta.desc}</p>
                    <a
                      href={ruta.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                      Abrir <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-center text-xs text-gray-400 pb-4">PEYU · Página de QA interno · No indexada</p>
      </div>
    </div>
  );
}
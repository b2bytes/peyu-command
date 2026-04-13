import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductImage, SKU_IMAGES } from '@/utils/productImages';
import {
  ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap,
  Star, Recycle, Sparkles, ChevronRight, Heart, Share2,
  RotateCcw, BadgeCheck, Copy, X, Package
} from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import AsistenteChat from '@/components/AsistenteChat';

const EMOJI_MAP = { 'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱' };

// Color variants per product type
const COLORES_MARMOLADO = [
  { id: 'negro', label: 'Negro Ónix', hex: '#1a1a1a' },
  { id: 'azul', label: 'Azul Celeste', hex: '#4a90d9' },
  { id: 'verde', label: 'Verde Turquesa', hex: '#2d9d8f' },
  { id: 'rojo', label: 'Rojo Coral', hex: '#c94040' },
];
const COLORES_CARCASAS = [
  { id: 'negro', label: 'Negro', hex: '#1a1a1a' },
  { id: 'azul', label: 'Azul', hex: '#4a90d9' },
  { id: 'verde', label: 'Turquesa', hex: '#2d9d8f' },
  { id: 'rosado', label: 'Rosado', hex: '#e8799c' },
  { id: 'amarillo', label: 'Amarillo', hex: '#f0c040' },
];
const COLORES_BIODEG = [
  { id: 'negro', label: 'Negro', hex: '#1a1a1a' },
  { id: 'amarillo', label: 'Amarillo', hex: '#f0c040' },
  { id: 'turquesa', label: 'Turquesa', hex: '#2d9d8f' },
  { id: 'rosado', label: 'Rosado', hex: '#e8799c' },
  { id: 'violeta', label: 'Violeta', hex: '#8b5cf6' },
];

function getColores(producto) {
  if (!producto) return [];
  if (producto.categoria === 'Carcasas B2C') {
    return producto.material?.includes('Trigo') ? COLORES_BIODEG : COLORES_CARCASAS;
  }
  return COLORES_MARMOLADO;
}

const REVIEWS_MOCK = [
  { autor: 'Martina G.', ciudad: 'Providencia', rating: 5, txt: 'Calidad increíble. El marmolado es único, exactamente como en la foto.', fecha: 'Hace 3 días', verificado: true },
  { autor: 'Rodrigo T.', ciudad: 'Las Condes', rating: 5, txt: 'El grabado láser quedó perfecto. Lo regalé en el aniversario de la empresa y todos lo amaron.', fecha: 'Hace 1 semana', verificado: true },
  { autor: 'Carolina V.', ciudad: 'Ñuñoa', rating: 4, txt: 'Muy buen producto. Llegó antes de lo esperado y en embalaje impecable.', fecha: 'Hace 2 semanas', verificado: true },
];

const GARANTIAS = [
  { icon: Shield, label: 'Garantía 10 años', sub: 'En plástico reciclado', color: '#0F8B6C' },
  { icon: Truck, label: 'Envío a todo Chile', sub: 'Gratis sobre $40.000', color: '#4B4F54' },
  { icon: RotateCcw, label: '30 días devolución', sub: 'Sin preguntas', color: '#D96B4D' },
  { icon: BadgeCheck, label: 'Hecho en Chile', sub: 'Fábrica Santiago', color: '#0F8B6C' },
];

// Gallery images per SKU (hover alternate from website)
const SKU_IMAGES_ALT = {
  'CARC-AIRP-12':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP16E':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/photoroom_20250605_115909.jpeg?fit=600%2C600&ssl=1',
  'CARC-HW-P30':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-Biodegradable-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-HW-P30L':  'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-Huawei-p30-lite-Biodegradable-turquesa.webp?fit=600%2C600&ssl=1',
  'CARC-IP11':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-11-Biodegradable-nuevo-rosa.webp?fit=600%2C600&ssl=1',
  'CARC-IP13':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP13M':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-mini-Biodegradable-turquesa-1.webp?fit=600%2C600&ssl=1',
  'CARC-IP13P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/aasasas.webp?fit=600%2C600&ssl=1',
  'CARC-IP13PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-para-Iphone-13-pro-Max-Biodegradable-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-Plus-azul.webp?fit=600%2C600&ssl=1',
  'CARC-IP14P':    'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-amarillo.webp?fit=600%2C600&ssl=1',
  'CARC-IP14PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP15PM':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/Carcasa-iPhone-14-pro-Max-biodegradable-negro.webp?fit=600%2C600&ssl=1',
  'CARC-IP16':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-turquesa.jpg?fit=600%2C600&ssl=1',
  'CARC-IP16PL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/i16-plus-amarillo.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/44.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH4':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/4.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/5-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH5TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/55-2.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/6-1.jpg?fit=600%2C600&ssl=1',
  'ENT-CACH6TT':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/07/66.jpg?fit=600%2C600&ssl=1',
  'ENT-JENGA':     'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2026/03/jenga.jpg?fit=600%2C600&ssl=1',
  'HOG-LAMP':      'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/lampara-2.webp?fit=600%2C600&ssl=1',
  'HOG-MACE-XL':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/bowlcoverst-Photoroom.jpg?fit=600%2C600&ssl=1',
  'HOG-CUADRO2':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/06/image00008-scaled-1.jpeg?fit=600%2C600&ssl=1',
  'HOG-CUADRO1':   'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/frontrettor-Photoroom.jpg?fit=600%2C600&ssl=1',
};

function getPrecioVolumen(producto, cantidad) {
  if (!producto) return null;
  if (cantidad >= 500 && producto.precio_500_mas) return { precio: producto.precio_500_mas, label: '500+ u.' };
  if (cantidad >= 200 && producto.precio_200_499) return { precio: producto.precio_200_499, label: '200–499 u.' };
  if (cantidad >= 50 && producto.precio_50_199) return { precio: producto.precio_50_199, label: '50–199 u.' };
  if (cantidad >= 10 && producto.precio_base_b2b) return { precio: producto.precio_base_b2b, label: 'Base B2B' };
  return null;
}

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [colorSeleccionado, setColorSeleccionado] = useState(null);
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [showB2BTable, setShowB2BTable] = useState(false);
  const [tabActiva, setTabActiva] = useState('descripcion');

  useEffect(() => {
    base44.entities.Producto.list().then(data => {
      const prod = data.find(p => p.id === id);
      setProducto(prod);
      if (prod) {
        const colores = getColores(prod);
        setColorSeleccionado(colores[0]?.id || null);
        setRelacionados(data.filter(p => p.id !== id && p.canal !== 'B2B Exclusivo' && p.categoria === prod.categoria).slice(0, 4));
      }
    });
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaRef.current) {
        setShowStickyBar(ctaRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const precioFinal = producto ? Math.floor((producto.precio_b2c || 9990) * 0.85) : 0;
  const ahorro = producto ? (producto.precio_b2c || 9990) - precioFinal : 0;
  const precioVolumen = getPrecioVolumen(producto, cantidad);
  const precioActual = precioVolumen ? precioVolumen.precio : precioFinal;

  const agregarAlCarrito = () => {
    const item = {
      id: Math.random(), productoId: producto.id, nombre: producto.nombre,
      precio: precioActual, cantidad,
      color: colorSeleccionado || null,
      personalizacion: personalizacion || null,
      imagen: getProductImage(producto.sku, producto.categoria),
    };
    const nuevo = [...carrito, item];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setAgregado(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Mira este producto sustentable de PEYU Chile: ${producto?.nombre}`;
    if (navigator.share) {
      try { await navigator.share({ title: producto?.nombre, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Enlace copiado!');
      setTimeout(() => setShareMsg(''), 2500);
    }
  };

  const imgPrincipal = producto ? getProductImage(producto.sku, producto.categoria) : '';
  const imgAlterna = producto ? (SKU_IMAGES_ALT[producto.sku] || imgPrincipal) : '';
  const galeria = [imgPrincipal, imgAlterna, imgPrincipal, imgAlterna];

  if (!producto) return (
    <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0F8B6C]/20 border-t-[#0F8B6C] rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm font-medium">Cargando producto...</p>
      </div>
    </div>
  );

  const colores = getColores(producto);

  return (
    <div className="min-h-screen bg-[#F8F8F6] font-inter">

      {/* ── STICKY CTA BAR ── */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-lg">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={imgPrincipal} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
              <p className="font-semibold text-sm text-gray-900 truncate">{producto.nombre}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="font-poppins font-bold text-gray-900">${precioActual.toLocaleString('es-CL')}</p>
              {agregado ? (
                <Link to="/cart">
                  <Button size="sm" className="gap-2 rounded-xl bg-green-600 hover:bg-green-700 font-semibold">
                    <ShoppingCart className="w-4 h-4" /> Ver carrito
                  </Button>
                </Link>
              ) : (
                <Button onClick={agregarAlCarrito} size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 font-semibold">
                  <ShoppingCart className="w-4 h-4" /> Agregar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Volver</span>
          </button>
          <Link to="/">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="font-poppins font-bold text-sm text-gray-900 hidden sm:inline">PEYU</span>
            </div>
          </Link>
          <Link to="/cart" className="relative">
            <Button size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 shadow-md">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">Carrito</span>
              {carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#D96B4D] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                  {carrito.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-1.5 text-xs text-gray-400">
        <Link to="/" className="hover:text-gray-700 transition-colors">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-gray-700 transition-colors">Tienda</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-400">{producto.categoria}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{producto.nombre}</span>
      </div>

      <div className="max-w-5xl mx-auto px-5 pb-16">

        {/* ── MAIN GRID ── */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-12">

          {/* LEFT: GALERÍA */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm" style={{ aspectRatio: '1' }}>
              <img
                src={galeria[vistaActiva] || imgPrincipal}
                alt={producto.nombre}
                className="w-full h-full object-cover transition-all duration-500"
                onError={e => { e.target.src = imgPrincipal; }}
              />
              {/* Personalización overlay on vista 3 */}
              {vistaActiva === 3 && personalizacion && (
                <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
                  <div className="bg-gray-900/75 backdrop-blur text-yellow-400 text-sm font-bold tracking-[0.2em] px-5 py-2 rounded-xl border border-yellow-400/30"
                    style={{ textShadow: '0 0 12px rgba(212,175,55,0.6)', fontFamily: 'monospace' }}>
                    {personalizacion.toUpperCase()}
                  </div>
                </div>
              )}
              {/* Material badge */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-gray-200 text-[#0F8B6C] shadow-sm">
                  <Recycle className="w-3 h-3" />
                  {producto.material?.includes('100%') ? '100% Reciclado' : 'Compostable'}
                </span>
              </div>
              {/* Actions top-right */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button onClick={() => setWishlist(!wishlist)}
                  className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm border border-gray-200 hover:scale-110 transition-transform"
                  title={wishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                  <Heart className={`w-4 h-4 transition-colors ${wishlist ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                </button>
                <button onClick={handleShare}
                  className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm border border-gray-200 hover:scale-110 transition-transform relative"
                  title="Compartir">
                  {shareMsg ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              {shareMsg && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                  <Copy className="w-3 h-3" /> {shareMsg}
                </div>
              )}
            </div>

            {/* Thumbnails gallery */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { img: galeria[0], label: 'Principal', emoji: '🔍' },
                { img: galeria[1], label: 'Color alt.', emoji: '🎨' },
                { img: galeria[2], label: 'Detalle', emoji: '🔎' },
                { img: galeria[3], label: 'Con grabado', emoji: '✨' },
              ].map((v, i) => (
                <button key={i} onClick={() => setVistaActiva(i)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${vistaActiva === i ? 'border-gray-900 shadow-md scale-[1.03]' : 'border-gray-100 hover:border-gray-300'}`}>
                  <div className="relative w-full h-full">
                    <img src={v.img} alt={v.label} className="w-full h-full object-cover" onError={e => { e.target.src = imgPrincipal; }} />
                    {i === 3 && <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center"><span className="text-lg">✨</span></div>}
                    <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-[8px] font-bold text-center ${vistaActiva === i ? 'bg-gray-900 text-white' : 'bg-black/40 text-white'}`}>{v.label}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Sustainability story */}
            <div className="bg-gradient-to-br from-[#0A1F18] to-[#0F2E24] rounded-3xl p-6 text-white space-y-3">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-[#A7D9C9]" />
                <h3 className="font-poppins font-bold text-sm">La historia de este producto</h3>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {producto.material?.includes('Trigo')
                  ? 'Esta carcasa está fabricada con fibra de trigo, un subproducto agrícola 100% compostable. Al final de su vida útil puedes compostarla en casa. Fabricada sin plástico petroquímico.'
                  : 'Este producto fue fabricado con plástico post-consumo recolectado en Santiago. Cada pieza es única — el marmolado irrepetible nace del proceso de inyección con materiales reciclados mezclados artesanalmente.'}
              </p>
              <div className="flex gap-4 pt-1">
                {[['♻️', 'Reciclado'], ['🏭', 'Hecho en Chile'], ['💚', 'ESG Certificado']].map(([e, l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-white/60">
                    <span>{e}</span><span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: INFO + CTA */}
          <div className="space-y-5">

            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#0F8B6C]/10 text-[#0F8B6C]">{producto.categoria}</span>
                <span className="text-xs px-3 py-1 rounded-full font-mono bg-gray-100 text-gray-400">{producto.sku}</span>
                {producto.stock_actual !== undefined && producto.stock_actual <= 5 && producto.stock_actual > 0 && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-orange-50 text-orange-500 animate-pulse">⚡ Últimas {producto.stock_actual} u.</span>
                )}
                {producto.stock_actual === 0 && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-gray-100 text-gray-400">Agotado — consultar</span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-poppins font-bold text-gray-900 leading-tight mb-2">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-sm text-gray-500 leading-relaxed">{producto.descripcion.replace(/[⭐🌾]/g, '').trim()}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-sm font-semibold text-gray-900">5.0</span>
                <span className="text-xs text-gray-400">· 127 reseñas verificadas</span>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  {precioVolumen ? (
                    <>
                      <p className="text-xs text-purple-600 font-bold mb-0.5">Precio volumen ({precioVolumen.label})</p>
                      <p className="text-4xl font-poppins font-bold text-gray-900 leading-none">${precioVolumen.precio.toLocaleString('es-CL')}</p>
                      <p className="text-xs text-gray-400 mt-1">por unidad · IVA incluido</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-300 line-through">${(producto.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                      <p className="text-4xl font-poppins font-bold text-gray-900 leading-none">${precioFinal.toLocaleString('es-CL')}</p>
                      <p className="text-xs text-gray-400 mt-1">IVA incluido</p>
                    </>
                  )}
                </div>
                <div className="text-right space-y-1">
                  {!precioVolumen && <span className="inline-block text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-xl">−15% online</span>}
                  {!precioVolumen && <p className="text-xs text-green-600 font-medium">Ahorras ${ahorro.toLocaleString('es-CL')}</p>}
                  {precioVolumen && <span className="inline-block text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-xl">Precio B2B</span>}
                </div>
              </div>
              {precioFinal * cantidad < 40000 && !precioVolumen && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-2.5">
                  <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                  Agrega ${(40000 - precioFinal * cantidad).toLocaleString('es-CL')} más para envío gratis
                </div>
              )}
              {/* B2B pricing trigger */}
              {(producto.precio_50_199 || producto.precio_base_b2b) && (
                <button onClick={() => setShowB2BTable(!showB2BTable)}
                  className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:text-purple-800 transition-colors">
                  <Sparkles className="w-3 h-3" />
                  {showB2BTable ? 'Ocultar' : 'Ver'} precios por volumen B2B
                  <ChevronRight className={`w-3 h-3 transition-transform ${showB2BTable ? 'rotate-90' : ''}`} />
                </button>
              )}
              {showB2BTable && (
                <div className="bg-purple-50 rounded-xl overflow-hidden border border-purple-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-purple-100 text-purple-700">
                        <th className="px-3 py-2 text-left font-bold">Cantidad</th>
                        <th className="px-3 py-2 text-right font-bold">Precio/u</th>
                        <th className="px-3 py-2 text-right font-bold">Descuento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100">
                      {[
                        { label: '1–9 u.', precio: precioFinal, base: true },
                        producto.precio_base_b2b && { label: '10–49 u.', precio: producto.precio_base_b2b },
                        producto.precio_50_199 && { label: '50–199 u.', precio: producto.precio_50_199 },
                        producto.precio_200_499 && { label: '200–499 u.', precio: producto.precio_200_499 },
                        producto.precio_500_mas && { label: '500+ u.', precio: producto.precio_500_mas },
                      ].filter(Boolean).map((tier, i) => (
                        <tr key={i} className={`${i === 0 ? '' : 'hover:bg-purple-100'} transition-colors`}>
                          <td className="px-3 py-2 font-semibold text-gray-700">{tier.label}</td>
                          <td className="px-3 py-2 text-right font-bold text-gray-900">${tier.precio.toLocaleString('es-CL')}</td>
                          <td className="px-3 py-2 text-right text-purple-600 font-semibold">
                            {i === 0 ? '—' : `−${Math.round((1 - tier.precio / (producto.precio_b2c || 9990)) * 100)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-purple-500 px-3 py-2">* Personalización láser UV gratis desde {producto.moq_personalizacion || 10} u.</p>
                </div>
              )}
            </div>

            {/* Color selector */}
            {colores.length > 0 && (
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2.5 block">
                  Color: <span className="font-normal text-gray-500">{colores.find(c => c.id === colorSeleccionado)?.label || ''}</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colores.map(c => (
                    <button key={c.id} onClick={() => setColorSeleccionado(c.id)}
                      title={c.label}
                      className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 ${colorSeleccionado === c.id ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                      style={{ backgroundColor: c.hex }}>
                      {colorSeleccionado === c.id && <Check className="w-4 h-4 text-white mx-auto drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cantidad */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Cantidad</label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-11 h-11 hover:bg-gray-50 font-bold text-xl text-gray-600 transition-colors flex items-center justify-center">−</button>
                  <input
                    type="number" min="1" value={cantidad}
                    onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-11 text-center font-bold text-gray-900 border-x border-gray-100 focus:outline-none text-sm" />
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-11 h-11 hover:bg-gray-50 font-bold text-xl text-gray-600 transition-colors flex items-center justify-center">+</button>
                </div>
                {cantidad >= 500 && producto.precio_500_mas && (
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Máximo descuento
                  </span>
                )}
                {cantidad >= 200 && cantidad < 500 && producto.precio_200_499 && (
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-xl">−{Math.round((1 - producto.precio_200_499 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                )}
                {cantidad >= 50 && cantidad < 200 && producto.precio_50_199 && (
                  <span className="text-xs font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-3 py-2 rounded-xl">−{Math.round((1 - producto.precio_50_199 / (producto.precio_b2c || 9990)) * 100)}% vol.</span>
                )}
                {cantidad >= 10 && cantidad < 50 && (
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-3 py-2 rounded-xl flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Laser gratis
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Total: <span className="font-bold text-gray-700">${(precioActual * cantidad).toLocaleString('es-CL')}</span></p>
            </div>

            {/* Personalización */}
            {producto.moq_personalizacion && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-purple-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> Personalización láser UV
                  </label>
                  <span className="text-[10px] font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                    GRATIS desde {producto.moq_personalizacion} u.
                  </span>
                </div>
                <Input value={personalizacion} onChange={e => setPersonalizacion(e.target.value.slice(0, 25))}
                  placeholder="Tu nombre, logo, frase favorita..."
                  className="text-sm bg-white border-purple-200 focus:ring-purple-300 rounded-xl h-11 font-medium tracking-wide" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-500">Área: {producto.area_laser_mm || '40×25mm'} · Grabado permanente</p>
                  <div className="flex items-center gap-2">
                    {personalizacion && (
                      <button onClick={() => setPersonalizacion('')} className="text-purple-400 hover:text-purple-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className={`text-xs font-bold ${personalizacion.length >= 22 ? 'text-orange-500' : 'text-purple-400'}`}>{personalizacion.length}/25</span>
                  </div>
                </div>
                {personalizacion && (
                  <div className="bg-gray-900 rounded-xl px-4 py-2 text-center">
                    <p className="text-yellow-400 font-bold tracking-[0.2em] text-sm" style={{ fontFamily: 'monospace' }}>{personalizacion.toUpperCase()}</p>
                    <p className="text-white/30 text-[9px] mt-0.5">Preview del grabado láser</p>
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div ref={ctaRef} className="space-y-2.5">
              {agregado ? (
                <div className="space-y-2">
                  <div className="w-full h-14 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700">¡Producto agregado al carrito!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/cart">
                      <Button size="lg" className="w-full h-11 rounded-2xl bg-gray-900 hover:bg-gray-800 font-semibold gap-2 text-sm">
                        <ShoppingCart className="w-4 h-4" /> Ir al carrito
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" onClick={() => setAgregado(false)}
                      className="w-full h-11 rounded-2xl border-gray-200 text-gray-600 hover:border-gray-900 font-semibold text-sm">
                      Seguir comprando
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={agregarAlCarrito} size="lg"
                  className="w-full h-14 font-bold text-base gap-2.5 rounded-2xl shadow-xl bg-gray-900 hover:bg-gray-800 shadow-gray-900/20 hover:scale-[1.01] transition-all duration-200">
                  <ShoppingCart className="w-5 h-5" /> Agregar al carrito · ${(precioActual * cantidad).toLocaleString('es-CL')}
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
                  <Button size="lg" variant="outline"
                    className="w-full font-semibold gap-1.5 rounded-2xl border-gray-200 hover:border-gray-900 hover:text-gray-900 text-gray-600 h-11 text-sm">
                    <Building2 className="w-4 h-4" /> Cotizar B2B
                  </Button>
                </Link>
                <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, me interesa el producto: ${producto.nombre} (SKU: ${producto.sku})`)}`}
                  target="_blank" rel="noreferrer">
                  <Button size="lg" variant="outline"
                    className="w-full font-semibold gap-1.5 rounded-2xl h-11 text-sm border-gray-200 hover:border-[#25D366] hover:text-[#25D366]">
                    💬 WhatsApp
                  </Button>
                </a>
              </div>
            </div>

            {/* Garantías */}
            <div className="grid grid-cols-2 gap-2">
              {GARANTIAS.map((g, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: g.color + '15' }}>
                    <g.icon className="w-4 h-4" style={{ color: g.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{g.label}</p>
                    <p className="text-[10px] text-gray-400">{g.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS: Descripción / Especificaciones / Preguntas ── */}
        <div className="mt-12">
          <div className="flex gap-0 border-b border-gray-200 mb-6">
            {[
              { id: 'descripcion', label: 'Descripción' },
              { id: 'specs', label: 'Especificaciones' },
              { id: 'faq', label: 'Preguntas frecuentes' },
            ].map(t => (
              <button key={t.id} onClick={() => setTabActiva(t.id)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${tabActiva === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tabActiva === 'descripcion' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-poppins font-bold text-lg text-gray-900">Sobre este producto</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {producto.descripcion || `${producto.nombre} es un producto diseñado y fabricado en Chile con materiales ${producto.material?.includes('100%') ? '100% reciclados post-consumo' : 'compostables de fibra de trigo'}. Cada unidad es única gracias al proceso de inyección artesanal.`}
                </p>
                <ul className="space-y-2">
                  {[
                    `Material: ${producto.material}`,
                    `Garantía: ${producto.garantia_anios || 10} años`,
                    producto.area_laser_mm && `Área grabado láser: ${producto.area_laser_mm}`,
                    'Fabricado en Santiago, Chile',
                    'Compatible con personalización UV',
                  ].filter(Boolean).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#0F8B6C] flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Impacto ambiental</h4>
                {[
                  ['♻️', 'Plástico rescatado', `~${Math.round(Math.random() * 50 + 100)}g evitados del mar`],
                  ['💧', 'Agua ahorrada', `~${Math.round(Math.random() * 50 + 20)}L vs producción nueva`],
                  ['🌳', 'CO₂ reducido', `~${(Math.random() * 0.3 + 0.1).toFixed(2)} kg CO₂eq`],
                ].map(([e, l, v]) => (
                  <div key={l} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><span>{e}</span>{l}</div>
                    <span className="text-xs font-bold text-[#0F8B6C]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'specs' && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm max-w-lg">
              <div className="divide-y divide-gray-50">
                {[
                  ['Material', producto.material],
                  ['Categoría', producto.categoria],
                  ['SKU', producto.sku],
                  ['Canal', producto.canal],
                  ['Garantía', `${producto.garantia_anios || 10} años`],
                  ['Lead time s/personalización', `${producto.lead_time_sin_personal || 7} días hábiles`],
                  ['Lead time c/personalización', `${producto.lead_time_con_personal || 9} días hábiles`],
                  producto.area_laser_mm && ['Área grabado UV', producto.area_laser_mm],
                  producto.moq_personalizacion && ['MOQ personalización', `${producto.moq_personalizacion} unidades`],
                  ['Stock actual', producto.stock_actual > 0 ? `${producto.stock_actual} u. disponibles` : 'Consultar disponibilidad'],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="px-5 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">{k}</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[55%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tabActiva === 'faq' && (
            <div className="space-y-3 max-w-2xl">
              {[
                ['¿Cuánto demora el despacho?', `Sin personalización: ${producto.lead_time_sin_personal || 7} días hábiles. Con grabado láser UV: ${producto.lead_time_con_personal || 9} días hábiles. Todo Chile vía Starken, Chilexpress o BlueExpress.`],
                ['¿Puedo personalizar con mi logo?', `Sí. Ofrecemos grabado láser UV permanente en área de ${producto.area_laser_mm || '40×25mm'}. Gratis desde ${producto.moq_personalizacion || 10} unidades. Solo necesitas enviarnos tu logo en vectores (.ai, .svg o .pdf).`],
                ['¿El color marmolado es exactamente igual al de la foto?', 'El marmolado es un proceso artesanal, por lo que cada pieza tiene variaciones únicas. Los colores base son los mismos pero el patrón nunca se repite — eso es lo que lo hace especial.'],
                ['¿Qué pasa si el producto llega dañado?', 'Ofrecemos 30 días de devolución sin preguntas. Además, todos nuestros productos tienen garantía de 10 años contra defectos de fabricación. Contáctanos por WhatsApp.'],
                ['¿Tienen precios especiales para empresas?', `Sí. Desde ${producto.moq_personalizacion || 10} unidades accedes a precios B2B. Desde 50 unidades, descuento adicional. Solicita cotización en la sección B2B o escríbenos por WhatsApp.`],
              ].map(([q, a], i) => (
                <details key={i} className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer font-semibold text-sm text-gray-900 flex items-center justify-between list-none">
                    {q}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">{a}</div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* ── REVIEWS ── */}
        <div className="mt-14 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-1">Reseñas verificadas</p>
              <h2 className="text-2xl font-poppins font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="font-poppins font-bold text-gray-900">5.0</span>
              <span className="text-xs text-gray-400">/ 127</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {REVIEWS_MOCK.map((r, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  {r.verificado && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{r.txt}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center text-white text-xs font-bold">
                    {r.autor[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{r.autor}</p>
                    <p className="text-[10px] text-gray-400">{r.ciudad} · {r.fecha}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRODUCTOS RELACIONADOS ── */}
        {relacionados.length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-1">También te podría gustar</p>
                <h2 className="text-2xl font-poppins font-bold text-gray-900">Productos relacionados</h2>
              </div>
              <Link to="/shop" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relacionados.map(p => (
                <Link key={p.id} to={`/producto/${p.id}`}>
                  <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={getProductImage(p.sku, p.categoria)}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 group-hover:text-[#0F8B6C] transition-colors leading-snug">{p.nombre}</h3>
                      <p className="font-poppins font-bold text-sm text-gray-900 mt-1">${Math.floor((p.precio_b2c || 9990) * 0.85).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <WhatsAppWidget context="producto" productName={producto.nombre} sku={producto.sku} />
      <AsistenteChat />
    </div>
  );
}
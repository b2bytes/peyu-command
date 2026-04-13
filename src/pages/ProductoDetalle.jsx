import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductImage } from '@/utils/productImages';
import {
  ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap,
  Star, Recycle, Sparkles, ChevronRight, Heart, Share2,
  RotateCcw, BadgeCheck
} from 'lucide-react';

const EMOJI_MAP = { 'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱' };
const VIEWS = ['Vista Frontal', 'Vista Lateral', 'Vista Superior', 'Con Grabado'];

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

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ctaRef = useRef(null);
  const [producto, setProducto] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);
  const [vistaActiva, setVistaActiva] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [wishlist, setWishlist] = useState(false);

  useEffect(() => {
    base44.entities.Producto.list().then(data => {
      const prod = data.find(p => p.id === id);
      setProducto(prod);
      if (prod) setRelacionados(data.filter(p => p.id !== id && p.categoria === prod.categoria).slice(0, 3));
    });
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (ctaRef.current) {
        const rect = ctaRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const agregarAlCarrito = () => {
    const item = {
      id: Math.random(), productoId: producto.id, nombre: producto.nombre,
      precio: Math.floor((producto.precio_b2c || 9990) * 0.85), cantidad,
      personalizacion: personalizacion || null,
    };
    const nuevo = [...carrito, item];
    setCarrito(nuevo);
    localStorage.setItem('carrito', JSON.stringify(nuevo));
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2500);
  };

  if (!producto) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0F8B6C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm font-medium">Cargando producto...</p>
      </div>
    </div>
  );

  const precioFinal = Math.floor((producto.precio_b2c || 9990) * 0.85);
  const ahorro = (producto.precio_b2c || 9990) - precioFinal;

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── STICKY CTA BAR ── */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${showStickyBar ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="bg-white/95 backdrop-blur-xl border-b border-black/5 shadow-lg">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-2xl flex-shrink-0">{EMOJI_MAP[producto.categoria] || '📦'}</div>
              <p className="font-semibold text-sm text-gray-900 truncate">{producto.nombre}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="font-poppins font-bold text-gray-900">${precioFinal.toLocaleString('es-CL')}</p>
              <Button onClick={agregarAlCarrito} size="sm"
                className={`gap-2 rounded-xl font-semibold transition-all ${agregado ? 'bg-green-600 hover:bg-green-600' : 'bg-gray-900 hover:bg-gray-800'}`}>
                {agregado ? <><Check className="w-4 h-4" /> Agregado</> : <><ShoppingCart className="w-4 h-4" /> Agregar</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
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
        <Link to="/shop" className="hover:text-gray-700 transition-colors">Tienda</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-400">{producto.categoria}</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium">{producto.nombre}</span>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-5 pb-16">

        {/* ── MAIN GRID ── */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-14">

          {/* LEFT: GALERÍA */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm group" style={{ aspectRatio: '4/3' }}>
              <img
                src={getProductImage(producto.sku, producto.categoria)}
                alt={producto.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={e => { e.target.style.display = 'none'; }}
              />
              {vistaActiva === 3 && personalizacion && (
                <div className="absolute inset-0 flex items-end justify-center pb-8">
                  <div className="bg-gray-900/80 backdrop-blur text-yellow-400 text-sm font-bold tracking-widest px-5 py-2 rounded-xl border border-yellow-400/30"
                    style={{ textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
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
              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button onClick={() => setWishlist(!wishlist)}
                  className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm border border-gray-200 hover:scale-110 transition-transform">
                  <Heart className={`w-4 h-4 ${wishlist ? 'fill-red-400 text-red-400' : 'text-gray-400'}`} />
                </button>
                <button className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm border border-gray-200 hover:scale-110 transition-transform">
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-2">
              {VIEWS.map((v, i) => (
                <button key={i} onClick={() => setVistaActiva(i)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-medium border-2 transition-all ${vistaActiva === i ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'}`}>
                  <span className="text-xl">{['🔍', '↔️', '⬆️', '✨'][i]}</span>
                  <span className="text-[9px] leading-tight text-center px-1">{v}</span>
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
                Este producto fue fabricado con plástico post-consumo recolectado en Santiago. Cada pieza es única — el marmolado irrepetible nace del proceso de inyección con materiales reciclados mezclados artesanalmente.
              </p>
              <div className="flex gap-3 pt-1">
                {[['♻️', 'Reciclado'], ['🏭', 'Local'], ['💚', 'ESG']].map(([e, l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-white/60">
                    <span>{e}</span><span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: INFO + CTA */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#0F8B6C]/10 text-[#0F8B6C]">{producto.categoria}</span>
                <span className="text-xs px-3 py-1 rounded-full font-mono bg-gray-100 text-gray-400">{producto.sku}</span>
                {producto.stock_actual !== undefined && producto.stock_actual <= 5 && (
                  <span className="text-xs px-3 py-1 rounded-full font-bold bg-orange-50 text-orange-500">⚡ Últimas {producto.stock_actual} u.</span>
                )}
              </div>
              <h1 className="text-3xl font-poppins font-bold text-gray-900 leading-tight mb-2">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-sm text-gray-500 leading-relaxed">{producto.descripcion}</p>
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
                  <p className="text-sm text-gray-300 line-through">${(producto.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                  <p className="text-4xl font-poppins font-bold text-gray-900 leading-none">${precioFinal.toLocaleString('es-CL')}</p>
                  <p className="text-xs text-gray-400 mt-1">IVA incluido</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-xl">−15% online</span>
                  <p className="text-xs text-green-600 font-medium">Ahorras ${ahorro.toLocaleString('es-CL')}</p>
                </div>
              </div>
              {precioFinal * cantidad < 40000 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-2.5">
                  <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                  Agrega ${(40000 - precioFinal).toLocaleString('es-CL')} más para envío gratis
                </div>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Cantidad</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="w-12 h-12 hover:bg-gray-50 font-bold text-xl text-gray-600 transition-colors flex items-center justify-center">−</button>
                  <span className="text-lg font-bold w-12 text-center text-gray-900">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)}
                    className="w-12 h-12 hover:bg-gray-50 font-bold text-xl text-gray-600 transition-colors flex items-center justify-center">+</button>
                </div>
                {cantidad >= 10 && (
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-xl flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Laser gratis
                  </span>
                )}
                {cantidad >= 50 && (
                  <span className="text-xs font-bold text-[#0F8B6C] bg-[#0F8B6C]/10 px-3 py-2 rounded-xl">−8% B2B</span>
                )}
              </div>
            </div>

            {/* Personalización */}
            {producto.moq_personalizacion && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-purple-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" /> Personalización láser UV
                  </label>
                  <span className="text-[10px] font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">GRATIS desde {producto.moq_personalizacion} u.</span>
                </div>
                <Input value={personalizacion} onChange={e => setPersonalizacion(e.target.value.slice(0, 25))}
                  placeholder="Tu nombre, logo, frase favorita..."
                  className="text-sm bg-white border-purple-200 focus:ring-purple-300 rounded-xl h-11 font-medium tracking-wide" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-purple-500">Área: {producto.area_laser_mm || '40×25mm'} · Permanente</p>
                  <span className="text-xs text-purple-400">{personalizacion.length}/25</span>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div ref={ctaRef} className="space-y-3">
              <Button onClick={agregarAlCarrito} size="lg"
                className={`w-full h-14 font-bold text-base gap-2.5 rounded-2xl shadow-xl transition-all duration-300 ${agregado ? 'bg-green-600 hover:bg-green-600 shadow-green-600/20 scale-[0.99]' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20 hover:scale-[1.01]'}`}>
                {agregado ? (
                  <><Check className="w-5 h-5" /> ¡Agregado al carrito! · ${(precioFinal * cantidad).toLocaleString('es-CL')}</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Agregar al carrito · ${(precioFinal * cantidad).toLocaleString('es-CL')}</>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
                  <Button size="lg" variant="outline"
                    className="w-full font-semibold gap-1.5 rounded-2xl border-gray-200 hover:border-gray-900 hover:text-gray-900 text-gray-600 h-11 text-sm">
                    <Building2 className="w-4 h-4" /> Cotizar B2B
                  </Button>
                </Link>
                <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
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
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: g.color + '12' }}>
                    <g.icon className="w-4 h-4" style={{ color: g.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{g.label}</p>
                    <p className="text-[10px] text-gray-400">{g.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Specs */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="font-bold text-sm text-gray-900">Especificaciones</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  ['Material', producto.material || '100% Plástico Reciclado'],
                  ['Garantía', `${producto.garantia_anios || 10} años`],
                  ['Lead Time', `${producto.lead_time_sin_personal || 7} días hábiles`],
                  producto.area_laser_mm && ['Área láser UV', producto.area_laser_mm],
                  ['SKU', producto.sku],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── REVIEWS ── */}
        <div className="mt-16 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-1">Reseñas</p>
              <h2 className="text-2xl font-poppins font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="font-poppins font-bold text-gray-900">5.0</span>
              <span className="text-xs text-gray-400">/ 127 reseñas</span>
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
          <div className="mt-16 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-1">También te podría gustar</p>
                <h2 className="text-2xl font-poppins font-bold text-gray-900">Productos relacionados</h2>
              </div>
              <Link to="/shop" className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {relacionados.map(p => (
                <Link key={p.id} to={`/producto/${p.id}`}>
                  <div className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-36 overflow-hidden">
                      <img
                        src={getProductImage(p.sku, p.categoria)}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                      <p className="font-poppins font-bold text-base text-gray-900 mt-1">${Math.floor((p.precio_b2c || 9990) * 0.85).toLocaleString('es-CL')}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
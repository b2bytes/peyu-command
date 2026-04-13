import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap, Star, Recycle, Sparkles } from 'lucide-react';

const EMOJI_MAP = { 'Escritorio': '🖥️', 'Hogar': '🌱', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱' };

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    base44.entities.Producto.list().then(data => {
      setProducto(data.find(p => p.id === id));
    });
  }, [id]);

  const agregarAlCarrito = () => {
    const item = {
      id: Math.random(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Math.floor((producto.precio_b2c || 9990) * 0.85),
      cantidad,
      personalizacion: personalizacion || null,
    };
    const nuevoCarrito = [...carrito, item];
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2500);
  };

  if (!producto) return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0F8B6C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Cargando producto...</p>
      </div>
    </div>
  );

  const precioFinal = Math.floor((producto.precio_b2c || 9990) * 0.85);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Volver</span>
          </button>

          <Link to="/">
            <div className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="font-poppins font-bold text-sm text-gray-900">PEYU</span>
            </div>
          </Link>

          <Link to="/cart" className="relative">
            <Button size="sm" className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md">
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
      <div className="max-w-5xl mx-auto px-5 py-3 text-xs text-gray-400 flex items-center gap-1.5">
        <Link to="/shop" className="hover:text-gray-700 transition-colors">Tienda</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{producto.nombre}</span>
      </div>

      <div className="max-w-5xl mx-auto px-5 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

          {/* ── IMAGEN ─────────────────────── */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl h-96 flex items-center justify-center shadow-sm overflow-hidden relative group">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0F8B6C]/10 via-[#A7D9C9]/15 to-[#E7D8C6]/20" />
              <div className="relative text-center">
                <div className="text-9xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  {EMOJI_MAP[producto.categoria] || '📦'}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-gray-200 text-[#0F8B6C]">
                  <Recycle className="w-3.5 h-3.5" />
                  {producto.material?.includes('100%') ? '100% Plástico Reciclado' : 'Fibra de Trigo Compostable'}
                </span>
              </div>
            </div>

            {/* Mini specs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: `Garantía ${producto.garantia_anios || 10} años`, color: '#0F8B6C', bg: '#0F8B6C12' },
                { icon: Truck, label: `${producto.lead_time_sin_personal || 7} días hábiles`, color: '#4B4F54', bg: '#4B4F5412' },
                { icon: Zap, label: 'Láser UV gratis', color: '#D96B4D', bg: '#D96B4D12' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: s.bg }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── DETALLES ───────────────────── */}
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs px-3 py-1 rounded-full font-semibold bg-[#0F8B6C]/10 text-[#0F8B6C]">{producto.categoria}</span>
                <span className="text-xs px-3 py-1 rounded-full font-mono bg-gray-100 text-gray-500">{producto.sku}</span>
              </div>
              <h1 className="text-3xl font-poppins font-bold text-gray-900 leading-tight mb-2">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-sm text-gray-500 leading-relaxed">{producto.descripcion}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <span className="text-xs text-gray-400">(127 reseñas)</span>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-end gap-3 mb-2">
                <div>
                  <p className="text-sm text-gray-300 line-through">${producto.precio_b2c?.toLocaleString('es-CL')}</p>
                  <p className="text-4xl font-poppins font-bold text-gray-900">${precioFinal?.toLocaleString('es-CL')}</p>
                </div>
                <span className="mb-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-xl">−15% online</span>
              </div>
              {producto.stock_actual !== undefined && producto.stock_actual <= 5 && (
                <p className="text-xs text-orange-500 font-semibold">⚡ Solo {producto.stock_actual} unidades disponibles</p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Cantidad</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-11 h-11 hover:bg-gray-50 font-bold text-lg text-gray-600 transition-colors">−</button>
                  <span className="text-lg font-bold w-10 text-center text-gray-900">{cantidad}</span>
                  <button onClick={() => setCantidad(cantidad + 1)} className="w-11 h-11 hover:bg-gray-50 font-bold text-lg text-gray-600 transition-colors">+</button>
                </div>
                {cantidad >= 10 && (
                  <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-3 py-1.5 rounded-xl">✨ Laser gratis</span>
                )}
              </div>
            </div>

            {/* Personalización */}
            {producto.moq_personalizacion && (
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl space-y-2">
                <label className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> ¿Quieres personalizarlo?
                </label>
                <Input
                  placeholder="Ej: Mi Nombre, Logo, Mensaje favorito..."
                  value={personalizacion}
                  onChange={(e) => setPersonalizacion(e.target.value)}
                  className="text-sm bg-white border-purple-200 focus:ring-purple-200"
                />
                <p className="text-xs text-purple-500">Láser UV gratis desde {producto.moq_personalizacion} u · Área: {producto.area_laser_mm || '40×25mm'}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                onClick={agregarAlCarrito}
                size="lg"
                className={`w-full font-semibold gap-2 h-13 rounded-2xl text-base shadow-lg transition-all ${
                  agregado ? 'bg-green-600 hover:bg-green-600 shadow-green-600/20' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20'
                }`}
              >
                {agregado ? (
                  <><Check className="w-5 h-5" /> ¡Agregado al carrito!</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Agregar al carrito · ${(precioFinal * cantidad).toLocaleString('es-CL')}</>
                )}
              </Button>

              <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
                <Button size="lg" variant="outline" className="w-full font-semibold gap-2 rounded-2xl border-gray-200 hover:border-gray-900 hover:text-gray-900 text-gray-600 h-11">
                  <Building2 className="w-5 h-5" /> Cotizar en volumen (B2B)
                </Button>
              </Link>

              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button size="lg" variant="ghost" className="w-full gap-2 text-sm text-gray-400 hover:text-gray-700 rounded-2xl">
                  💬 Preguntar por WhatsApp
                </Button>
              </a>
            </div>

            {/* Info rápida */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              {[
                { icon: Shield, text: `Garantía ${producto.garantia_anios || 10} años` },
                { icon: Truck, text: 'Envío a todo Chile · Gratis sobre $40.000' },
                { icon: Recycle, text: producto.material },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
                  <r.icon className="w-4 h-4 text-[#0F8B6C] flex-shrink-0" />
                  {r.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
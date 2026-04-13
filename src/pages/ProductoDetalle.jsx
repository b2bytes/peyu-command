import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Building2, ShoppingCart, Shield, Truck, Zap, Star, Recycle } from 'lucide-react';

const EMOJI_MAP = { 'Escritorio': '🖥️', 'Hogar': '🏠', 'Entretenimiento': '🎲', 'Corporativo': '🎁', 'Carcasas B2C': '📱' };

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [personalizacion, setPersonalizacion] = useState('');
  const [carrito, setCarrito] = useState(JSON.parse(localStorage.getItem('carrito') || '[]'));
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const data = await base44.entities.Producto.list();
      const prod = data.find(p => p.id === id);
      setProducto(prod);
    };
    cargar();
  }, [id]);

  const agregarAlCarrito = () => {
    const item = {
      id: Math.random(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: Math.floor(producto.precio_b2c * 0.85),
      cantidad,
      personalizacion: personalizacion || null,
    };
    const nuevoCarrito = [...carrito, item];
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
  };

  if (!producto) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-[#0F8B6C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Cargando producto...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Navbar */}
      <div className="bg-white/95 backdrop-blur border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>
          <Link to="/">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0F8B6C] flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="font-poppins font-bold text-sm" style={{ color: '#0F8B6C' }}>PEYU</span>
            </div>
          </Link>
          <Link to="/cart" className="relative">
            <Button size="sm" variant="outline" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Carrito
            </Button>
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-3 text-xs text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">Tienda</Link>
        <span className="mx-1.5">›</span>
        <span className="text-foreground">{producto.nombre}</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Imagen */}
          <div className="space-y-3">
            <div className="bg-white border border-border rounded-2xl h-96 flex items-center justify-center shadow-sm">
              <div className="text-center">
                <div className="text-8xl mb-4">{EMOJI_MAP[producto.categoria] || '📦'}</div>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#0F8B6C15', color: '#0F8B6C' }}>
                  <Recycle className="w-3 h-3" />
                  {producto.material?.includes('100%') ? '100% Plástico Reciclado' : 'Fibra de Trigo Compostable'}
                </span>
              </div>
            </div>
            {/* Mini specs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: `Garantía ${producto.garantia_anios || 10} años`, color: '#0F8B6C' },
                { icon: Truck, label: `${producto.lead_time_sin_personal || 7} días hábiles`, color: '#4B4F54' },
                { icon: Zap, label: 'Láser UV gratis', color: '#D96B4D' },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-border rounded-xl p-3 text-center shadow-sm">
                  <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                  <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-5">
            <div>
              <div className="flex gap-2 mb-2">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: '#0F8B6C15', color: '#0F8B6C' }}>
                  {producto.categoria}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {producto.sku}
                </span>
              </div>
              <h1 className="text-2xl font-poppins font-bold mb-2">{producto.nombre}</h1>
              {producto.descripcion && (
                <p className="text-sm text-muted-foreground leading-relaxed">{producto.descripcion}</p>
              )}
              <div className="flex gap-0.5 mt-2">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                <span className="text-xs text-muted-foreground ml-1">(127 reseñas)</span>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-sm text-muted-foreground line-through">${producto.precio_b2c?.toLocaleString('es-CL')}</p>
                  <p className="text-3xl font-poppins font-bold" style={{ color: '#0F8B6C' }}>
                    ${Math.floor(producto.precio_b2c * 0.85)?.toLocaleString('es-CL')}
                  </p>
                </div>
                <span className="mb-1 text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">−15% online</span>
              </div>
              {producto.stock_actual !== undefined && producto.stock_actual <= 5 && (
                <p className="text-xs text-orange-500 mt-2 font-medium">⚡ Solo {producto.stock_actual} unidades disponibles</p>
              )}
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Cantidad</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-10 h-10 rounded-xl border border-border hover:bg-muted font-bold text-lg">−</button>
                <span className="text-lg font-semibold w-8 text-center">{cantidad}</span>
                <button onClick={() => setCantidad(cantidad + 1)} className="w-10 h-10 rounded-xl border border-border hover:bg-muted font-bold text-lg">+</button>
                {cantidad >= 10 && (
                  <span className="text-xs text-blue-600 font-medium">✨ Personalización láser gratis</span>
                )}
              </div>
            </div>

            {/* Personalización */}
            {producto.moq_personalizacion && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <label className="text-sm font-semibold">✨ ¿Quieres personalizarlo?</label>
                <Input
                  placeholder="Ej: Mi Nombre, Logo, Mensaje favorito..."
                  value={personalizacion}
                  onChange={(e) => setPersonalizacion(e.target.value)}
                  className="text-sm bg-white"
                />
                <p className="text-xs text-muted-foreground">Láser UV gratis desde {producto.moq_personalizacion} u · Área: {producto.area_laser_mm || '40×25mm'}</p>
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-3">
              <Button
                onClick={agregarAlCarrito}
                size="lg"
                className="w-full font-semibold gap-2"
                style={{ backgroundColor: agregado ? '#0a6b52' : '#0F8B6C' }}
              >
                {agregado ? (
                  <><Check className="w-4 h-4" /> ¡Agregado al carrito!</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Agregar al carrito · ${(Math.floor(producto.precio_b2c * 0.85) * cantidad).toLocaleString('es-CL')}</>
                )}
              </Button>

              <Link to={`/b2b/contacto?productoId=${producto.id}&nombre=${encodeURIComponent(producto.nombre || '')}`}>
                <Button size="lg" variant="outline" className="w-full font-semibold gap-2" style={{ borderColor: '#006D5B', color: '#006D5B' }}>
                  <Building2 className="w-4 h-4" />
                  Cotizar en volumen (B2B)
                </Button>
              </Link>

              <a href="https://wa.me/56935040242" target="_blank" rel="noreferrer">
                <Button size="lg" variant="ghost" className="w-full gap-2 text-sm text-muted-foreground">
                  💬 Preguntar por WhatsApp
                </Button>
              </a>
            </div>

            {/* Info rápida */}
            <div className="text-sm text-muted-foreground space-y-1.5 border-t border-border pt-4">
              <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#0F8B6C]" /> Garantía {producto.garantia_anios || 10} años</p>
              <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#0F8B6C]" /> Envío a todo Chile · Gratis sobre $40.000</p>
              <p className="flex items-center gap-2"><Recycle className="w-4 h-4 text-[#0F8B6C]" /> {producto.material}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Building2, Recycle, Star, Zap, Shield, ArrowRight, MapPin } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const CLIENTES = ['Adidas', 'Nestlé', 'BancoEstado', 'Cachantún', 'Luchetti', 'DUOC UC', 'UAI'];

export default function ShopLanding() {
  const [productosDestacados, setProductosDestacados] = useState([]);
  const [loading, setLoading] = useState(true);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductosDestacados(data.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter">

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center gap-3 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full bg-[#0F8B6C] flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-poppins font-bold leading-none" style={{ color: '#0F8B6C' }}>PEYU</h1>
                <p className="text-xs text-muted-foreground leading-none">Plástico que renace</p>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/b2b/catalogo">
              <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex text-sm">
                <Building2 className="w-4 h-4" /> B2B
              </Button>
            </Link>
            <Link to="/cart" className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Carrito</span>
                {carrito.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {carrito.length}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0B0F12] via-[#0F2420] to-[#0B6B48] text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#0F8B6C] blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#A7D9C9] blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <Recycle className="w-3.5 h-3.5" />
              Fabricado en Chile · 100% Plástico Reciclado
            </div>
            <h2 className="text-4xl md:text-6xl font-poppins font-bold leading-tight mb-4">
              Plástico<br />
              <span style={{ color: '#A7D9C9' }}>que renace.</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg">
              Productos de diseño durables y personalizables hechos con plástico 100% reciclado. Diseño con propósito, hecho en Chile.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="gap-2 font-semibold bg-white text-[#0B6B48] hover:bg-white/90">
                  <ShoppingCart className="w-5 h-5" />
                  Comprar ahora — ayuda al océano
                </Button>
              </Link>
              <Link to="/b2b/contacto">
                <Button size="lg" variant="outline" className="gap-2 border-white/40 text-white hover:bg-white/10">
                  <Building2 className="w-5 h-5" />
                  Cotizar B2B
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALOR PROPOSICIÓN ────────────────────────────────────── */}
      <div className="bg-[#F7F7F5] py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Recycle, label: '100% Reciclado', desc: 'Plástico post-consumo recuperado', color: '#0F8B6C' },
            { icon: Shield, label: 'Garantía 10 años', desc: 'En todos los productos de plástico', color: '#0F8B6C' },
            { icon: Zap, label: 'Láser UV gratis', desc: 'Desde 10 unidades con logo', color: '#D96B4D' },
            { icon: MapPin, label: 'Hecho en Chile', desc: '6 inyectoras automáticas en Santiago', color: '#4B4F54' },
          ].map((v, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: v.color + '15' }}>
                <v.icon className="w-5 h-5" style={{ color: v.color }} />
              </div>
              <p className="font-semibold text-sm">{v.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCTOS DESTACADOS ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="text-2xl font-poppins font-bold">Productos Destacados</h3>
            <p className="text-muted-foreground mt-1">Los más vendidos — plástico reciclado de alta calidad</p>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: '#0F8B6C' }}>
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {productosDestacados.map(p => (
              <Link key={p.id} to={`/producto/${p.id}`}>
                <div className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="bg-gradient-to-br from-[#0F8B6C]/20 to-[#A7D9C9]/30 h-44 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-1">📦</div>
                      <p className="text-xs font-medium text-[#0F8B6C] px-2 text-center leading-tight">{p.nombre}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-sm leading-tight mb-1">{p.nombre}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{p.categoria}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground line-through">${p.precio_b2c?.toLocaleString('es-CL')}</p>
                        <p className="font-poppins font-bold text-base" style={{ color: '#0F8B6C' }}>
                          ${Math.floor(p.precio_b2c * 0.85)?.toLocaleString('es-CL')}
                        </p>
                      </div>
                      <span className="text-xs bg-[#0F8B6C]/10 text-[#0F8B6C] px-2 py-0.5 rounded-full font-medium">
                        {p.material?.includes('100%') ? '♻️' : '🌾'}
                      </span>
                    </div>
                    {p.moq_personalizacion && (
                      <p className="text-xs text-blue-600 mt-2">✨ Personalizable gratis desde 10u</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/shop">
            <Button size="lg" className="gap-2 font-semibold" style={{ backgroundColor: '#0F8B6C' }}>
              Ver catálogo completo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── PERSONALIZACIÓN LASER B2C ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#4B4F54] py-14 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="text-white space-y-3">
            <div className="text-sm text-white/50">✨ Nuevo · Grabado en tienda</div>
            <h3 className="text-2xl md:text-3xl font-poppins font-bold">Tu nombre grabado con láser UV</h3>
            <p className="text-white/70">Listo en 5 minutos en tiendas Providencia y Macul</p>
            <div className="flex gap-3 pt-2">
              <Link to="/personalizar">
                <Button className="bg-white text-[#1a1a1a] hover:bg-white/90 font-semibold gap-2">
                  <Zap className="w-4 h-4" />
                  Personalizar mi producto
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {['Carcasas', 'Posavasos', 'Maceteros', 'Llaveros'].map(p => (
              <div key={p} className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white text-center text-sm font-medium">
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── B2B ──────────────────────────────────────────────────── */}
      <div className="bg-[#0F172A] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-white space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/20 text-[#A7D9C9] px-4 py-1.5 rounded-full text-sm font-medium">
              <Building2 className="w-4 h-4" /> Regalos Corporativos B2B
            </div>
            <h3 className="text-2xl md:text-3xl font-poppins font-bold">
              Regalos corporativos con impacto
            </h3>
            <p className="text-white/60 max-w-xl mx-auto">
              Transformamos tus residuos plásticos en regalos corporativos personalizados. Personalización láser UV sin costo en pedidos corporativos.
            </p>
          </div>

          {/* Clientes */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {CLIENTES.map(c => (
              <span key={c} className="bg-white/5 border border-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { e: '🎨', t: 'Mockup gratis en 30 min', d: 'Subí tu logo y lo visualizamos' },
              { e: '⚡', t: 'Propuesta en <24h', d: 'Con precios, condiciones y mockup' },
              { e: '🏭', t: 'Desde 10 unidades', d: 'Personalización láser UV incluida' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 text-white text-center">
                <div className="text-3xl mb-2">{f.e}</div>
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-white/50 text-xs mt-1">{f.d}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/b2b/contacto">
              <Button size="lg" className="gap-2 font-semibold" style={{ backgroundColor: '#0F8B6C' }}>
                <Building2 className="w-5 h-5" />
                Solicitar cotización corporativa
              </Button>
            </Link>
            <p className="text-white/40 text-xs mt-3">
              Respondemos en &lt;24h · Kit escritorio, posavasos, maceteros y más
            </p>
          </div>
        </div>
      </div>

      {/* ── ECONOMÍA CIRCULAR ────────────────────────────────────── */}
      <div className="bg-[#E7D8C6] py-12 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="text-4xl">🐢</div>
          <h3 className="text-2xl font-poppins font-bold">¿Tienes plástico para reciclar?</h3>
          <p className="text-muted-foreground">
            Transformamos los residuos plásticos de tu empresa (PP, HDPE, LDPE) en regalos corporativos personalizados. Economía circular real.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/b2b/contacto">
              <Button style={{ backgroundColor: '#006D5B' }} className="gap-2 font-semibold">
                Convertí residuos en regalos →
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="gap-2">
                Ver tienda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── REVIEWS ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h3 className="text-center font-poppins font-bold text-xl mb-6">Lo que dicen nuestros clientes</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { txt: '"La calidad del plástico reciclado es increíble, no se ve para nada como reciclado. ¡El diseño es hermoso!"', autor: 'M. González, Santiago' },
            { txt: '"Personalizaron 200 kits para nuestra empresa con laser UV en tiempo récord. El equipo es muy profesional."', autor: 'R. Torres, RRHH Empresa Tech' },
            { txt: '"Garantía de 10 años habla por sí sola. Llevo 3 años con mi macetero y está perfecto."', autor: 'C. Vega, Providencia' },
          ].map((r, i) => (
            <div key={i} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed">{r.txt}</p>
              <p className="text-xs font-semibold mt-3 text-foreground">— {r.autor}</p>
            </div>
          ))}
        </div>
      </div>

      <WhatsAppWidget context="general" />

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="bg-[#0B0F12] text-white py-10 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <h4 className="font-poppins font-bold text-lg mb-2" style={{ color: '#A7D9C9' }}>PEYU Chile</h4>
            <p className="text-white/60 text-sm mb-3 leading-relaxed">
              Transformamos residuos plásticos en productos de diseño. Fabricación 100% local en Chile con 6 inyectoras automáticas.
            </p>
            <div className="flex gap-3">
              <Link to="/shop">
                <Button size="sm" className="text-xs" style={{ backgroundColor: '#0F8B6C' }}>Tienda B2C</Button>
              </Link>
              <Link to="/b2b/contacto">
                <Button size="sm" variant="outline" className="text-xs border-white/20 text-white hover:bg-white/10">B2B</Button>
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Tiendas</h4>
            <div className="text-white/60 text-sm space-y-1">
              <p>📍 Francisco Bilbao 3775, Providencia</p>
              <p>📍 Pedro de Valdivia 6603, Macul</p>
              <p>🕐 Lun–Vie 10:00–18:00</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Contacto</h4>
            <div className="text-white/60 text-sm space-y-1">
              <p>📧 ventas@peyuchile.cl</p>
              <p>💬 +56 9 3504 0242</p>
              <p>🌐 peyuchile.cl</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-white/30 text-xs">
          © 2026 Peyu Chile SPA · Manufactura Sustentable · Economía Circular · Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
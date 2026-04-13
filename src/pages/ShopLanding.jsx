import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { getProductImage, CATEGORY_SHOWCASE, HERO_IMAGES } from '@/utils/productImages';
import { ShoppingCart, Building2, Recycle, Star, Zap, Shield, ArrowRight, MapPin, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

const CLIENTES = ['Adidas', 'Nestlé', 'BancoEstado', 'Cachantún', 'Luchetti', 'DUOC UC', 'UAI'];

const REVIEWS = [
  { txt: '"La calidad del plástico reciclado es increíble. El diseño es hermoso y llegó antes de lo esperado."', autor: 'M. González', ciudad: 'Santiago', rating: 5 },
  { txt: '"Personalizaron 200 kits corporativos con laser UV en tiempo récord. El equipo es muy profesional."', autor: 'R. Torres', ciudad: 'Las Condes', rating: 5 },
  { txt: '"Garantía de 10 años habla por sí sola. Llevo 3 años con mi macetero y está perfecto."', autor: 'C. Vega', ciudad: 'Providencia', rating: 5 },
];

const VALUES = [
  { icon: Recycle, label: '100% Reciclado', desc: 'Plástico post-consumo', color: '#0F8B6C' },
  { icon: Shield, label: 'Garantía 10 años', desc: 'En plástico reciclado', color: '#0F8B6C' },
  { icon: Zap, label: 'Láser UV gratis', desc: 'Desde 10 unidades', color: '#D96B4D' },
  { icon: MapPin, label: 'Hecho en Chile', desc: 'Fábrica en Santiago', color: '#4B4F54' },
];

export default function ShopLanding() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  // Hero auto-rotate
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/">
            <div className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow-md shadow-[#0F8B6C]/20 group-hover:scale-105 transition-transform">
                <span className="text-white text-sm font-bold tracking-tight">P</span>
              </div>
              <div>
                <p className="text-[15px] font-poppins font-bold leading-none tracking-tight text-gray-900">PEYU</p>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Plástico que renace</p>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/shop', label: 'Tienda' },
              { to: '/b2b/catalogo', label: 'Corporativo' },
              { to: '/personalizar', label: '✨ Personalizar' },
              { to: '/seguimiento', label: 'Mi pedido' },
            ].map(l => (
              <Link key={l.to} to={l.to}>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">{l.label}</button>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/b2b/contacto">
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-sm font-medium rounded-xl">
                <Building2 className="w-4 h-4" /> B2B
              </Button>
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
        </div>
      </nav>

      {/* ── HERO SLIDER ── */}
      <section className="relative overflow-hidden bg-[#080C0B]" style={{ height: 'clamp(420px, 60vh, 640px)' }}>
        {/* Slides */}
        {HERO_IMAGES.map((src, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIdx ? 'opacity-100' : 'opacity-0'}`}>
            <img src={src} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-5 flex flex-col justify-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 text-sm text-white/80 mb-6">
              <span className="w-1.5 h-1.5 bg-[#0F8B6C] rounded-full animate-pulse" />
              Fabricado en Chile · 100% Plástico Reciclado
            </div>
            <h1 className="font-poppins font-bold text-white leading-[1.05] mb-4">
              <span className="block text-4xl md:text-6xl lg:text-7xl">Plástico</span>
              <span className="block text-4xl md:text-6xl lg:text-7xl" style={{ color: '#A7D9C9' }}>que renace.</span>
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-md leading-relaxed mb-8">
              Productos de diseño durables. Personalizables con láser UV desde 10 unidades.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="gap-2.5 font-semibold rounded-2xl bg-white text-gray-900 hover:bg-gray-100 shadow-xl h-12 px-6">
                  <ShoppingCart className="w-5 h-5" /> Comprar ahora <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/b2b/contacto">
                <Button size="lg" variant="outline" className="gap-2.5 rounded-2xl border-white/25 text-white hover:bg-white/10 h-12 px-6 backdrop-blur">
                  <Building2 className="w-5 h-5" /> Cotizar corporativo
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dots + arrows */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button onClick={() => setHeroIdx(i => (i - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          {HERO_IMAGES.map((_, i) => (
            <button key={i} onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all ${i === heroIdx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`} />
          ))}
          <button onClick={() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length)}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full flex items-center justify-center transition">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Social proof pill */}
        <div className="absolute bottom-5 right-5 hidden md:flex items-center gap-3 bg-white/10 backdrop-blur border border-white/15 rounded-2xl px-4 py-2.5">
          <div className="flex -space-x-2">
            {['M', 'R', 'C', 'A'].map((l, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: `hsl(163,${40 + i * 15}%,${30 + i * 8}%)` }}>{l}</div>
            ))}
          </div>
          <div>
            <div className="flex gap-px">{[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>
            <p className="text-white/60 text-[10px]">+2.400 clientes</p>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {VALUES.map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: v.color + '18' }}>
                <v.icon className="w-4.5 h-4.5" style={{ color: v.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{v.label}</p>
                <p className="text-xs text-gray-400">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Clientes ticker */}
        <div className="border-t border-gray-50 py-2.5 overflow-hidden">
          <div className="flex items-center gap-8 px-5">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest whitespace-nowrap flex-shrink-0">Confían en nosotros</p>
            <div className="flex items-center gap-8 flex-wrap">
              {CLIENTES.map(c => (
                <span key={c} className="text-xs font-semibold text-gray-300 hover:text-gray-500 transition-colors whitespace-nowrap">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORÍAS VISUALES ── */}
      <section className="max-w-7xl mx-auto px-5 py-16">
        <div className="mb-8">
          <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Explorar</p>
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900">Compra por categoría</h2>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {CATEGORY_SHOWCASE.map((c, i) => (
            <Link key={i} to={`/shop?cat=${c.cat}`}>
              <div className="group relative overflow-hidden rounded-2xl aspect-square cursor-pointer">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm leading-tight">{c.label}</p>
                  <p className="text-white/50 text-[10px]">{c.count} productos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ── */}
      <section className="max-w-7xl mx-auto px-5 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Bestsellers</p>
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900">Productos destacados</h2>
            <p className="text-gray-400 mt-1 text-sm">Alta calidad · Material reciclado · Diseño chileno</p>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:gap-3 transition-all group">
            Ver todos
            <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center group-hover:bg-[#0F8B6C] transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-gray-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {productos.map((p, idx) => (
              <Link key={p.id} to={`/producto/${p.id}`}>
                <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '1' }}>
                    <img
                      src={getProductImage(p.sku, p.categoria)}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-300" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {p.material?.includes('100%') && (
                        <span className="text-[10px] font-bold bg-[#0F8B6C] text-white px-2.5 py-1 rounded-full shadow">♻️ Reciclado</span>
                      )}
                      {idx === 0 && <span className="text-[10px] font-bold bg-[#D96B4D] text-white px-2.5 py-1 rounded-full shadow">⭐ Top ventas</span>}
                    </div>
                    {p.moq_personalizacion && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/95 text-purple-600 px-2.5 py-1 rounded-full shadow border border-purple-100">✨ Laser</span>
                    )}
                    <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                      <div className="bg-gray-900/90 backdrop-blur text-white text-xs font-semibold text-center py-2.5 rounded-xl">
                        Ver producto →
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-0.5 line-clamp-1 group-hover:text-[#0F8B6C] transition-colors">{p.nombre}</h3>
                    <p className="text-xs text-gray-400 mb-3">{p.categoria}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-gray-300 line-through">${(p.precio_b2c || 9990).toLocaleString('es-CL')}</p>
                        <p className="font-poppins font-bold text-lg text-gray-900">${Math.floor((p.precio_b2c || 9990) * 0.85).toLocaleString('es-CL')}</p>
                      </div>
                      <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-lg font-bold border border-green-100">−15%</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/shop">
            <Button size="lg" className="gap-2.5 font-semibold rounded-2xl bg-gray-900 hover:bg-gray-800 text-white h-12 px-8 shadow-lg">
              Ver catálogo completo <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── LASER BANNER ── */}
      <section className="mx-4 md:mx-8 rounded-3xl overflow-hidden mb-4">
        <div className="relative h-64 md:h-72">
          <img src="https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/11/Kit-Escritorio-Pro-2-1-1.png?fit=1920%2C640&ssl=1"
            alt="Personalización láser" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div className="text-white space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Grabado en tienda · 5 minutos
              </div>
              <h3 className="text-3xl md:text-4xl font-poppins font-bold leading-tight">
                Tu nombre grabado<br />con láser UV
              </h3>
              <p className="text-white/55">Permanente, irrepetible, tuyo. Disponible en Providencia y Macul.</p>
              <Link to="/personalizar">
                <Button className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl shadow-lg mt-2">
                  <Zap className="w-4 h-4 text-yellow-500" /> Personalizar mi producto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── B2B BANNER ── */}
      <section className="mx-4 md:mx-8 rounded-3xl overflow-hidden mb-4">
        <div className="relative h-64 md:h-72">
          <img src="https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/banner-corporativo-largo-scaled.png?fit=1920%2C640&ssl=1"
            alt="Corporativo B2B" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F18]/95 via-[#0A1F18]/60 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div className="text-white space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/30 text-[#A7D9C9] text-xs font-medium px-3 py-1.5 rounded-full border border-[#0F8B6C]/30">
                <Building2 className="w-3.5 h-3.5" /> Regalos Corporativos B2B
              </div>
              <h3 className="text-3xl md:text-4xl font-poppins font-bold leading-tight">
                Regalos corporativos<br />con impacto real
              </h3>
              <p className="text-white/55">Desde 10 u. · Propuesta en &lt;24h · Personalización láser UV incluida.</p>
              <div className="flex gap-3 flex-wrap pt-1">
                <Link to="/b2b/contacto">
                  <Button className="gap-2 bg-[#0F8B6C] hover:bg-[#0a7558] font-semibold rounded-xl shadow-lg">
                    <Building2 className="w-4 h-4" /> Solicitar cotización
                  </Button>
                </Link>
                <Link to="/b2b/catalogo">
                  <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-xl">
                    Ver catálogo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ECONOMÍA CIRCULAR ── */}
      <section className="bg-[#E7D8C6] mx-4 md:mx-8 rounded-3xl p-8 md:p-12 my-4">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="text-5xl">🐢</div>
          <h3 className="text-2xl md:text-3xl font-poppins font-bold text-gray-900">¿Tienes plástico para reciclar?</h3>
          <p className="text-gray-600 leading-relaxed">
            Transformamos los residuos plásticos de tu empresa en regalos corporativos personalizados. Economía circular real, impacto medible.
          </p>
          <div className="flex gap-3 justify-center flex-wrap pt-2">
            <Link to="/b2b/contacto">
              <Button className="gap-2 font-semibold rounded-xl bg-gray-900 hover:bg-gray-800">Convertí residuos en regalos →</Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-300">Ver tienda</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Testimonios</p>
          <h3 className="text-3xl font-poppins font-bold text-gray-900">Lo que dicen nuestros clientes</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed mb-4">{r.txt}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center text-white text-xs font-bold">
                  {r.autor[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{r.autor}</p>
                  <p className="text-[10px] text-gray-400">{r.ciudad}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <WhatsAppWidget context="general" />

      {/* ── SOPORTE BAR ── */}
      <div className="bg-white border-t border-gray-100 py-4 px-5">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          {[
            { to: '/seguimiento', label: '🔍 Seguimiento de pedido' },
            { to: '/soporte', label: '❓ Centro de ayuda' },
            { href: 'https://wa.me/56935040242', label: '💬 WhatsApp +56 9 3504 0242' },
            { to: '/b2b/contacto', label: '🏢 Cotización corporativa' },
          ].map((l, i) => l.href ? (
            <a key={i} href={l.href} target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">{l.label}</a>
          ) : (
            <Link key={i} to={l.to} className="hover:text-gray-900 transition-colors">{l.label}</Link>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-white py-12 px-5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <p className="font-poppins font-bold text-lg">PEYU Chile</p>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Transformamos residuos plásticos en productos de diseño. Fabricación 100% local en Santiago.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/shop"><Button size="sm" className="text-xs rounded-xl bg-[#0F8B6C] hover:bg-[#0a7558]">Tienda B2C</Button></Link>
              <Link to="/b2b/contacto"><Button size="sm" variant="outline" className="text-xs rounded-xl border-white/10 text-white hover:bg-white/10">B2B</Button></Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/80">Tiendas</h4>
            <div className="text-white/40 text-sm space-y-2">
              <p>📍 Francisco Bilbao 3775, Providencia</p>
              <p>📍 Pedro de Valdivia 6603, Macul</p>
              <p>🕐 Lun–Vie 10:00–18:00</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/80">Contacto</h4>
            <div className="text-white/40 text-sm space-y-2">
              <p>📧 ventas@peyuchile.cl</p>
              <p>💬 +56 9 3504 0242</p>
              <p>🌐 peyuchile.cl</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 mt-10 pt-6 text-center text-white/20 text-xs">
          © 2026 Peyu Chile SPA · Manufactura Sustentable · Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
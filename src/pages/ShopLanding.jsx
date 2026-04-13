import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Building2, Recycle, Star, Zap, Shield, ArrowRight, MapPin, ChevronRight, Sparkles } from 'lucide-react';
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
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

  useEffect(() => {
    base44.entities.Producto.filter({ activo: true })
      .then(data => setProductos(data.slice(0, 6)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
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

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#080C0B]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0F8B6C] rounded-full blur-[120px] opacity-20" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#A7D9C9] rounded-full blur-[100px] opacity-10" />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-[#D96B4D] rounded-full blur-[100px] opacity-10" />
        </div>
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        <div className="relative max-w-7xl mx-auto px-5 pt-24 pb-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur border border-white/10 rounded-full px-4 py-1.5 text-sm text-white/70 mb-8">
              <span className="w-1.5 h-1.5 bg-[#0F8B6C] rounded-full animate-pulse" />
              Fabricado en Chile · 100% Plástico Reciclado Post-Consumo
            </div>

            {/* Headline */}
            <h1 className="font-poppins font-bold text-white leading-[1.05] mb-6">
              <span className="block text-5xl md:text-7xl">Plástico</span>
              <span className="block text-5xl md:text-7xl" style={{ color: '#A7D9C9' }}>que renace.</span>
            </h1>

            <p className="text-white/55 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
              Productos de diseño durables con plástico 100% reciclado. Personalizables con láser UV desde 10 unidades.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/shop">
                <Button size="lg" className="gap-2.5 font-semibold rounded-2xl bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-black/20 h-12 px-6">
                  <ShoppingCart className="w-5 h-5" />
                  Comprar ahora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/b2b/contacto">
                <Button size="lg" variant="outline" className="gap-2.5 rounded-2xl border-white/20 text-white hover:bg-white/10 h-12 px-6 backdrop-blur">
                  <Building2 className="w-5 h-5" />
                  Cotizar corporativo
                </Button>
              </Link>
            </div>

            {/* Social proof mini */}
            <div className="flex items-center gap-4 mt-10">
              <div className="flex -space-x-2">
                {[40, 55, 70, 85].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080C0B] flex items-center justify-center text-xs font-bold" style={{ background: `hsl(163,${l}%,${35 + i*5}%)`, color: 'white' }}>
                    {['M','R','C','A'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-white/50 text-xs mt-0.5">+2.400 clientes satisfechos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {VALUES.map((v, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 transition group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: v.color + '18' }}>
                <v.icon className="w-5 h-5" style={{ color: v.color }} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{v.label}</p>
                <p className="text-xs text-gray-400">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ticker / logos clientes */}
        <div className="border-t border-gray-100 py-3 overflow-hidden">
          <div className="flex items-center gap-8 animate-none">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest pl-5 whitespace-nowrap flex-shrink-0">Confían en nosotros</p>
            <div className="flex items-center gap-8 flex-wrap">
              {CLIENTES.map(c => (
                <span key={c} className="text-xs font-semibold text-gray-300 hover:text-gray-500 transition-colors whitespace-nowrap">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTOS DESTACADOS ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Bestsellers</p>
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900 leading-tight">Productos destacados</h2>
            <p className="text-gray-400 mt-2">Alta calidad · Material reciclado · Diseño chileno</p>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:gap-3 transition-all group">
            Ver todos
            <div className="w-7 h-7 bg-gray-900 text-white rounded-lg flex items-center justify-center group-hover:bg-[#0F8B6C] transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          {[{e:'🖥️',l:'Escritorio'},{e:'🌱',l:'Hogar'},{e:'🎲',l:'Entretenimiento'},{e:'🎁',l:'Corporativo'},{e:'📱',l:'Carcasas'}].map((c,i) => (
            <Link key={i} to={`/shop?cat=${c.l}`}>
              <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-600 text-sm font-semibold px-4 py-2 rounded-2xl transition-all cursor-pointer shadow-sm">
                {c.e} {c.l}
              </span>
            </Link>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[1,2,3].map(i => (
              <div key={i} className="h-72 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {productos.map((p, idx) => (
              <Link key={p.id} to={`/producto/${p.id}`}>
                <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
                  <div className="relative overflow-hidden h-52 md:h-60">
                    <img
                      src={getProductImage(p.sku, p.categoria)}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.style.display='none'; }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {p.material?.includes('100%') && (
                        <span className="text-[10px] font-bold bg-[#0F8B6C] text-white px-2 py-0.5 rounded-full shadow">♻️ Reciclado</span>
                      )}
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-[#D96B4D] text-white px-2 py-0.5 rounded-full shadow">⭐ Top ventas</span>
                      )}
                    </div>
                    {p.moq_personalizacion && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/95 text-purple-600 px-2 py-0.5 rounded-full shadow border border-purple-100">✨ Laser</span>
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
                        {p.precio_b2c && (
                          <p className="text-[10px] text-gray-300 line-through">${p.precio_b2c?.toLocaleString('es-CL')}</p>
                        )}
                        <p className="font-poppins font-bold text-lg text-gray-900">
                          ${Math.floor((p.precio_b2c || 9990) * 0.85)?.toLocaleString('es-CL')}
                        </p>
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
              Ver catálogo completo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── PERSONALIZACIÓN LASER ────────────────────────── */}
      <section className="mx-4 md:mx-8 rounded-3xl overflow-hidden bg-gray-900 my-4">
        <div className="max-w-5xl mx-auto px-8 py-16 flex flex-col md:flex-row items-center gap-10 justify-between">
          <div className="text-white space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Nuevo · Grabado en tienda
            </div>
            <h3 className="text-3xl md:text-4xl font-poppins font-bold leading-tight">
              Tu nombre grabado<br />con láser UV
            </h3>
            <p className="text-white/50 leading-relaxed">Listo en 5 minutos en tiendas Providencia y Macul. Permanente, irrepetible, tuyo.</p>
            <div className="flex gap-3 pt-2">
              <Link to="/personalizar">
                <Button className="gap-2 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-xl shadow-lg">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Personalizar mi producto
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {['📱 Carcasas', '🟢 Posavasos', '🌱 Maceteros', '🔑 Llaveros'].map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 hover:bg-white/10 transition rounded-2xl px-5 py-3.5 text-white text-sm font-medium text-center cursor-default">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2B ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 py-20">
        <div className="bg-gradient-to-br from-[#0A1F18] to-[#0F2E24] rounded-3xl p-8 md:p-12">
          <div className="text-center text-white space-y-4 mb-10">
            <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/20 text-[#A7D9C9] px-4 py-1.5 rounded-full text-sm font-medium">
              <Building2 className="w-4 h-4" /> Regalos Corporativos B2B
            </div>
            <h3 className="text-3xl md:text-4xl font-poppins font-bold">Regalos corporativos<br />con impacto real</h3>
            <p className="text-white/50 max-w-xl mx-auto">Transformamos residuos plásticos de tu empresa en regalos únicos con tu logo grabado.</p>
          </div>

          {/* Logos clientes */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CLIENTES.map(c => (
              <span key={c} className="bg-white/5 border border-white/10 text-white/40 text-xs px-4 py-1.5 rounded-full">{c}</span>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {[
              { e: '🎨', t: 'Mockup gratis en 30 min', d: 'Subí tu logo, lo visualizamos al instante' },
              { e: '⚡', t: 'Propuesta en <24h', d: 'Con precios, condiciones y mockup incluido' },
              { e: '🏭', t: 'Desde 10 unidades', d: 'Personalización láser UV sin costo adicional' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 hover:bg-white/8 transition rounded-2xl p-6 text-white text-center">
                <div className="text-4xl mb-3">{f.e}</div>
                <div className="font-semibold text-sm mb-1">{f.t}</div>
                <div className="text-white/40 text-xs leading-relaxed">{f.d}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/b2b/contacto">
              <Button size="lg" className="gap-2.5 font-semibold rounded-2xl bg-[#0F8B6C] hover:bg-[#0a7558] h-12 px-8 shadow-lg shadow-[#0F8B6C]/30">
                <Building2 className="w-5 h-5" />
                Solicitar cotización corporativa
              </Button>
            </Link>
            <p className="text-white/30 text-xs mt-3">Respondemos en &lt;24h · Sin compromiso</p>
          </div>
        </div>
      </section>

      {/* ── ECONOMÍA CIRCULAR ────────────────────────────── */}
      <section className="bg-[#E7D8C6] mx-4 md:mx-8 rounded-3xl p-8 md:p-12 my-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="text-5xl">🐢</div>
          <h3 className="text-2xl md:text-3xl font-poppins font-bold text-gray-900">¿Tienes plástico para reciclar?</h3>
          <p className="text-gray-600 leading-relaxed">
            Transformamos los residuos plásticos de tu empresa en regalos corporativos personalizados. Economía circular real, impacto medible.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/b2b/contacto">
              <Button className="gap-2 font-semibold rounded-xl bg-gray-900 hover:bg-gray-800">
                Convertí residuos en regalos →
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-300">Ver tienda</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#0F8B6C] uppercase tracking-widest mb-2">Testimonios</p>
          <h3 className="text-3xl font-poppins font-bold text-gray-900">Lo que dicen nuestros clientes</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {REVIEWS.map((r, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
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

      {/* ── SOPORTE BAR ──────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 py-5 px-5">
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

      {/* ── FOOTER ───────────────────────────────────────── */}
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
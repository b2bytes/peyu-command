import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Leaf, Recycle, Zap, Globe, Heart, Award, Users, Factory } from 'lucide-react';

const VALORES = [
  { icon: Recycle, color: '#0F8B6C', title: 'Economía Circular', desc: 'Transformamos residuos plásticos post-consumo en productos de alta calidad. Cada producto equivale a sacar plástico del vertedero.' },
  { icon: Zap, color: '#D96B4D', title: 'Personalización Láser UV', desc: 'Tecnología de grabado láser UV sin tintas ni químicos. Tu logo permanente, resistente al agua y al tiempo.' },
  { icon: Award, color: '#4B4F54', title: 'Garantía 10 Años', desc: 'Tan seguros estamos de nuestra calidad que garantizamos 10 años en todos nuestros productos de plástico reciclado.' },
  { icon: Globe, color: '#0F8B6C', title: 'Fabricación Local', desc: 'Producimos 100% en Chile. Con 6 inyectoras de última generación en nuestra fábrica en Santiago.' },
];

const HITOS = [
  { año: '2019', evento: 'Primer prototipo: un macetero hecho con botellas del barrio' },
  { año: '2020', evento: 'Primera inyectora. Primer cliente corporativo: empresa de 50 personas' },
  { año: '2021', evento: 'Apertura tienda Providencia. Primer láser galvo UV instalado' },
  { año: '2022', evento: '6 inyectoras operativas. Primer pedido de 10.000 unidades (Adidas Chile)' },
  { año: '2023', evento: 'Segunda tienda en Macul. Expansión a fibra de trigo compostable' },
  { año: '2024', evento: 'Lanzamiento plataforma digital B2B. +50 empresas clientes activas' },
  { año: '2025', evento: 'Certificación ESG. Alianza con BancoEstado, DUOC UC, UAI' },
  { año: '2026', evento: 'Más de 500.000 kg de plástico reciclado. Meta: 1M kg en 2027' },
];

const TEAM = [
  {
    nombre: 'Joaquín Donoso',
    rol: 'Co-founder & CEO',
    desc: 'Ingeniero industrial. Obsesionado con cerrar el ciclo del plástico. Ex-consultor de Supply Chain que apostó por la economía circular cuando nadie lo hacía.',
    emoji: '👷',
  },
  {
    nombre: 'Carlos Morales',
    rol: 'Co-founder & Head of Sales',
    desc: 'El vendedor de los regalos sostenibles. Convierte cada cotización corporativa en una historia de impacto. Responde WhatsApps más rápido que cualquier bot.',
    emoji: '📞',
  },
];

const IMPACTO = [
  { valor: '500.000', label: 'kg de plástico reciclado', icon: Recycle, color: '#0F8B6C' },
  { valor: '50+', label: 'empresas clientes activas', icon: Users, color: '#D96B4D' },
  { valor: '6', label: 'inyectoras de producción', icon: Factory, color: '#4B4F54' },
  { valor: '10 años', label: 'de garantía por producto', icon: Award, color: '#0F8B6C' },
];

export default function Nosotros() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link to="/" className="group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow text-lg">🐢</div>
            <div>
              <p className="text-sm font-poppins font-bold text-gray-900 leading-none">PEYU Chile</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Nuestra historia</p>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white py-20 px-5">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url('https://media.base44.com/images/public/69d99b9d61f699701129c103/6935b8ac0_image.png')`,
          backgroundSize: 'cover', backgroundPosition: 'center'
        }} />
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold">
            <Heart className="w-4 h-4" /> Hecha en Chile, con propósito
          </div>
          <h1 className="text-4xl md:text-6xl font-poppins font-black leading-tight">
            Desde una terraza<br />
            <span className="text-teal-400">hasta una fábrica</span><br />
            con 6 inyectoras
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile.
          </p>
        </div>
      </section>

      {/* IMPACTO */}
      <section className="py-16 px-5 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-[#0F8B6C] uppercase tracking-widest text-center mb-8">Nuestro impacto hasta hoy</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {IMPACTO.map((item, i) => (
              <div key={i} className="text-center p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: item.color }} />
                <p className="font-poppins font-black text-3xl text-gray-900">{item.valor}</p>
                <p className="text-xs text-gray-400 mt-1 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold text-[#0F8B6C] uppercase tracking-widest mb-3">La historia</p>
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-4">Del vertedero al escritorio</h2>
          <p className="text-gray-500 leading-relaxed mb-8 text-base max-w-2xl">
            Todo comenzó en 2019, cuando Joaquín, ingeniero industrial con obsesión por la economía circular, 
            empezó a fundir botellas plásticas recogidas en su barrio en su terraza. El primer prototipo era feo. 
            Pero la idea era perfecta: <strong className="text-gray-700">el plástico que ya existe es la mejor materia prima del mundo</strong>.
          </p>
          <p className="text-gray-500 leading-relaxed mb-8 text-base max-w-2xl">
            Carlos se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. 
            Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.
          </p>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-6">
              {HITOS.map((h, i) => (
                <div key={i} className="flex gap-5 relative pl-10">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-[#0F8B6C]/10 border-2 border-[#0F8B6C]/30 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-3.5 h-3.5 text-[#0F8B6C]" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex-1 hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-[#0F8B6C] font-mono">{h.año}</span>
                    <p className="text-sm text-gray-700 mt-0.5">{h.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="py-16 px-5 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-[#0F8B6C] uppercase tracking-widest mb-3">El equipo fundador</p>
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-8">Las personas detrás del plástico</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TEAM.map((p, i) => (
              <div key={i} className="bg-gradient-to-br from-[#FAFAF8] to-white border border-gray-100 rounded-3xl p-7 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0F8B6C]/15 to-teal-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
                  {p.emoji}
                </div>
                <h3 className="font-poppins font-bold text-xl text-gray-900">{p.nombre}</h3>
                <p className="text-sm font-semibold text-[#0F8B6C] mb-3">{p.rol}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="py-16 px-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-3">Nuestros valores</p>
          <h2 className="text-3xl font-poppins font-bold text-white mb-8">Por qué Peyu importa</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {VALORES.map((v, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: v.color + '25' }}>
                  <v.icon className="w-6 h-6" style={{ color: v.color }} />
                </div>
                <h3 className="font-poppins font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-5 bg-white text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-5xl">🐢</div>
          <h2 className="text-3xl font-poppins font-bold text-gray-900">¿Te unes a la misión?</h2>
          <p className="text-gray-400 leading-relaxed">
            Cada regalo Peyu es un paso hacia un Chile con menos plástico en el vertedero y más diseño con propósito.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/shop">
              <Button size="lg" className="rounded-2xl gap-2 font-semibold px-8" style={{ backgroundColor: '#0F8B6C' }}>
                Ver tienda →
              </Button>
            </Link>
            <Link to="/b2b/contacto">
              <Button size="lg" variant="outline" className="rounded-2xl gap-2 font-semibold px-8">
                Cotización corporativa
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            ventas@peyuchile.cl · <a href="https://wa.me/56935040242" className="text-[#0F8B6C] font-semibold hover:underline">+56 9 3504 0242</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-10 px-5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-poppins font-bold text-lg mb-2">🐢 PEYU Chile</h3>
            <p className="text-gray-400 text-sm">Regalos corporativos 100% sostenibles. Fabricados en Santiago con plástico reciclado.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">Navegación</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/shop" className="hover:text-white">Tienda B2C</Link></li>
              <li><Link to="/b2b/contacto" className="hover:text-white">Cotización B2B</Link></li>
              <li><Link to="/catalogo-visual" className="hover:text-white">Catálogo Visual</Link></li>
              <li><Link to="/nosotros" className="hover:text-white">Nosotros</Link></li>
              <li><Link to="/soporte" className="hover:text-white">Soporte</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-sm">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📱 <a href="https://wa.me/56935040242" className="hover:text-white">+56 9 3504 0242</a></li>
              <li>📧 <a href="mailto:ventas@peyuchile.cl" className="hover:text-white">ventas@peyuchile.cl</a></li>
              <li>📍 Fernando Bilbao 3775, Providencia</li>
              <li>📍 Pedro de Valdivia 6603, Macul</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-gray-500 text-xs">
          © 2026 PEYU Chile SpA. Todos los derechos reservados. RUT: 76.XXX.XXX-X
        </div>
      </footer>
    </div>
  );
}
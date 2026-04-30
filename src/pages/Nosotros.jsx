import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Leaf, Recycle, Zap, Globe, Heart, Award, Users, Factory } from 'lucide-react';

const VALORES = [
  { icon: Recycle, color: '#2dd4bf', title: 'Economía Circular', desc: 'Transformamos residuos plásticos post-consumo en productos de alta calidad. Cada producto equivale a sacar plástico del vertedero.' },
  { icon: Zap, color: '#f97316', title: 'Personalización Láser UV', desc: 'Tecnología de grabado láser UV sin tintas ni químicos. Tu logo permanente, resistente al agua y al tiempo.' },
  { icon: Award, color: '#a78bfa', title: 'Garantía 10 Años', desc: 'Tan seguros estamos de nuestra calidad que garantizamos 10 años en todos nuestros productos de plástico reciclado.' },
  { icon: Globe, color: '#34d399', title: 'Fabricación Local', desc: 'Producimos 100% en Chile. Con 6 inyectoras de última generación en nuestra fábrica en Santiago.' },
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
  { nombre: 'Joaquín Donoso', rol: 'Co-founder & CEO', desc: 'Ingeniero industrial. Obsesionado con cerrar el ciclo del plástico. Ex-consultor de Supply Chain que apostó por la economía circular cuando nadie lo hacía.', emoji: '👷' },
  { nombre: 'Carlos Morales', rol: 'Co-founder & Head of Sales', desc: 'El vendedor de los regalos sostenibles. Convierte cada cotización corporativa en una historia de impacto. Responde WhatsApps más rápido que cualquier bot.', emoji: '📞' },
];

const IMPACTO = [
  { valor: '500K+', label: 'kg de plástico reciclado', icon: Recycle },
  { valor: '50+', label: 'empresas clientes activas', icon: Users },
  { valor: '6', label: 'inyectoras de producción', icon: Factory },
  { valor: '10 años', label: 'de garantía por producto', icon: Award },
];



export default function Nosotros() {
  return (
    <div className="flex-1 overflow-auto font-inter pb-20 lg:pb-0">

        {/* HERO */}
        <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/40 text-teal-300 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm">
            <Heart className="w-4 h-4" /> Hecha en Chile, con propósito
          </div>
          <h1 className="text-4xl md:text-6xl font-poppins font-black leading-tight text-white drop-shadow-lg">
            Desde una terraza<br />
            <span className="text-cyan-400">hasta una fábrica</span><br />
            con 6 inyectoras
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile.
          </p>
        </section>

        {/* IMPACTO */}
        <section className="px-4 sm:px-8 pb-12 max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest text-center mb-6">Nuestro impacto hasta hoy</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {IMPACTO.map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center hover:bg-white/10 hover:-translate-y-1 transition-all shadow-lg">
                <item.icon className="w-7 h-7 mx-auto mb-3 text-teal-400" />
                <p className="font-poppins font-black text-2xl text-white">{item.valor}</p>
                <p className="text-xs text-white/50 mt-1 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HISTORIA + TIMELINE */}
        <section className="px-4 sm:px-8 pb-14 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-7 md:p-10 shadow-2xl space-y-6">
            <div>
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">La historia</p>
              <h2 className="text-3xl font-poppins font-bold text-white mb-4">Del vertedero al escritorio</h2>
              <p className="text-white/60 leading-relaxed text-sm max-w-2xl">
                Todo comenzó en 2019, cuando Joaquín empezó a fundir botellas plásticas de su barrio en la terraza. El primer prototipo era feo. Pero la idea era perfecta: <strong className="text-white">el plástico que ya existe es la mejor materia prima del mundo</strong>.
              </p>
              <p className="text-white/60 leading-relaxed text-sm max-w-2xl mt-3">
                Carlos se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-4">
                {HITOS.map((h, i) => (
                  <div key={i} className="flex gap-5 relative pl-10">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1 hover:bg-white/10 transition-all">
                      <span className="text-xs font-bold text-teal-400 font-mono">{h.año}</span>
                      <p className="text-sm text-white/80 mt-0.5">{h.evento}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* EQUIPO */}
        <section className="px-4 sm:px-8 pb-14 max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3 text-center">El equipo fundador</p>
          <h2 className="text-3xl font-poppins font-bold text-white mb-7 text-center">Las personas detrás del plástico</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {TEAM.map((p, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-7 hover:bg-white/10 hover:-translate-y-1 transition-all shadow-lg">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500/25 to-cyan-500/20 border border-teal-400/30 flex items-center justify-center text-3xl mb-4 shadow-lg">
                  {p.emoji}
                </div>
                <h3 className="font-poppins font-bold text-xl text-white">{p.nombre}</h3>
                <p className="text-sm font-semibold text-teal-400 mb-3">{p.rol}</p>
                <p className="text-sm text-white/60 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* VALORES */}
        <section className="px-4 sm:px-8 pb-14 max-w-5xl mx-auto">
          <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3 text-center">Nuestros valores</p>
          <h2 className="text-3xl font-poppins font-bold text-white mb-7 text-center">Por qué Peyu importa</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {VALORES.map((v, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-2xl p-6 hover:bg-white/10 transition-all shadow-lg">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: v.color + '20', border: `1px solid ${v.color}30` }}>
                  <v.icon className="w-6 h-6" style={{ color: v.color }} />
                </div>
                <h3 className="font-poppins font-bold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-8 pb-14 max-w-2xl mx-auto text-center space-y-6">
          <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/15 backdrop-blur-md border border-teal-400/30 rounded-3xl p-10 shadow-2xl">
            <div className="text-5xl mb-4">🐢</div>
            <h2 className="text-3xl font-poppins font-bold text-white mb-3">¿Te unes a la misión?</h2>
            <p className="text-white/60 leading-relaxed text-sm mb-6">
              Cada regalo Peyu es un paso hacia un Chile con menos plástico en el vertedero y más diseño con propósito.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/shop">
                <Button size="lg" className="rounded-2xl gap-2 font-bold px-8 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0 shadow-xl shadow-teal-500/30">
                  Ver tienda →
                </Button>
              </Link>
              <Link to="/b2b/contacto">
                <Button size="lg" className="rounded-2xl font-bold px-8 bg-white/15 hover:bg-white/25 text-white border border-white/30">
                  Cotización corporativa
                </Button>
              </Link>
            </div>
            <p className="text-xs text-white/40 mt-5">
              ventas@peyuchile.cl · <a href="https://wa.me/56935040242" className="text-teal-400 font-semibold hover:underline">+56 9 3504 0242</a>
            </p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-4 sm:px-8 py-10 font-inter">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-poppins font-bold text-white text-lg mb-2">🐢 PEYU Chile</h3>
              <p className="text-white/40 text-sm">Regalos corporativos 100% sostenibles. Fabricados en Santiago.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Navegación</h4>
              <ul className="space-y-2 text-sm text-white/50">
                {[['Tienda B2C', '/shop'], ['Cotización B2B', '/b2b/contacto'], ['Catálogo Visual', '/catalogo-visual'], ['Soporte', '/soporte']].map(([l, h]) => (
                  <li key={h}><Link to={h} className="hover:text-white transition">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Contacto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>📱 <a href="https://wa.me/56935040242" className="hover:text-white">+56 9 3504 0242</a></li>
                <li>📧 <a href="mailto:ventas@peyuchile.cl" className="hover:text-white">ventas@peyuchile.cl</a></li>
                <li>📍 Fernando Bilbao 3775, Providencia</li>
                <li>📍 Pedro de Valdivia 6603, Macul</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/30 text-xs">
            © 2026 PEYU Chile SpA. Todos los derechos reservados.
          </div>
        </footer>
    </div>
  );
}
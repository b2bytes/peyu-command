import { Leaf, Recycle, Zap, Globe, Award, Users, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';

const VALORES = [
  { icon: Recycle, title: 'Economía Circular', desc: 'Transformamos residuos plásticos post-consumo en productos de alta calidad. Cada producto equivale a sacar plástico del vertedero.' },
  { icon: Zap, title: 'Personalización Láser UV', desc: 'Tecnología de grabado láser UV sin tintas ni químicos. Tu logo permanente, resistente al agua y al tiempo.' },
  { icon: Award, title: 'Garantía 10 Años', desc: 'Tan seguros estamos de nuestra calidad que garantizamos 10 años en todos nuestros productos de plástico reciclado.' },
  { icon: Globe, title: 'Fabricación Local', desc: 'Producimos 100% en Chile. Con 6 inyectoras de última generación en nuestra fábrica en Santiago.' },
];

const HITOS = [
  { año: '2019', evento: 'Primer prototipo: un macetero hecho con botellas del barrio' },
  { año: '2020', evento: 'Primera inyectora. Primer cliente corporativo: empresa de 50 personas' },
  { año: '2021', evento: 'Apertura tienda Providencia. Primer láser galvo UV instalado' },
  { año: '2022', evento: '6 inyectoras operativas. Primer pedido de 10.000 unidades (Adidas Chile)' },
  { año: '2023', evento: 'Segunda tienda en Macul. Expansión a fibra de trigo compostable' },
  { año: '2024', evento: 'Lanzamiento plataforma digital B2B. +50 empresas clientes activas' },
  { año: '2025', evento: 'Política ESG interna publicada. Alianza con BancoEstado, DUOC UC, UAI' },
  { año: '2026', evento: 'Más de 500.000 kg de plástico reciclado. Meta: 1M kg en 2027' },
];

const TEAM = [
  { nombre: 'Joaquín Nilo', rol: 'Co-founder & CEO', desc: 'Ingeniero industrial. Obsesionado con cerrar el ciclo del plástico. Ex-consultor de Supply Chain que apostó por la economía circular cuando nadie lo hacía.', emoji: '👷' },
  { nombre: 'Carlos Moscoso', rol: 'Co-founder & Head of Sales', desc: 'El vendedor de los regalos sostenibles. Convierte cada cotización corporativa en una historia de impacto. Responde WhatsApps más rápido que cualquier bot.', emoji: '📞' },
];

const IMPACTO = [
  { valor: '500K+', label: 'kg de plástico reciclado', icon: Recycle },
  { valor: '50+', label: 'empresas clientes activas', icon: Users },
  { valor: '6', label: 'inyectoras de producción', icon: Factory },
  { valor: '10 años', label: 'de garantía por producto', icon: Award },
];

export default function Nosotros() {
  return (
    <div className="min-h-screen font-inter pb-20 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>
      {/* HERO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-10 text-center">
        <span className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-3 py-1 rounded-full" style={{ background: 'rgba(192,120,92,.12)', color: '#C0785C' }}>
          PEYU 2026 · Hecho en Chile
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5" style={{ color: '#2C1810', letterSpacing: '-0.02em' }}>
          Desde una terraza<br />
          <span className="italic font-serif" style={{ color: '#C0785C' }}>hasta una fábrica</span><br />
          con 6 inyectoras.
        </h1>
        <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#7A6050' }}>
          Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile.
        </p>
      </section>

      {/* IMPACTO */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <p className="text-xs font-bold tracking-widest uppercase text-center mb-6" style={{ color: '#C0785C' }}>Nuestro impacto hasta hoy</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMPACTO.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center p-6 rounded-2xl hover:-translate-y-1 transition-transform"
                style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 2px 12px rgba(44,24,16,.06)' }}>
                <Icon className="w-6 h-6 mx-auto mb-3" style={{ color: '#C0785C' }} />
                <p className="text-3xl font-black" style={{ color: '#2C1810' }}>{item.valor}</p>
                <p className="text-xs mt-1 leading-snug" style={{ color: '#7A6050' }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HISTORIA + TIMELINE */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#C0785C' }}>La historia</p>
        <h2 className="text-3xl font-black mb-6" style={{ color: '#2C1810' }}>Del vertedero <span className="italic font-serif" style={{ color: '#C0785C' }}>al escritorio.</span></h2>
        <div className="rounded-2xl p-7 md:p-10 space-y-6" style={{ background: 'white', border: '1.5px solid #D4C4B0' }}>
          <div className="space-y-3 text-sm leading-relaxed" style={{ color: '#7A6050' }}>
            <p>
              Todo comenzó en 2019, cuando Joaquín Nilo empezó a fundir botellas plásticas de su barrio en la terraza. El primer prototipo era feo. Pero la idea era perfecta: <strong style={{ color: '#2C1810' }}>el plástico que ya existe es la mejor materia prima del mundo</strong>.
            </p>
            <p>
              Carlos Moscoso se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: '#D4C4B0' }} />
            <div className="space-y-4">
              {HITOS.map((h, i) => (
                <div key={i} className="flex gap-5 relative pl-10">
                  <div className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(192,120,92,.12)', border: '1.5px solid #C0785C' }}>
                    <Leaf className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
                  </div>
                  <div className="rounded-2xl p-4 flex-1" style={{ background: '#F8F3ED', border: '1px solid #D4C4B0' }}>
                    <span className="text-xs font-bold font-mono" style={{ color: '#C0785C' }}>{h.año}</span>
                    <p className="text-sm mt-0.5" style={{ color: '#7A6050' }}>{h.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <p className="text-xs font-bold tracking-widest uppercase mb-2 text-center" style={{ color: '#C0785C' }}>El equipo fundador</p>
        <h2 className="text-3xl font-black mb-6 text-center" style={{ color: '#2C1810' }}>Las personas <span className="italic font-serif" style={{ color: '#C0785C' }}>detrás del plástico.</span></h2>
        <div className="grid md:grid-cols-2 gap-5">
          {TEAM.map((p, i) => (
            <div key={i} className="p-7 rounded-2xl hover:-translate-y-1 transition-transform"
              style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 2px 12px rgba(44,24,16,.06)' }}>
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4"
                style={{ background: 'rgba(192,120,92,.12)', border: '1.5px solid #C0785C' }}>
                {p.emoji}
              </div>
              <h3 className="text-2xl font-black mb-1" style={{ color: '#2C1810' }}>{p.nombre}</h3>
              <p className="text-sm font-bold mb-3" style={{ color: '#C0785C' }}>{p.rol}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALORES */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <p className="text-xs font-bold tracking-widest uppercase mb-2 text-center" style={{ color: '#C0785C' }}>Nuestros valores</p>
        <h2 className="text-3xl font-black mb-6 text-center" style={{ color: '#2C1810' }}>Por qué Peyu <span className="italic font-serif" style={{ color: '#C0785C' }}>importa.</span></h2>
        <div className="grid md:grid-cols-2 gap-4">
          {VALORES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="p-6 rounded-2xl hover:-translate-y-1 transition-transform"
                style={{ background: 'white', border: '1.5px solid #D4C4B0', boxShadow: '0 2px 12px rgba(44,24,16,.06)' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(192,120,92,.12)', border: '1.5px solid #C0785C' }}>
                  <Icon className="w-6 h-6" style={{ color: '#C0785C' }} />
                </div>
                <h3 className="font-black mb-2 text-base" style={{ color: '#2C1810' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)', boxShadow: '0 8px 32px rgba(192,120,92,.3)' }}>
          <p className="text-sm font-bold tracking-widest uppercase mb-3 text-white/80">🐢 Únete a la misión</p>
          <h2 className="text-3xl font-black text-white mb-3">¿Te unes a la misión?</h2>
          <p className="text-white/85 text-base mb-7 max-w-lg mx-auto leading-relaxed">
            Cada regalo PEYU es un paso hacia un Chile con menos plástico en el vertedero y más diseño con propósito.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/CatalogoNuevo"
              className="px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'white', color: '#C0785C', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
              Ver tienda →
            </Link>
            <Link to="/EmpresasNuevo"
              className="px-7 py-3.5 rounded-2xl font-bold text-sm border-2 border-white/40 text-white transition-all hover:bg-white/10">
              Soy empresa
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
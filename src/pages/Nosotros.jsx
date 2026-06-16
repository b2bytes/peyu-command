import { Link } from 'react-router-dom';
import {
  Recycle, Zap, ShieldCheck, MapPin, Users, Factory, Leaf,
  ArrowRight, CircleDot, Sprout, FlaskConical, Gem
} from 'lucide-react';
import useTextosPagina from '@/hooks/useTextosPagina';

// ── Iconografía eco-inteligente 2027: SF-style, thin stroke, conceptual
const VALORES = [
  {
    icon: Recycle,
    glyph: '♻',
    title: 'Economía Circular',
    desc: 'Transformamos residuos plásticos post-consumo en productos de alta calidad. Cada pieza equivale a sacar plástico del vertedero permanentemente.',
    accent: '#0F8B6C',
    bg: 'rgba(15,139,108,.07)',
    border: 'rgba(15,139,108,.18)',
  },
  {
    icon: Zap,
    glyph: '⚡',
    title: 'Grabado Láser UV',
    desc: 'Tecnología de grabado sin tintas ni químicos. Tu logo permanente, resistente al agua y al tiempo. Gratis desde 10 unidades.',
    accent: '#C0785C',
    bg: 'rgba(192,120,92,.07)',
    border: 'rgba(192,120,92,.18)',
  },
  {
    icon: ShieldCheck,
    glyph: '🛡',
    title: 'Garantía 10 Años',
    desc: 'Tan seguros estamos de nuestra calidad que garantizamos 10 años en todos nuestros productos de plástico reciclado.',
    accent: '#5B7DB1',
    bg: 'rgba(91,125,177,.07)',
    border: 'rgba(91,125,177,.18)',
  },
  {
    icon: MapPin,
    glyph: '📍',
    title: 'Fabricación Local',
    desc: 'Producimos 100% en Chile. Con 6 inyectoras de última generación en nuestra fábrica en Santiago.',
    accent: '#8BAD8A',
    bg: 'rgba(139,173,138,.07)',
    border: 'rgba(139,173,138,.22)',
  },
];

const HITOS = [
  { año: '2019', evento: 'Primer prototipo: un macetero hecho con botellas del barrio', icon: Sprout },
  { año: '2020', evento: 'Primera inyectora. Primer cliente corporativo: empresa de 50 personas', icon: Factory },
  { año: '2021', evento: 'Apertura tienda Providencia. Primer láser galvo UV instalado', icon: Zap },
  { año: '2022', evento: '6 inyectoras operativas. Primer pedido de 10.000 unidades (Adidas Chile)', icon: Gem },
  { año: '2023', evento: 'Segunda tienda en Macul. Expansión a fibra de trigo compostable', icon: Leaf },
  { año: '2024', evento: 'Lanzamiento plataforma digital B2B. +50 empresas clientes activas', icon: Users },
  { año: '2025', evento: 'Política ESG interna publicada. Alianza con BancoEstado, DUOC UC, UAI', icon: ShieldCheck },
  { año: '2026', evento: 'Más de 500.000 kg de plástico reciclado. Meta: 1M kg en 2027', icon: Recycle },
];

const TEAM = [
  {
    nombre: 'Joaquín Nilo',
    rol: 'Co-founder & CEO',
    desc: 'Ingeniero industrial. Obsesionado con cerrar el ciclo del plástico. Ex-consultor de Supply Chain que apostó por la economía circular cuando nadie lo hacía.',
    initials: 'JN',
    color: '#C0785C',
  },
  {
    nombre: 'Carlos Moscoso',
    rol: 'Co-founder & Head of Sales',
    desc: 'El vendedor de los regalos sostenibles. Convierte cada cotización corporativa en una historia de impacto. Responde WhatsApps más rápido que cualquier bot.',
    initials: 'CM',
    color: '#0F8B6C',
  },
];

const IMPACTO = [
  { valor: '500K+', label: 'kg de plástico reciclado', icon: Recycle, color: '#0F8B6C', bg: 'rgba(15,139,108,.08)' },
  { valor: '50+',   label: 'empresas clientes activas', icon: Users, color: '#C0785C', bg: 'rgba(192,120,92,.08)' },
  { valor: '6',     label: 'inyectoras de producción', icon: Factory, color: '#8BAD8A', bg: 'rgba(139,173,138,.12)' },
  { valor: '10 años', label: 'de garantía por producto', icon: ShieldCheck, color: '#5B7DB1', bg: 'rgba(91,125,177,.08)' },
];

// ── Pill con dot indicator estilo AI platform ────────────────────────────────
function StatusPill({ children, color = '#0F8B6C' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
      style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
      {children}
    </span>
  );
}

export default function Nosotros() {
  const { t } = useTextosPagina('nosotros');
  return (
    <div className="min-h-screen font-inter pb-24 lg:pb-0" style={{ background: '#F8F3ED', color: '#2C1810' }}>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-12 text-center">
        <StatusPill color="#0F8B6C">PEYU · Chile · 2026</StatusPill>

        <h1 className="font-fraunces text-4xl sm:text-5xl lg:text-6xl leading-[0.95] tracking-tight mt-5 mb-5"
          style={{ color: '#2C1810' }}>
          {t('nosotros.hero.linea1', 'Desde una terraza')}<br />
          <em className="not-italic" style={{ color: '#C0785C' }}>{t('nosotros.hero.linea2', 'hasta una fábrica')}</em><br />
          {t('nosotros.hero.linea3', 'con 6 inyectoras.')}
        </h1>

        <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#7A6050' }}>
          {t('nosotros.hero.subtitulo', 'Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile.')}
        </p>

        {/* Ambient glow decoration */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {['🐢 Economía circular', '♻️ Plástico 100%', '🇨🇱 Hecho en Chile'].map(t => (
            <span key={t} className="text-xs font-semibold hidden sm:inline-block" style={{ color: '#A08070' }}>{t}</span>
          ))}
        </div>
      </section>

      {/* ── IMPACTO — cards sofisticadas con icono contenido ──────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center justify-center gap-2 mb-7">
          <CircleDot className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C0785C' }}>Nuestro impacto hasta hoy</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {IMPACTO.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i}
                className="group text-center p-5 sm:p-7 rounded-3xl hover:-translate-y-1.5 transition-all duration-300 cursor-default"
                style={{ background: 'white', border: '1.5px solid #E8DDD0', boxShadow: '0 2px 16px rgba(44,24,16,.05)' }}>
                {/* Icon container: pill circular con fondo tintado */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: item.bg, border: `1.5px solid ${item.color}28` }}>
                  <Icon className="w-5 h-5" style={{ color: item.color }} strokeWidth={1.75} />
                </div>
                <p className="font-fraunces text-3xl sm:text-4xl font-bold leading-none mb-1"
                  style={{ color: item.color }}>{item.valor}</p>
                <p className="text-xs mt-1.5 leading-snug font-medium" style={{ color: '#7A6050' }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── HISTORIA + TIMELINE ───────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center gap-2 mb-1">
          <CircleDot className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#C0785C' }}>La historia</p>
        </div>
        <h2 className="font-fraunces text-3xl sm:text-4xl leading-tight mb-6" style={{ color: '#2C1810' }}>
          Del vertedero{' '}
          <em className="not-italic" style={{ color: '#C0785C' }}>al escritorio.</em>
        </h2>

        <div className="rounded-3xl overflow-hidden" style={{ background: 'white', border: '1.5px solid #E8DDD0', boxShadow: '0 4px 24px rgba(44,24,16,.06)' }}>
          <div className="p-7 md:p-9 space-y-4 text-sm leading-relaxed" style={{ color: '#7A6050', borderBottom: '1px solid #F2EBE0' }}>
            <p>{t('nosotros.historia.parrafo1', 'Todo comenzó en 2019, cuando Joaquín Nilo empezó a fundir botellas plásticas de su barrio en la terraza. El primer prototipo era feo. Pero la idea era perfecta: el plástico que ya existe es la mejor materia prima del mundo.')}</p>
            <p>{t('nosotros.historia.parrafo2', 'Carlos Moscoso se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.')}</p>
          </div>

          {/* Timeline con iconos por hito */}
          <div className="p-6 md:p-8">
            <div className="relative space-y-3">
              {/* Línea vertical */}
              <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: 'linear-gradient(to bottom, #D4C4B0, transparent)' }} />
              {HITOS.map((h, i) => {
                const Icon = h.icon;
                return (
                  <div key={i} className="flex gap-4 relative pl-11">
                    {/* Nodo icono pequeño */}
                    <div className="absolute left-0 w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: i === HITOS.length - 1 ? 'rgba(15,139,108,.12)' : 'rgba(192,120,92,.08)', border: `1.5px solid ${i === HITOS.length - 1 ? '#0F8B6C' : '#D4C4B0'}` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: i === HITOS.length - 1 ? '#0F8B6C' : '#C0785C' }} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 py-1">
                      <span className="text-xs font-bold font-mono tracking-wider" style={{ color: '#C0785C' }}>{h.año}</span>
                      <p className="text-sm mt-0.5 leading-relaxed" style={{ color: '#7A6050' }}>{h.evento}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── EQUIPO ────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CircleDot className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
          <p className="text-xs font-bold tracking-widest uppercase text-center" style={{ color: '#C0785C' }}>El equipo fundador</p>
        </div>
        <h2 className="font-fraunces text-3xl sm:text-4xl leading-tight mb-7 text-center" style={{ color: '#2C1810' }}>
          Las personas{' '}
          <em className="not-italic" style={{ color: '#C0785C' }}>detrás del plástico.</em>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {TEAM.map((p, i) => (
            <div key={i}
              className="p-7 rounded-3xl hover:-translate-y-1 transition-all duration-300 group"
              style={{ background: 'white', border: '1.5px solid #E8DDD0', boxShadow: '0 2px 16px rgba(44,24,16,.05)' }}>
              {/* Avatar tipo plataforma AI — monograma con color firma */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-bold text-lg text-white transition-transform duration-300 group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${p.color}, ${p.color}BB)`, letterSpacing: '-0.02em' }}>
                {p.initials}
              </div>
              <h3 className="font-fraunces text-2xl font-bold mb-0.5" style={{ color: '#2C1810' }}>{p.nombre}</h3>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: p.color }}>{p.rol}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALORES — cards con iconos tintados y borderline de color ──────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CircleDot className="w-3.5 h-3.5" style={{ color: '#C0785C' }} />
          <p className="text-xs font-bold tracking-widest uppercase text-center" style={{ color: '#C0785C' }}>Nuestros valores</p>
        </div>
        <h2 className="font-fraunces text-3xl sm:text-4xl leading-tight mb-7 text-center" style={{ color: '#2C1810' }}>
          Por qué Peyu{' '}
          <em className="not-italic" style={{ color: '#C0785C' }}>importa.</em>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {VALORES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i}
                className="p-6 rounded-3xl hover:-translate-y-1 transition-all duration-300 group"
                style={{ background: 'white', border: `1.5px solid ${v.border}`, boxShadow: '0 2px 16px rgba(44,24,16,.04)' }}>
                {/* Icon con fondo tintado — estilo plataforma inteligente */}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: v.bg, border: `1px solid ${v.border}` }}>
                  <Icon className="w-5 h-5" style={{ color: v.accent }} strokeWidth={1.75} />
                </div>
                <h3 className="font-jakarta font-bold mb-2 text-base" style={{ color: '#2C1810' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#7A6050' }}>{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative rounded-3xl p-10 sm:p-14 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0F8B6C 0%,#0B6E55 50%,#C0785C 100%)', boxShadow: '0 12px 48px rgba(15,139,108,.25)' }}>
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: '#C0785C' }} />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{ background: '#0F8B6C' }} />

          <div className="relative z-10">
            <StatusPill color="rgba(255,255,255,.8)">🐢 Únete a la misión</StatusPill>
            <h2 className="font-fraunces text-3xl sm:text-4xl text-white mt-4 mb-3 leading-tight">¿Te unes a la misión?</h2>
            <p className="text-white/80 text-base mb-8 max-w-lg mx-auto leading-relaxed">
              Cada regalo PEYU es un paso hacia un Chile con menos plástico en el vertedero y más diseño con propósito.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/CatalogoNuevo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'white', color: '#0F8B6C', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
                Ver tienda <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
              <Link to="/EmpresasNuevo"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm text-white transition-all hover:bg-white/15"
                style={{ border: '1.5px solid rgba(255,255,255,.35)' }}>
                Soy empresa <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
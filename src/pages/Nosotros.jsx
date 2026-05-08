import { Leaf, Recycle, Zap, Globe, Heart, Award, Users, Factory } from 'lucide-react';
import PublicSEO from '@/components/PublicSEO';
import PublicHero from '@/components/public/PublicHero';
import PublicSection from '@/components/public/PublicSection';
import PublicCTA from '@/components/public/PublicCTA';

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
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <PublicSEO
        pageKey="nosotros"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'Nosotros', url: 'https://peyuchile.cl/nosotros' },
        ]}
      />

      <PublicHero
        eyebrow="PEYU 2026 · Hecho en Chile"
        align="center"
        title={
          <>
            Desde una terraza<br />
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>hasta una fábrica</span><br />
            con 6 inyectoras.
          </>
        }
        subtitle="Peyu nació de una idea simple: el plástico que botamos puede convertirse en el regalo más bonito de la oficina. Hoy somos la plataforma líder en gifting corporativo sostenible de Chile."
      />

      {/* IMPACTO */}
      <PublicSection eyebrow="Nuestro impacto hasta hoy" title={<>Los <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>números</span> que importan.</>} align="center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMPACTO.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="ld-card p-6 text-center hover:-translate-y-1 transition-all">
                <Icon className="w-7 h-7 mx-auto mb-3" style={{ color: 'var(--ld-action)' }} />
                <p className="ld-display text-3xl text-ld-fg">{item.valor}</p>
                <p className="text-xs text-ld-fg-muted mt-1 leading-snug">{item.label}</p>
              </div>
            );
          })}
        </div>
      </PublicSection>

      {/* HISTORIA + TIMELINE */}
      <PublicSection eyebrow="La historia" title={<>Del vertedero <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>al escritorio.</span></>} max="sm">
        <div className="ld-card p-7 md:p-10 space-y-6">
          <div className="space-y-3 text-ld-fg-soft text-sm leading-relaxed">
            <p>
              Todo comenzó en 2019, cuando Joaquín empezó a fundir botellas plásticas de su barrio en la terraza. El primer prototipo era feo. Pero la idea era perfecta: <strong className="text-ld-fg">el plástico que ya existe es la mejor materia prima del mundo</strong>.
            </p>
            <p>
              Carlos se sumó con su visión comercial: empresas chilenas necesitan regalos corporativos con propósito ESG. Juntos crearon Peyu — la tortuga marina que navega lento pero llega siempre.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-ld-border" />
            <div className="space-y-4">
              {HITOS.map((h, i) => (
                <div key={i} className="flex gap-5 relative pl-10">
                  <div
                    className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
                  >
                    <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--ld-action)' }} />
                  </div>
                  <div className="ld-glass-soft border border-ld-border rounded-2xl p-4 flex-1">
                    <span className="text-xs font-bold font-mono" style={{ color: 'var(--ld-action)' }}>{h.año}</span>
                    <p className="text-sm text-ld-fg-soft mt-0.5">{h.evento}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PublicSection>

      {/* EQUIPO */}
      <PublicSection eyebrow="El equipo fundador" title={<>Las personas <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>detrás del plástico.</span></>} align="center">
        <div className="grid md:grid-cols-2 gap-5">
          {TEAM.map((p, i) => (
            <div key={i} className="ld-card p-7 hover:-translate-y-1 transition-all">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mb-4"
                style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
              >
                {p.emoji}
              </div>
              <h3 className="ld-display text-2xl text-ld-fg">{p.nombre}</h3>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--ld-action)' }}>{p.rol}</p>
              <p className="text-sm text-ld-fg-soft leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      {/* VALORES */}
      <PublicSection eyebrow="Nuestros valores" title={<>Por qué Peyu <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>importa.</span></>} align="center">
        <div className="grid md:grid-cols-2 gap-4">
          {VALORES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="ld-card p-6 hover:-translate-y-1 transition-all">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
                >
                  <Icon className="w-6 h-6" style={{ color: 'var(--ld-action)' }} />
                </div>
                <h3 className="font-bold text-ld-fg mb-2 text-base">{v.title}</h3>
                <p className="text-sm text-ld-fg-soft leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </PublicSection>

      {/* CTA final */}
      <PublicCTA
        eyebrow="🐢 Únete a la misión"
        title="¿Te unes a la misión?"
        highlight="misión?"
        subtitle="Cada regalo PEYU es un paso hacia un Chile con menos plástico en el vertedero y más diseño con propósito."
      />
    </div>
  );
}
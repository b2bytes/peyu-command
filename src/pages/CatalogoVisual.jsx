import { Recycle, Star, Zap, Building2 } from 'lucide-react';
import SocialProductFeed from '@/components/SocialProductFeed';
import PublicSEO from '@/components/PublicSEO';
import PublicHero from '@/components/public/PublicHero';
import PublicCTA from '@/components/public/PublicCTA';

const BADGES = [
  { icon: '♻️', label: '100% Reciclado' },
  { icon: '🌱', label: 'Eco Certificado' },
  { icon: '✨', label: 'Personalizable' },
  { icon: '🏆', label: 'Garantía 10 años' },
];

const STATS = [
  { value: '500K+', label: 'kg plástico reciclado', icon: Recycle },
  { value: '1.200+', label: 'empresas atendidas', icon: Building2 },
  { value: '4.9★', label: 'calificación promedio', icon: Star },
  { value: 'Express', label: 'envío disponible', icon: Zap },
];

export default function CatalogoVisual() {
  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <PublicSEO
        pageKey="catalogoVisual"
        breadcrumbs={[
          { name: 'Inicio', url: 'https://peyuchile.cl/' },
          { name: 'Catálogo Visual', url: 'https://peyuchile.cl/catalogo-visual' },
        ]}
      />

      <PublicHero
        eyebrow="Catálogo Visual"
        align="center"
        title={
          <>
            Regalos corporativos<br />
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>100% sostenibles.</span>
          </>
        }
        subtitle="Plástico 100% reciclado · Personalización láser UV · 10 años de garantía · Fabricación local Chile."
      />

      {/* Badges centrados */}
      <section className="px-4 sm:px-8 pb-6">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {BADGES.map((b, i) => (
            <div key={i} className="ld-glass flex items-center gap-2 rounded-full px-4 py-2">
              <span className="text-base">{b.icon}</span>
              <span className="text-xs font-semibold text-ld-fg">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="ld-card p-5 text-center">
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--ld-action)' }} />
                <p className="ld-display text-2xl text-ld-fg">{s.value}</p>
                <p className="text-xs text-ld-fg-muted mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feed Instagram */}
      <section className="px-4 sm:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="ld-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'var(--ld-action-soft)', boxShadow: 'inset 0 0 0 1px var(--ld-action)' }}
              >
                📷
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="ld-display text-2xl text-ld-fg leading-tight">Feed de productos</h2>
                <p className="text-ld-fg-muted text-xs">Toca una foto para ver el detalle · compra o cotiza B2B</p>
              </div>
            </div>
            <SocialProductFeed />
          </div>
        </div>
      </section>

      <PublicCTA
        eyebrow="Próximo paso"
        title="¿Listo para transformar tu regalo corporativo?"
        highlight="tu regalo corporativo?"
        subtitle="Desde kits pequeños hasta campañas masivas, diseñamos tu propuesta personalizada con mockup incluido."
      />
    </div>
  );
}
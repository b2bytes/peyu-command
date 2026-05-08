import PublicHero from './PublicHero';

/**
 * LegalPage — wrapper Liquid Dual para páginas de texto largo (legal,
 * envíos, cambios, FAQ alternativo). Aplica tipografía editorial Fraunces
 * en H1 y un prose dual day/night para el cuerpo.
 *
 * Props:
 *   eyebrow      string  - kicker uppercase verde acción
 *   title        node    - H1 (puede llevar ld-display-italic)
 *   subtitle     string  - bajada
 *   children     node    - contenido (HTML enriquecido o JSX)
 */
export default function LegalPage({ eyebrow, title, subtitle, children }) {
  return (
    <div className="ld-canvas flex-1 overflow-auto pb-20 lg:pb-0 font-inter">
      <PublicHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <section className="px-4 sm:px-8 pb-14">
        <div className="max-w-3xl mx-auto">
          <div className="ld-card p-6 sm:p-8 md:p-10">
            <article className="ld-prose text-[15px] leading-relaxed text-ld-fg-soft space-y-5">
              {children}
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
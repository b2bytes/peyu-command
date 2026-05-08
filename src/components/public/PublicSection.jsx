/**
 * PublicSection — wrapper section editorial Liquid Dual.
 * Estructura: eyebrow + título Fraunces + subtítulo opcional + children.
 *
 * Props:
 *   eyebrow   string  - kicker en uppercase verde acción
 *   title     node    - título (puede llevar ld-display-italic)
 *   subtitle  string  - bajada opcional
 *   align     'left' | 'center'
 *   max       'sm' | 'md' | 'lg' (max-w del contenedor)
 *   className extra classes para el <section>
 */
const MAX_MAP = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
};

export default function PublicSection({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  max = 'md',
  className = '',
  children,
}) {
  return (
    <section className={`px-4 sm:px-8 py-10 sm:py-14 ${className}`}>
      <div className={`mx-auto ${MAX_MAP[max]}`}>
        {(eyebrow || title || subtitle) && (
          <div
            className={`mb-8 ${align === 'center' ? 'text-center mx-auto max-w-2xl' : ''}`}
          >
            {eyebrow && (
              <p
                className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2"
                style={{ color: 'var(--ld-action)' }}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="ld-display text-3xl sm:text-4xl md:text-5xl text-ld-fg">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-ld-fg-muted text-sm sm:text-base mt-3 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
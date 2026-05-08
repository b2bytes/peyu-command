/**
 * PublicHero — Hero reutilizable Liquid Dual para páginas públicas internas.
 * Usa Fraunces (ld-display) + ld-display-italic para acento, eyebrow en
 * tracking expandido verde acción, y badges de trust opcionales.
 *
 * Props:
 *   eyebrow      string  - kicker pequeño en mayúsculas (verde acción)
 *   title        node    - título principal (puede llevar <span className="ld-display-italic">)
 *   subtitle     string  - bajada opcional
 *   trustBadges  array   - [{ icon: LucideIcon, label, sub }]
 *   align        'left' | 'center' (default 'left')
 *   children     node    - CTAs u otro contenido bajo el hero
 */
export default function PublicHero({
  eyebrow,
  title,
  subtitle,
  trustBadges,
  align = 'left',
  children,
}) {
  const alignClasses =
    align === 'center'
      ? 'text-center mx-auto items-center'
      : 'text-left items-start';

  return (
    <section className="px-4 sm:px-8 pt-8 sm:pt-14 pb-6 sm:pb-10">
      <div className={`max-w-5xl mx-auto flex flex-col gap-4 ${alignClasses}`}>
        {eyebrow && (
          <p
            className="text-[11px] font-bold tracking-[0.22em] uppercase"
            style={{ color: 'var(--ld-action)' }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="ld-display text-4xl sm:text-5xl md:text-6xl text-ld-fg max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-ld-fg-muted text-base sm:text-lg leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-2">{children}</div>}
        {trustBadges?.length > 0 && (
          <div className={`flex gap-2 flex-wrap mt-2 ${align === 'center' ? 'justify-center' : ''}`}>
            {trustBadges.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="ld-glass rounded-full px-3 py-1.5 flex items-center gap-2"
                >
                  {Icon && (
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--ld-action)' }} />
                  )}
                  <div className="leading-tight">
                    <p className="text-[11px] font-bold text-ld-fg">{b.label}</p>
                    {b.sub && <p className="text-[9px] text-ld-fg-muted">{b.sub}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
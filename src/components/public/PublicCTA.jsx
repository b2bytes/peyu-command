import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * PublicCTA — bloque CTA editorial reutilizable Liquid Dual.
 * Aparece al final de cada página pública para conversión.
 */
export default function PublicCTA({
  eyebrow = '¿Listo?',
  title = '¿Listo para regalar con propósito?',
  highlight = 'con propósito?',
  subtitle = 'Cotiza tu pedido B2B en menos de 24 horas o explora la tienda.',
  primary = { label: 'Ver tienda', to: '/shop' },
  secondary = { label: 'Cotizar B2B', to: '/b2b/contacto' },
  whatsapp = true,
}) {
  // Substring match — si el title incluye el highlight, lo wrappeamos en italic.
  const titleNode = highlight && typeof title === 'string' && title.includes(highlight) ? (
    <>
      {title.split(highlight)[0]}
      <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
        {highlight}
      </span>
      {title.split(highlight)[1]}
    </>
  ) : title;

  return (
    <section className="px-4 sm:px-8 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <div className="ld-card relative overflow-hidden p-8 sm:p-12 md:p-14 text-center">
          {/* Glow ambient terracota */}
          <div
            aria-hidden
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-highlight-soft)', opacity: 0.6 }}
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-action-soft)', opacity: 0.7 }}
          />

          <div className="relative z-10">
            {eyebrow && (
              <p
                className="text-[11px] font-bold tracking-[0.22em] uppercase mb-3"
                style={{ color: 'var(--ld-action)' }}
              >
                {eyebrow}
              </p>
            )}
            <h2 className="ld-display text-3xl sm:text-4xl md:text-5xl text-ld-fg leading-tight max-w-3xl mx-auto">
              {titleNode}
            </h2>
            {subtitle && (
              <p className="text-ld-fg-muted text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-7">
              {primary && (
                <Link to={primary.to}>
                  <Button className="ld-btn-primary rounded-full px-7 h-12 text-sm font-semibold gap-2">
                    {primary.label} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              {secondary && (
                <Link to={secondary.to}>
                  <Button className="ld-btn-ghost rounded-full px-7 h-12 text-sm font-semibold text-ld-fg">
                    {secondary.label}
                  </Button>
                </Link>
              )}
              {whatsapp && (
                <a
                  href="https://wa.me/56935040242?text=Hola%20PEYU"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="ld-btn-ghost rounded-full px-5 h-12 text-sm font-semibold text-ld-fg gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
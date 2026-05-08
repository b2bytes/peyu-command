import { Link } from 'react-router-dom';
import { MessageCircle, Mail, MapPin, ArrowRight, Instagram, Linkedin } from 'lucide-react';
import PEYULogo from './PEYULogo';

/**
 * Footer público Liquid Dual — auto-adaptativo día/noche.
 * Estructura: CTA superior + 4 columnas (marca, tienda, empresa, contacto) + barra legal.
 */
export default function PublicFooter() {
  return (
    <footer className="ld-canvas pt-12 pb-24 lg:pb-12 px-5 border-t border-ld-border">
      {/* CTA superior conversión */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="ld-card relative overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--ld-action-soft)', opacity: 0.7 }}
          />
          <div className="relative z-10">
            <p
              className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1"
              style={{ color: 'var(--ld-action)' }}
            >
              ¿Listo?
            </p>
            <h3 className="ld-display text-2xl md:text-3xl text-ld-fg leading-tight">
              Regala con{' '}
              <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
                propósito.
              </span>
            </h3>
            <p className="text-sm text-ld-fg-muted mt-2">
              Cotiza tu pedido corporativo en menos de 24 horas.
            </p>
          </div>
          <div className="relative z-10 flex gap-2 flex-wrap">
            <Link
              to="/b2b/contacto"
              className="ld-btn-primary inline-flex items-center gap-1.5 font-semibold text-sm px-5 py-2.5 rounded-full text-white"
            >
              Cotizar B2B <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/56935040242?text=Hola%20PEYU%2C%20me%20interesa%20cotizar"
              target="_blank"
              rel="noreferrer"
              className="ld-btn-ghost inline-flex items-center gap-1.5 font-semibold text-sm px-5 py-2.5 rounded-full text-ld-fg"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
        {/* Marca */}
        <div>
          <PEYULogo size="md" />
          <p className="text-ld-fg-muted text-sm leading-relaxed mt-4 max-w-xs">
            Regalos corporativos 100% sostenibles con personalización láser UV. Fabricados en Santiago con plástico reciclado.
          </p>
          <div className="flex gap-2 mt-5">
            <a
              href="https://wa.me/56935040242"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-full ld-glass-soft flex items-center justify-center text-ld-fg-soft hover:text-ld-fg transition"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/peyu.chile"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full ld-glass-soft flex items-center justify-center text-ld-fg-soft hover:text-ld-fg transition"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com/company/peyuchile"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full ld-glass-soft flex items-center justify-center text-ld-fg-soft hover:text-ld-fg transition"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <FooterColumn title="Tienda" links={[
          ['Todos los productos', '/shop'],
          ['Catálogo visual', '/catalogo-visual'],
          ['Personalizar producto', '/personalizar'],
          ['Gift Cards', '/regalar-giftcard'],
          ['Seguimiento de pedido', '/seguimiento'],
        ]} />

        <FooterColumn title="Empresa" links={[
          ['Catálogo B2B', '/b2b/catalogo'],
          ['Solicitar cotización', '/b2b/contacto'],
          ['Quiénes somos', '/nosotros'],
          ['Blog', '/blog'],
          ['Preguntas frecuentes', '/faq'],
        ]} />

        {/* Contacto */}
        <div>
          <h4
            className="font-bold mb-4 text-[11px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--ld-action)' }}
          >
            Contacto
          </h4>
          <ul className="space-y-2.5 text-sm text-ld-fg-soft">
            <li>
              <a href="https://wa.me/56935040242?text=Hola%20PEYU" target="_blank" rel="noreferrer" className="hover:text-ld-fg flex items-center gap-2 transition">
                <MessageCircle className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> +56 9 3504 0242
              </a>
            </li>
            <li>
              <a href="mailto:ventas@peyuchile.cl" className="hover:text-ld-fg flex items-center gap-2 transition">
                <Mail className="w-4 h-4" style={{ color: 'var(--ld-action)' }} /> ventas@peyuchile.cl
              </a>
            </li>
            <li className="flex items-start gap-2 text-ld-fg-muted">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--ld-highlight)' }} />
              <span>F. Bilbao 3775, Providencia<br />P. Valdivia 6603, Macul</span>
            </li>
            <li className="pt-2">
              <Link to="/contacto" className="font-semibold inline-flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--ld-action)' }}>
                Ver todos los canales <ArrowRight className="w-3 h-3" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Barra legal */}
      <div className="max-w-7xl mx-auto border-t border-ld-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ld-fg-muted">
        <p>© 2026 PEYU Chile SpA · Todos los derechos reservados</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/terminos" className="hover:text-ld-fg transition">Términos</Link>
          <Link to="/privacidad" className="hover:text-ld-fg transition">Privacidad</Link>
          <Link to="/cookies" className="hover:text-ld-fg transition">Cookies</Link>
          <Link to="/envios" className="hover:text-ld-fg transition">Envíos</Link>
          <Link to="/cambios" className="hover:text-ld-fg transition">Cambios</Link>
          <Link to="/contacto" className="hover:text-ld-fg transition">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4
        className="font-bold mb-4 text-[11px] uppercase tracking-[0.22em]"
        style={{ color: 'var(--ld-action)' }}
      >
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm text-ld-fg-soft">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link to={href} className="hover:text-ld-fg transition">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
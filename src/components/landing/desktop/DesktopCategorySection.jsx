import { Link } from 'react-router-dom';
import { Home, Briefcase, Building2, Gift, ArrowUpRight } from 'lucide-react';

/**
 * Categorías Liquid Dual — tiles editoriales sobrios estilo Apple/Linear.
 * Sin gradientes saturados; usa cards de vidrio + acento verde firma.
 */
const CATEGORIES = [
  { label: 'Hogar',    desc: 'Para tu casa',          to: '/shop?categoria=Hogar',      icon: Home,       items: '12+ productos' },
  { label: 'Oficina',  desc: 'Escritorio · Trabajo',  to: '/shop?categoria=Escritorio', icon: Briefcase,  items: '15+ productos' },
  { label: 'Empresas', desc: 'Regalos B2B',           to: '/b2b/catalogo',              icon: Building2,  items: 'Catálogo corporativo' },
  { label: 'Gift Card',desc: 'El regalo perfecto',    to: '/regalar-giftcard',          icon: Gift,       items: 'Desde $10.000' },
];

export default function DesktopCategorySection() {
  return (
    <section className="px-6 py-12">
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2" style={{ color: 'var(--ld-action)' }}>
            Categorías
          </p>
          <h2 className="ld-display text-4xl xl:text-5xl text-ld-fg">
            ¿Qué buscas <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>hoy?</span>
          </h2>
        </div>
        <Link
          to="/shop"
          className="text-sm font-semibold flex items-center gap-1 transition hover:opacity-80"
          style={{ color: 'var(--ld-action)' }}
        >
          Ver todo <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="ld-card group relative overflow-hidden aspect-[1.05/1] p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--ld-action-soft)', color: 'var(--ld-action)' }}
              >
                <Icon className="w-5 h-5" strokeWidth={1.6} />
              </div>
              <div>
                <p className="ld-display text-3xl text-ld-fg leading-none mb-1">{cat.label}</p>
                <p className="text-sm font-medium text-ld-fg-soft mt-1">{cat.desc}</p>
                <p className="text-[11px] font-semibold mt-2 text-ld-fg-muted">{cat.items}</p>
              </div>
              {/* Hover accent */}
              <div
                className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition"
                style={{ background: 'var(--ld-action)' }}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
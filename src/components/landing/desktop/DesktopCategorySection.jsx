import { Link } from 'react-router-dom';
import { ArrowUpRight, Home, Briefcase, Building2, Gift } from 'lucide-react';

/**
 * Categorías Liquid Dual — tiles editoriales con imagen + icon chip.
 * Imágenes reales de Unsplash (regalos, oficinas, casas, gift cards).
 * Card más alta (aspect 4:5) para dar protagonismo a la imagen, con
 * overlay degradado para legibilidad del título sobre la foto.
 */
const CATEGORIES = [
  {
    label: 'Hogar',
    tagline: 'Calidez para tu casa',
    items: '12+ productos',
    to: '/shop?categoria=Hogar',
    icon: Home,
    image:
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Oficina',
    tagline: 'Escritorio · Trabajo',
    items: '15+ productos',
    to: '/shop?categoria=Escritorio',
    icon: Briefcase,
    image:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Empresas',
    tagline: 'Regalos B2B personalizados',
    items: 'Catálogo corporativo',
    to: '/b2b/catalogo',
    icon: Building2,
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Gift Card',
    tagline: 'El regalo perfecto',
    items: 'Desde $10.000',
    to: '/regalar-giftcard',
    icon: Gift,
    image:
      'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=80',
  },
];

export default function DesktopCategorySection() {
  return (
    <section className="px-6 py-14">
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p
            className="text-[11px] font-bold tracking-[0.22em] uppercase mb-2"
            style={{ color: 'var(--ld-action)' }}
          >
            Categorías
          </p>
          <h2 className="ld-display text-4xl xl:text-5xl text-ld-fg">
            ¿Qué buscas{' '}
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
              hoy?
            </span>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="ld-card group relative overflow-hidden aspect-[4/5] flex flex-col justify-end transition-all duration-500 hover:-translate-y-1.5"
            >
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url("${cat.image}")` }}
              />
              {/* Overlay legibilidad — gradient negro->transparente arriba */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

              {/* Icon chip top-left */}
              <div
                className="absolute top-4 left-4 w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md ring-1 ring-white/30"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
              </div>

              {/* Arrow chip top-right (aparece en hover) */}
              <div
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-1 group-hover:translate-y-0"
                style={{ background: 'var(--ld-action)' }}
              >
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>

              {/* Bottom content */}
              <div className="relative z-10 p-5 text-white">
                <p className="ld-display text-3xl xl:text-4xl leading-none mb-1.5 drop-shadow-lg">
                  {cat.label}
                </p>
                <p className="text-sm font-medium text-white/90 drop-shadow">{cat.tagline}</p>
                <p className="text-[11px] font-semibold mt-2 text-white/70 uppercase tracking-wider">
                  {cat.items}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
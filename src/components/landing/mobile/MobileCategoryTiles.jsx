import { Link } from 'react-router-dom';
import { Home, Briefcase, Building2, Gift, ArrowUpRight } from 'lucide-react';

/**
 * Categorías mobile Liquid Dual — tiles editoriales con imagen real.
 * Mantiene el lenguaje del desktop (foto + icon chip glass + Fraunces)
 * adaptado a 2x2 mobile.
 */
const CATEGORIES = [
  {
    label: 'Hogar',
    desc: 'Calidez para tu casa',
    icon: Home,
    to: '/shop?categoria=Hogar',
    image:
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=600&q=70',
  },
  {
    label: 'Oficina',
    desc: 'Escritorio · Trabajo',
    icon: Briefcase,
    to: '/shop?categoria=Escritorio',
    image:
      'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=600&q=70',
  },
  {
    label: 'Empresas',
    desc: 'Regalos B2B',
    icon: Building2,
    to: '/b2b/catalogo',
    image:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=70',
  },
  {
    label: 'Gift Card',
    desc: 'El regalo perfecto',
    icon: Gift,
    to: '/regalar-giftcard',
    image:
      'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=600&q=70',
  },
];

export default function MobileCategoryTiles() {
  return (
    <section className="px-4 pb-5">
      <div className="flex items-end justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1"
            style={{ color: 'var(--ld-action)' }}
          >
            Categorías
          </p>
          <h2 className="ld-display text-2xl text-ld-fg leading-none">
            ¿Qué buscas{' '}
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>
              hoy?
            </span>
          </h2>
        </div>
        <Link
          to="/shop"
          className="text-[11px] font-semibold flex items-center gap-0.5 flex-shrink-0"
          style={{ color: 'var(--ld-action)' }}
        >
          Ver todo <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="ld-card relative overflow-hidden aspect-[1.05/1] flex flex-col justify-end active:scale-95 transition-transform"
            >
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${cat.image}")` }}
              />
              {/* Overlay legibilidad */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />

              {/* Icon chip top-left glass */}
              <div
                className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md ring-1 ring-white/30"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <Icon className="w-4 h-4 text-white" strokeWidth={2} />
              </div>

              {/* Bottom content */}
              <div className="relative z-10 p-3 text-white">
                <p className="ld-display text-xl leading-none mb-0.5 drop-shadow-lg">
                  {cat.label}
                </p>
                <p className="text-[10px] font-medium text-white/85 drop-shadow leading-tight">
                  {cat.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
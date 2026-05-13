import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Home, Briefcase, Building2, Gift } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Categorías Liquid Dual — tiles editoriales con productos REALES PEYU.
 * Carga dinámicamente la imagen de un producto representativo de cada
 * categoría desde la BD. Si no encuentra, usa fallback Unsplash.
 */
const CATEGORY_CONFIG = [
  {
    label: 'Hogar',
    tagline: 'Calidez para tu casa',
    to: '/shop?categoria=Hogar',
    icon: Home,
    queryCategoria: 'Hogar',
    fallbackImage:
      'https://media.base44.com/images/public/69d99b9d61f699701129c103/09fc39248_generated_image.png',
  },
  {
    label: 'Oficina',
    tagline: 'Escritorio · Trabajo',
    to: '/shop?categoria=Escritorio',
    icon: Briefcase,
    queryCategoria: 'Escritorio',
    fallbackImage:
      'https://media.base44.com/images/public/69d99b9d61f699701129c103/74c9c31ab_generated_image.png',
  },
  {
    label: 'Empresas',
    tagline: 'Regalos B2B personalizados',
    to: '/b2b/catalogo',
    icon: Building2,
    queryCategoria: 'Corporativo',
    fallbackImage:
      'https://media.base44.com/images/public/69d99b9d61f699701129c103/21d776343_generated_image.png',
  },
  {
    label: 'Gift Card',
    tagline: 'El regalo perfecto',
    to: '/regalar-giftcard',
    icon: Gift,
    queryCategoria: null, // Gift card no tiene categoría de producto
    fallbackImage:
      'https://media.base44.com/images/public/69d99b9d61f699701129c103/c97d667e5_generated_image.png',
  },
];

export default function DesktopCategorySection() {
  const [categories, setCategories] = useState(
    CATEGORY_CONFIG.map((c) => ({ ...c, image: c.fallbackImage, count: null }))
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await base44.entities.Producto.filter({ activo: true }, '-stock_actual', 200);
        if (!alive) return;
        const enriched = CATEGORY_CONFIG.map((cfg) => {
          if (!cfg.queryCategoria) {
            return { ...cfg, image: cfg.fallbackImage, count: null };
          }
          const matches = all.filter((p) => p.categoria === cfg.queryCategoria);
          const withImg = matches.find(
            (p) => p.imagen_promo_url || (p.galeria_urls && p.galeria_urls[0]) || p.imagen_url
          );
          const image =
            withImg?.imagen_promo_url ||
            withImg?.galeria_urls?.[0] ||
            withImg?.imagen_url ||
            cfg.fallbackImage;
          return { ...cfg, image, count: matches.length };
        });
        setCategories(enriched);
      } catch (err) {
        // Network error u otro fallo no debe tumbar la landing — quedan los fallbacks
        if (alive) console.warn('DesktopCategorySection: usando fallbacks', err?.message || err);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

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
        {categories.map((cat) => {
          const Icon = cat.icon;
          const itemsLabel =
            cat.queryCategoria
              ? cat.count != null
                ? `${cat.count}+ productos`
                : 'Ver catálogo'
              : 'Desde $10.000';
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="ld-card group relative overflow-hidden aspect-[4/5] flex flex-col justify-end transition-all duration-500 hover:-translate-y-1.5"
            >
              {/* Imagen de fondo (producto real PEYU) */}
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
                  {itemsLabel}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
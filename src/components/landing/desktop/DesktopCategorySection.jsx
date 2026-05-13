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
    <section className="px-6 py-16">
      <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
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
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const itemsLabel =
            cat.queryCategoria
              ? cat.count != null
                ? `${cat.count} productos`
                : 'Ver catálogo'
              : 'Desde $10.000';
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-ld-bg-elevated border border-ld-border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-ld-action/30"
              style={{ animation: `peyuCardIn 0.5s cubic-bezier(0.22,1,0.36,1) ${idx * 80}ms backwards` }}
            >
              {/* ── Zona imagen — limpia, sin overlay invasivo ── */}
              <div className="relative aspect-[4/5] overflow-hidden bg-ld-bg-soft">
                <img
                  src={cat.image}
                  alt={cat.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Vignette muy sutil solo en esquinas para dar profundidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                {/* Icon chip flotante top-left — glass blanco */}
                <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl flex items-center justify-center bg-white/90 backdrop-blur-md shadow-lg ring-1 ring-white/60">
                  <Icon className="w-5 h-5" strokeWidth={2} style={{ color: 'var(--ld-action)' }} />
                </div>

                {/* Count badge top-right */}
                {cat.count != null && cat.count > 0 && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-md text-[11px] font-bold text-ld-fg">
                    {cat.count}
                  </div>
                )}

                {/* Arrow CTA — slide-in en hover */}
                <div
                  className="absolute bottom-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-400"
                  style={{ background: 'var(--ld-action)' }}
                >
                  <ArrowUpRight className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* ── Zona contenido editorial — sobre fondo neutro ── */}
              <div className="px-5 py-4 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <p className="ld-display text-2xl xl:text-3xl leading-none text-ld-fg mb-1.5">
                    {cat.label}
                  </p>
                  <p className="text-sm text-ld-fg-muted leading-snug">{cat.tagline}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-ld-border">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: 'var(--ld-action)' }}
                  >
                    {itemsLabel}
                  </span>
                  <ArrowUpRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: 'var(--ld-action)' }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
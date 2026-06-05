import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Smartphone, Home, Gamepad2, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';

/**
 * Categorías Liquid Dual — tiles editoriales con FOTOS REALES del catálogo.
 * Cada tarjeta usa la imagen real de un SKU representativo (cargado de la BD),
 * con SKUs de respaldo si el principal no existe. Enlaza a /shop?categoria=...
 * Categorías oficiales: Carcasas · Hogar · Entretenimiento · Escritorio.
 */
const CATEGORY_CONFIG = [
  {
    label: 'Carcasas',
    tagline: 'Funda con tu estilo',
    to: '/shop?categoria=Carcasas%20B2C',
    icon: Smartphone,
    queryCategoria: 'Carcasas B2C',
    skus: ['17175', 'CARC-IP13'],
  },
  {
    label: 'Hogar',
    tagline: 'Calidez para tu casa',
    to: '/shop?categoria=Hogar',
    icon: Home,
    queryCategoria: 'Hogar',
    skus: ['31686', '31679'],
  },
  {
    label: 'Entretenimiento',
    tagline: 'Cachos y juegos',
    to: '/shop?categoria=Entretenimiento',
    icon: Gamepad2,
    queryCategoria: 'Entretenimiento',
    skus: ['51559', '61411'],
  },
  {
    label: 'Escritorio',
    tagline: 'Orden con propósito',
    to: '/shop?categoria=Escritorio',
    icon: Briefcase,
    queryCategoria: 'Escritorio',
    skus: ['HOG-SOPC', 'HOG-PACK-ESC'],
  },
];

export default function DesktopCategorySection() {
  // Imagen REAL por categoría: se resuelve desde la BD buscando el SKU
  // representativo de cada tarjeta (con respaldos). El contador también.
  const [categories, setCategories] = useState(
    CATEGORY_CONFIG.map((c) => ({ ...c, count: null, image: null }))
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await base44.entities.Producto.filter({ activo: true }, '-stock_actual', 300);
        if (!alive) return;
        const enriched = CATEGORY_CONFIG.map((cfg) => {
          const matches = all.filter((p) => p.categoria === cfg.queryCategoria);
          // Busca el primer SKU representativo disponible; si no, el primer
          // producto de la categoría con imagen. Siempre foto REAL del catálogo.
          let prod = null;
          for (const sku of cfg.skus) {
            prod = all.find((p) => p.sku === sku);
            if (prod) break;
          }
          if (!prod) prod = matches[0];
          return {
            ...cfg,
            count: matches.length,
            image: prod ? getProductImage(prod) : getProductImage({ categoria: cfg.queryCategoria }),
          };
        });
        setCategories(enriched);
      } catch (err) {
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
          const itemsLabel = cat.count != null ? `${cat.count} productos` : 'Ver catálogo';
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-ld-bg-elevated border border-ld-border transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-ld-action/30"
              style={{ animation: `peyuCardIn 0.5s cubic-bezier(0.22,1,0.36,1) ${idx * 80}ms backwards` }}
            >
              {/* ── Zona imagen — limpia, sin overlay invasivo ── */}
              <div className="relative aspect-[4/5] overflow-hidden bg-ld-bg-soft">
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.label}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
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
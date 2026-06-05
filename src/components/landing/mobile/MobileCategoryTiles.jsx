import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Home, Gamepad2, Briefcase, ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';

/**
 * Categorías mobile Liquid Dual — tiles editoriales con FOTOS REALES del
 * catálogo (cargadas desde la BD por SKU representativo). 2x2.
 * Categorías oficiales: Carcasas · Hogar · Entretenimiento · Escritorio.
 */
const CATEGORIES = [
  { label: 'Carcasas', desc: 'Funda con tu estilo', icon: Smartphone, to: '/shop?categoria=Carcasas%20B2C', queryCategoria: 'Carcasas B2C', skus: ['17175', 'CARC-IP13'] },
  { label: 'Hogar', desc: 'Calidez para tu casa', icon: Home, to: '/shop?categoria=Hogar', queryCategoria: 'Hogar', skus: ['31686', '31679'] },
  { label: 'Entretenimiento', desc: 'Cachos y juegos', icon: Gamepad2, to: '/shop?categoria=Entretenimiento', queryCategoria: 'Entretenimiento', skus: ['51559', '61411'] },
  { label: 'Escritorio', desc: 'Orden con propósito', icon: Briefcase, to: '/shop?categoria=Escritorio', queryCategoria: 'Escritorio', skus: ['HOG-SOPC', 'HOG-PACK-ESC'] },
];

export default function MobileCategoryTiles() {
  const [cats, setCats] = useState(CATEGORIES.map((c) => ({ ...c, image: null })));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all = await base44.entities.Producto.filter({ activo: true }, '-stock_actual', 300);
        if (!alive) return;
        setCats(CATEGORIES.map((cfg) => {
          let prod = null;
          for (const sku of cfg.skus) { prod = all.find((p) => p.sku === sku); if (prod) break; }
          if (!prod) prod = all.find((p) => p.categoria === cfg.queryCategoria);
          return { ...cfg, image: prod ? getProductImage(prod) : getProductImage({ categoria: cfg.queryCategoria }) };
        }));
      } catch { /* fallback: sin imagen */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section className="px-4 pb-5">
      <div className="flex items-end justify-between mb-3 gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: 'var(--ld-action)' }}>
            Categorías
          </p>
          <h2 className="ld-display text-2xl text-ld-fg leading-none">
            ¿Qué buscas{' '}
            <span className="ld-display-italic" style={{ color: 'var(--ld-highlight)' }}>hoy?</span>
          </h2>
        </div>
        <Link to="/shop" className="text-[11px] font-semibold flex items-center gap-0.5 flex-shrink-0" style={{ color: 'var(--ld-action)' }}>
          Ver todo <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {cats.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              to={cat.to}
              className="ld-card relative overflow-hidden aspect-[1.05/1] flex flex-col justify-end active:scale-95 transition-transform"
            >
              {cat.image && (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${cat.image}")` }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/15" />
              <div
                className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md ring-1 ring-white/30"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <Icon className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <div className="relative z-10 p-3 text-white">
                <p className="ld-display text-xl leading-none mb-0.5 drop-shadow-lg">{cat.label}</p>
                <p className="text-[10px] font-medium text-white/85 drop-shadow leading-tight">{cat.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
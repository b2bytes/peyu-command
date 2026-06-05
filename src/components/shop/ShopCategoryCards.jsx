import { useEffect, useState } from 'react';
import { Smartphone, Home, Gamepad2, Briefcase, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';

/**
 * 4 tarjetas de categoría con FOTO REAL del catálogo, visibles al inicio del
 * catálogo /shop. Click → filtra la categoría (vía onSelect, sin recargar).
 * Categorías oficiales pedidas: Carcasas · Hogar · Entretenimiento · Escritorio.
 */
const CATS = [
  { label: 'Carcasas', cat: 'Carcasas B2C', icon: Smartphone, skus: ['17175', 'CARC-IP13'] },
  { label: 'Hogar', cat: 'Hogar', icon: Home, skus: ['31686', '31679'] },
  { label: 'Entretenimiento', cat: 'Entretenimiento', icon: Gamepad2, skus: ['51559', '61411'] },
  { label: 'Escritorio', cat: 'Escritorio', icon: Briefcase, skus: ['HOG-SOPC', 'HOG-PACK-ESC'] },
];

export default function ShopCategoryCards({ productos = [], onSelect }) {
  const [imgs, setImgs] = useState({});

  useEffect(() => {
    if (!productos || productos.length === 0) return;
    const next = {};
    for (const c of CATS) {
      let prod = null;
      for (const sku of c.skus) { prod = productos.find((p) => p.sku === sku); if (prod) break; }
      if (!prod) prod = productos.find((p) => p.categoria === c.cat);
      next[c.cat] = prod ? getProductImage(prod) : getProductImage({ categoria: c.cat });
    }
    setImgs(next);
  }, [productos]);

  return (
    <div className="mb-5 sm:mb-6">
      <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: 'var(--ld-action)' }}>
        Explora por categoría
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {CATS.map((c) => {
          const Icon = c.icon;
          const count = productos.filter((p) => p.categoria === c.cat).length;
          return (
            <button
              key={c.cat}
              onClick={() => onSelect?.(c.cat)}
              className="group ld-card relative overflow-hidden text-left active:scale-[0.98] transition-transform"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-ld-bg-soft">
                {imgs[c.cat] && (
                  <img
                    src={imgs[c.cat]}
                    alt={c.label}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div
                  className="absolute top-2.5 left-2.5 w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-md ring-1 ring-white/30"
                  style={{ background: 'rgba(255,255,255,0.2)' }}
                >
                  <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                  <div className="min-w-0">
                    <p className="ld-display text-lg sm:text-xl leading-none drop-shadow-lg">{c.label}</p>
                    {count > 0 && <p className="text-[10px] font-semibold text-white/85 drop-shadow mt-0.5">{count} productos</p>}
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
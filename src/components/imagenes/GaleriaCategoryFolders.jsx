// ============================================================================
// GaleriaCategoryFolders — Vista "carpetas" cuando NO hay categoría seleccionada.
// Muestra una tarjeta por categoría con preview de 6 thumbnails y conteo.
// Click → entra a esa categoría.
// ============================================================================
import { ChevronRight, Folder } from 'lucide-react';

const CATEGORY_ORDER = ['Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo', 'Carcasas B2C'];

export default function GaleriaCategoryFolders({ images, onPick }) {
  // Agrupar imágenes por categoría
  const grouped = images.reduce((acc, img) => {
    const cat = img.producto_categoria || 'Sin categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(img);
    return acc;
  }, {});

  const categorias = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  if (categorias.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {categorias.map(cat => {
        const imgs = grouped[cat];
        const previews = imgs.slice(0, 6);
        const productosUnicos = new Set(imgs.map(i => i.producto_id)).size;
        return (
          <button
            key={cat}
            onClick={() => onPick(cat)}
            className="text-left bg-white/5 border border-white/10 rounded-xl p-3 hover:border-cyan-400/40 hover:bg-white/[0.07] transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                  <Folder className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{cat}</p>
                  <p className="text-white/50 text-[11px]">
                    {imgs.length} imagen{imgs.length !== 1 ? 'es' : ''} · {productosUnicos} producto{productosUnicos !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>

            <div className="grid grid-cols-3 gap-1">
              {previews.map((img, idx) => (
                <div key={`${img.producto_id}-${idx}`} className="aspect-square rounded-md bg-white/5 overflow-hidden">
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.opacity = '0.2'; }}
                  />
                </div>
              ))}
              {previews.length < 6 && Array.from({ length: 6 - previews.length }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square rounded-md bg-white/[0.03]" />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
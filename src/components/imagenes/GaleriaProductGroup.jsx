// ============================================================================
// GaleriaProductGroup — Sub-carpeta de un producto dentro de una categoría.
// Colapsable, muestra primeras N imágenes y permite expandir todo.
// ============================================================================
import { useState } from 'react';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import GaleriaMaestraCard from './GaleriaMaestraCard';

export default function GaleriaProductGroup({ producto_id, producto_nombre, producto_sku, images, onUpdated, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-white/50 flex-shrink-0" />}
          <Package className="w-4 h-4 text-cyan-300 flex-shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-white text-sm font-medium truncate">{producto_nombre || 'Sin nombre'}</p>
            {producto_sku && <p className="text-white/40 text-[10px] uppercase tracking-wider">{producto_sku}</p>}
          </div>
        </div>
        <span className="text-[11px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full flex-shrink-0">
          {images.length}
        </span>
      </button>

      {open && (
        <div className="p-3 pt-0 border-t border-white/5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-3">
            {images.map(img => (
              <GaleriaMaestraCard key={`${img.producto_id}-${img.url}`} image={img} onUpdated={onUpdated} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
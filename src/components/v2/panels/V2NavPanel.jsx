import { Link } from 'react-router-dom';
import { Store, Building2, Heart, Leaf, Layers, X } from 'lucide-react';
import { V2_CATEGORIES, V2_CATEGORY_ICON, V2_PRICE_RANGES } from '@/lib/v2-catalog';

// Panel izquierdo cockpit: navegación de categorías + filtros rápidos + accesos.
// Reutilizado en desktop (fijo) y en drawer móvil.
export default function V2NavPanel({
  perfil, activeCat, onCatClick,
  material, onMaterialChange,
  priceRange, onPriceChange,
  onLink, onClose,
}) {
  return (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--v2-border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--v2-fg)' }}>Explorar</span>
          <button onClick={onClose} className="v2-btn-ghost w-8 h-8 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto v2-scroll px-3 py-4 flex flex-col gap-5">
        {/* Categorías */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--v2-fg-subtle)' }}>Categorías</p>
          <div className="flex flex-col gap-1">
            <button onClick={() => onCatClick(null)} data-active={!activeCat} className="v2-nav-item px-3 h-9 text-xs">
              <Layers className="w-4 h-4" /> Todas
            </button>
            {V2_CATEGORIES.map((c) => (
              <button key={c} onClick={() => onCatClick(c)} data-active={activeCat === c} className="v2-nav-item px-3 h-9 text-xs">
                <span className="text-sm leading-none">{V2_CATEGORY_ICON[c]}</span> {c}
              </button>
            ))}
          </div>
        </div>

        {/* Material */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--v2-fg-subtle)' }}>Material</p>
          <div className="flex flex-wrap gap-1.5">
            {['Todos', 'Plástico reciclado', 'Fibra de trigo'].map((m) => (
              <button key={m} onClick={() => onMaterialChange(m)} data-active={material === m} className="v2-chip px-2.5 py-1.5 text-[10px]">
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Rango de precio (solo tiene sentido en B2C) */}
        {perfil !== 'b2b' && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--v2-fg-subtle)' }}>Precio</p>
            <div className="flex flex-col gap-1">
              {V2_PRICE_RANGES.map((r) => (
                <button key={r.id} onClick={() => onPriceChange(r.id)} data-active={priceRange === r.id} className="v2-nav-item px-3 h-8 text-[11px]">
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Accesos */}
        <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--v2-border)' }}>
          <button onClick={() => onLink('/shop')} className="v2-nav-item px-3 h-9 text-xs"><Store className="w-4 h-4" /> Tienda</button>
          <button onClick={() => onLink('b2b')} className="v2-nav-item px-3 h-9 text-xs"><Building2 className="w-4 h-4" /> Empresa / B2B</button>
          <Link to="/nosotros" className="v2-nav-item px-3 h-9 text-xs"><Heart className="w-4 h-4" /> Nosotros</Link>
          <div className="v2-badge-eco flex items-center gap-1.5 px-3 py-2 mt-3 text-[10px] font-semibold">
            <Leaf className="w-3 h-3" /> Plástico 100% reciclado chileno
          </div>
        </div>
      </div>
    </div>
  );
}
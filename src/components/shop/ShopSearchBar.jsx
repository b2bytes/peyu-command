import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';
import { suggestProductos } from '@/lib/product-search';

/**
 * Buscador del catálogo PEYU — estética Warm (Liquid Dual).
 * • Debounce (180ms) para no filtrar en cada tecla.
 * • Sugerencias en vivo bajo el input (producto + foto + precio).
 * • Busca por nombre, SKU, categoría y modelo de teléfono (tolerante a typos/acentos).
 *
 * Props:
 *  - value / onChange: texto del buscador (controlado por el padre).
 *  - productos: catálogo completo para generar sugerencias.
 */
export default function ShopSearchBar({ value, onChange, productos = [] }) {
  const [local, setLocal] = useState(value || '');
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  // Sync externo → local (ej. limpiar filtros)
  useEffect(() => { setLocal(value || ''); }, [value]);

  // Debounce: propaga el término al padre 180ms después de dejar de escribir.
  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 180);
    return () => clearTimeout(id);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar sugerencias al hacer click fuera.
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const sugerencias = useMemo(
    () => (local.trim().length >= 2 ? suggestProductos(productos, local, 6) : []),
    [local, productos]
  );

  const showSuggest = focused && local.trim().length >= 2 && sugerencias.length > 0;

  return (
    <div ref={wrapRef} className="relative max-w-xl">
      <div className="ld-input flex items-center gap-2 px-3.5 py-2.5 rounded-full">
        <Search className="w-4 h-4 text-ld-fg-muted flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o modelo (ej: iphone 15)…"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={() => setFocused(true)}
          className="bg-transparent border-0 text-ld-fg placeholder:text-ld-fg-subtle focus:ring-0 focus:outline-none text-sm w-full"
        />
        {local && (
          <button onClick={() => { setLocal(''); onChange(''); }} className="text-ld-fg-muted hover:text-ld-fg" aria-label="Limpiar búsqueda">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sugerencias en vivo */}
      {showSuggest && (
        <div className="absolute z-30 mt-2 left-0 right-0 ld-glass-strong rounded-2xl border border-ld-border shadow-2xl overflow-hidden">
          <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-ld-fg-muted">Sugerencias</p>
          <ul className="max-h-80 overflow-y-auto peyu-scrollbar pb-1">
            {sugerencias.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/producto/${p.id}`}
                  onClick={() => setFocused(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-ld-bg-soft transition-colors"
                >
                  <img
                    src={getProductImage(p)}
                    alt={p.nombre}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-ld-border bg-white"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ld-fg truncate leading-tight">{p.nombre}</p>
                    <p className="text-[11px] text-ld-fg-muted">{p.categoria} · {p.sku}</p>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--ld-action)' }}>
                    ${(p.precio_b2c || 0).toLocaleString('es-CL')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
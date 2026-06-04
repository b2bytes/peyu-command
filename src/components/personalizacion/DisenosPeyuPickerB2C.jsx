import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Palette } from 'lucide-react';

// ============================================================================
// DisenosPeyuPickerB2C — Galería de diseños PEYU para la ficha B2C.
// ----------------------------------------------------------------------------
// Misma fuente de datos que DisenosPeyuPicker (entidad DisenoPeyu), pero con la
// estética clara Warm Dusk (--ld-*) para encajar en el bloque de personalización
// de la ficha de producto. Al elegir, devuelve la imagen_url vía onSelect.
// ============================================================================
export default function DisenosPeyuPickerB2C({ selectedUrl, onSelect }) {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catActiva, setCatActiva] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.entities.DisenoPeyu.filter({ activo: true }, 'orden', 100)
      .then(d => { if (alive) setDisenos(d || []); })
      .catch(() => { if (alive) setDisenos([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const categorias = useMemo(() => {
    const seen = [];
    for (const d of disenos) {
      const c = d.categoria || 'Otro';
      if (!seen.includes(c)) seen.push(c);
    }
    return seen;
  }, [disenos]);

  useEffect(() => {
    if (categorias.length && (!catActiva || !categorias.includes(catActiva))) {
      setCatActiva(categorias[0]);
    }
  }, [categorias]); // eslint-disable-line

  const visibles = useMemo(
    () => disenos.filter(d => (d.categoria || 'Otro') === catActiva),
    [disenos, catActiva]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-ld-fg-muted text-xs gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando diseños…
      </div>
    );
  }

  if (disenos.length === 0) {
    return (
      <p className="text-xs text-ld-fg-muted text-center py-3">
        Aún no hay diseños PEYU disponibles. Prueba con una frase o sube tu logo.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <label className="text-xs font-bold text-ld-fg flex items-center gap-1.5">
        <Palette className="w-3.5 h-3.5" style={{ color: 'var(--ld-highlight)' }} /> Elige un diseño PEYU
      </label>

      {categorias.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 pb-0.5">
          {categorias.map(cat => {
            const sel = cat === catActiva;
            const count = disenos.filter(d => (d.categoria || 'Otro') === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCatActiva(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
                  sel
                    ? 'bg-ld-action text-white border-ld-action shadow'
                    : 'bg-ld-glass-soft text-ld-fg-muted border-ld-border hover:text-ld-fg'
                }`}
              >
                {cat} <span className={sel ? 'text-white/70' : 'text-ld-fg-subtle'}>· {count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {visibles.map(d => {
          const activo = selectedUrl === d.imagen_url;
          return (
            <button
              key={d.id}
              type="button"
              title={d.nombre}
              onClick={() => onSelect(activo ? '' : d.imagen_url, d)}
              className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white hover:scale-[1.04]"
              style={{ borderColor: activo ? 'var(--ld-action)' : 'var(--ld-border)' }}
            >
              <img
                src={d.imagen_url}
                alt={d.nombre}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
              {activo && (
                <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--ld-action-soft)' }}>
                  <Check className="w-5 h-5 drop-shadow" style={{ color: 'var(--ld-action)' }} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Palette } from 'lucide-react';

// ============================================================================
// DisenosPeyuPicker (C3) — Galería de diseños predefinidos PEYU.
// El cliente puede elegir un diseño en vez de subir su propio logo. Al elegir,
// devuelve la imagen_url del diseño vía onSelect (se usa como logoUrl en el
// mockup). Lee la entidad DisenoPeyu (activos, ordenados).
// ============================================================================
export default function DisenosPeyuPicker({ selectedUrl, onSelect }) {
  const [disenos, setDisenos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.DisenoPeyu.filter({ activo: true }, 'orden', 24)
      .then(d => { if (alive) setDisenos(d || []); })
      .catch(() => { if (alive) setDisenos([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 text-white/50 text-xs gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando diseños…
      </div>
    );
  }

  if (disenos.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
        <Palette className="w-3.5 h-3.5" /> O elige un diseño PEYU
      </label>
      <div className="grid grid-cols-4 gap-2">
        {disenos.map(d => {
          const activo = selectedUrl === d.imagen_url;
          return (
            <button
              key={d.id}
              type="button"
              title={d.nombre}
              onClick={() => onSelect(activo ? '' : d.imagen_url, d)}
              className="relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-white/5 hover:scale-[1.04]"
              style={{ borderColor: activo ? '#5eead4' : 'rgba(255,255,255,0.18)' }}
            >
              <img
                src={d.imagen_url}
                alt={d.nombre}
                loading="lazy"
                className="w-full h-full object-contain p-1"
              />
              {d.es_ejemplo && (
                <span className="absolute top-0.5 left-0.5 text-[8px] font-bold px-1 py-0.5 rounded bg-amber-400/90 text-amber-950">
                  ejemplo
                </span>
              )}
              {activo && (
                <span className="absolute inset-0 flex items-center justify-center bg-teal-500/30">
                  <Check className="w-5 h-5 text-white drop-shadow" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
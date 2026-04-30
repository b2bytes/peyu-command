import { Check } from 'lucide-react';

/**
 * PackColorPicker — Selector de color por unidad para productos tipo pack.
 *
 * Para un pack de N unidades, el cliente B2C elige el color de cada una.
 * Devuelve un array `coloresPack` de longitud N con los IDs de color.
 *
 * Props:
 *   - packSize: number (N unidades dentro del pack)
 *   - colores: [{id,label,hex}] (paleta disponible para este producto)
 *   - value: string[] (IDs de color seleccionados, longitud N)
 *   - onChange: (string[]) => void
 */
export default function PackColorPicker({ packSize, colores, value, onChange }) {
  if (!packSize || !colores?.length) return null;

  const setColorAt = (idx, colorId) => {
    const next = [...value];
    next[idx] = colorId;
    onChange(next);
  };

  // Resumen legible: "2× Negro · 1× Verde"
  const summary = (() => {
    const counts = {};
    value.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    return Object.entries(counts)
      .map(([id, n]) => {
        const c = colores.find(x => x.id === id);
        return `${n}× ${c?.label || id}`;
      })
      .join(' · ');
  })();

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/25 rounded-2xl p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <label className="text-sm font-bold text-white flex items-center gap-2">
            🎨 Arma tu pack ({packSize} {packSize === 1 ? 'unidad' : 'unidades'})
          </label>
          <p className="text-[11px] text-white/55 mt-0.5">
            Elige el color de cada unidad — todas iguales o mezcla a tu gusto.
          </p>
        </div>
        <span className="text-[10px] font-bold text-purple-200 bg-purple-500/20 border border-purple-400/30 px-2 py-1 rounded-full">
          GRATIS
        </span>
      </div>

      <div className="space-y-2">
        {Array.from({ length: packSize }).map((_, idx) => {
          const selectedId = value[idx] || colores[0].id;
          const selectedColor = colores.find(c => c.id === selectedId) || colores[0];
          return (
            <div key={idx} className="flex items-center gap-2.5 bg-white/5 border border-white/15 rounded-xl px-3 py-2">
              <span className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white/70 flex-shrink-0">
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-white/70 flex-shrink-0">
                Unidad {idx + 1}:
              </span>
              <span className="text-xs text-white/50 flex-1 truncate">
                {selectedColor.label}
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {colores.map(c => {
                  const sel = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorAt(idx, c.id)}
                      title={c.label}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                        sel ? 'border-white scale-110 shadow-md' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {sel && <Check className="w-3 h-3 text-white mx-auto drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Atajos rápidos */}
      <div className="flex gap-1.5 flex-wrap pt-1 border-t border-white/10">
        <span className="text-[10px] text-white/45 self-center mr-1">Atajos:</span>
        {colores.slice(0, 4).map(c => (
          <button
            key={`all-${c.id}`}
            type="button"
            onClick={() => onChange(Array.from({ length: packSize }, () => c.id))}
            className="text-[10px] font-semibold px-2 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-white/70 transition-colors flex items-center gap-1"
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
            Todo {c.label.split(' ')[0].toLowerCase()}
          </button>
        ))}
      </div>

      <div className="text-xs text-purple-200 bg-purple-500/15 border border-purple-400/25 rounded-xl px-3 py-2 font-semibold">
        Tu pack: <span className="text-white">{summary}</span>
      </div>
    </div>
  );
}
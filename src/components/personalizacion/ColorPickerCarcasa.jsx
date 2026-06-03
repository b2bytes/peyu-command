import { Check } from 'lucide-react';

// ============================================================================
// ColorPickerCarcasa — Selector de color para productos que tienen
// `imagenes_por_color` (las carcasas). Construye las opciones EXCLUSIVAMENTE
// desde las claves reales del mapa (ej. Turquesa, Amarillo, Rosado, Negro,
// Azul) y muestra la IMAGEN REAL de cada variante como swatch. NO usa la
// paleta de marmolado genérica. Al seleccionar, devuelve la clave exacta del
// mapa, garantizando que la imagen mostrada coincide con la etiqueta.
// ============================================================================
export default function ColorPickerCarcasa({ imagenesPorColor, selectedKey, onSelect }) {
  const opciones = Object.entries(imagenesPorColor || {})
    .filter(([, url]) => typeof url === 'string' && url.startsWith('http'));

  if (opciones.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {opciones.map(([colorKey, url]) => {
        const sel = selectedKey === colorKey;
        return (
          <button
            key={colorKey}
            type="button"
            onClick={() => onSelect(colorKey)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${
              sel
                ? 'border-teal-400 bg-gradient-to-r from-teal-500/20 to-cyan-500/15 shadow-lg shadow-teal-500/15'
                : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            <div className="w-14 h-14 rounded-xl border-2 border-white/40 shadow-md flex-shrink-0 overflow-hidden bg-white">
              <img
                src={url}
                alt={colorKey}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-semibold text-sm text-white truncate">{colorKey}</div>
              <div className="text-[10px] text-white/45 truncate">Variante real · Plástico reciclado</div>
            </div>
            {sel && (
              <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center shadow flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
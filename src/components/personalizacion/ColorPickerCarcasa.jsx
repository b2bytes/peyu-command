import { Check } from 'lucide-react';

// ============================================================================
// ColorPickerCarcasa — Selector de color para productos que tienen
// `imagenes_por_color` (las carcasas). Construye las opciones EXCLUSIVAMENTE
// desde las claves reales del mapa (ej. Turquesa, Amarillo, Rosado, Negro,
// Azul) y muestra la IMAGEN REAL de cada variante como swatch.
// Estética Warm Dusk de alto contraste (fondo crema → cards blancas sólidas,
// texto café oscuro, selección terracota).
// ============================================================================
const W = {
  border: '#D4C4B0',
  fg: '#2C1810',
  fgSoft: '#7A6050',
  action: '#C0785C',
};

export default function ColorPickerCarcasa({ imagenesPorColor, selectedKey, onSelect }) {
  const opciones = Object.entries(imagenesPorColor || {})
    .filter(([, url]) => typeof url === 'string' && url.startsWith('http'));

  if (opciones.length === 0) return null;

  return (
    <div className="space-y-2">
      {opciones.map(([colorKey, url]) => {
        const sel = selectedKey === colorKey;
        return (
          <button
            key={colorKey}
            type="button"
            onClick={() => onSelect(colorKey)}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{
              border: sel ? `2px solid ${W.action}` : `1.5px solid ${W.border}`,
              background: sel ? 'rgba(192,120,92,.08)' : '#FFFFFF',
              boxShadow: sel ? '0 4px 16px rgba(192,120,92,.20)' : '0 1px 4px rgba(44,24,16,.05)',
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden"
              style={{ border: sel ? `2px solid ${W.action}` : `1.5px solid ${W.border}`, background: '#F8F3ED' }}
            >
              <img src={url} alt={colorKey} loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: W.fg }}>{colorKey}</div>
              <div className="text-[11px] truncate" style={{ color: W.fgSoft }}>Variante real · Plástico reciclado</div>
            </div>
            {sel && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow"
                style={{ background: W.action }}>
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
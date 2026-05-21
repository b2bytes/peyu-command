// EngravingPositionPicker
// ─────────────────────────────────────────────────────────────────────────
// Selector visual de posición del grabado láser sobre el producto.
// Soporta 3 posiciones estándar (arriba · centro · abajo). Se renderiza
// solo cuando el cliente ya escribió un texto a grabar.
//
// Props:
//   value: 'arriba' | 'centro' | 'abajo'
//   onChange: (pos) => void
//   areaLaser: string (ej. "40×25mm") — informativo
// ─────────────────────────────────────────────────────────────────────────
import { ArrowUp, Minus, ArrowDown } from 'lucide-react';

const POSICIONES = [
  { id: 'arriba', label: 'Arriba', icon: ArrowUp },
  { id: 'centro', label: 'Centro', icon: Minus },
  { id: 'abajo',  label: 'Abajo',  icon: ArrowDown },
];

export default function EngravingPositionPicker({ value = 'centro', onChange, areaLaser }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-ld-fg uppercase tracking-wider">
          Posición del grabado
        </label>
        {areaLaser && (
          <span className="text-[10px] text-ld-fg-muted font-mono">
            {areaLaser}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {POSICIONES.map(({ id, label, icon: Icon }) => {
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="rounded-xl border-2 px-2 py-2 flex flex-col items-center gap-1 transition-all hover:scale-[1.02]"
              style={{
                borderColor: selected ? 'var(--ld-highlight)' : 'var(--ld-border)',
                background: selected ? 'var(--ld-highlight-soft)' : 'var(--ld-bg)',
              }}
            >
              <Icon
                className="w-4 h-4"
                style={{ color: selected ? 'var(--ld-highlight)' : 'var(--ld-fg-muted)' }}
              />
              <span
                className="text-[10px] font-bold leading-none"
                style={{ color: selected ? 'var(--ld-highlight)' : 'var(--ld-fg-soft)' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
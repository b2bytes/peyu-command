import { useEffect, useState } from 'react';
import { Sun, Moon, CircleDashed } from 'lucide-react';
import {
  getLiquidMode,
  getLiquidPreference,
  setLiquidPreference,
  subscribeLiquidMode,
} from '@/lib/liquid-dual';

/**
 * Toggle distintivo Liquid Dual — la "firma" del sistema PEYU 2026.
 * Tres estados: día / auto / noche. Pill con knob deslizante de vidrio.
 */
export default function LiquidDualToggle({ compact = false }) {
  const [mode, setMode] = useState(getLiquidMode);
  const [pref, setPref] = useState(getLiquidPreference);

  useEffect(() => {
    return subscribeLiquidMode(({ mode, pref }) => {
      setMode(mode);
      setPref(pref);
    });
  }, []);

  const Item = ({ value, icon: Icon, label }) => {
    const active = pref === value;
    return (
      <button
        onClick={() => setLiquidPreference(value)}
        title={label}
        aria-pressed={active}
        aria-label={label}
        className={`relative z-10 flex items-center justify-center transition-all duration-300 ${
          compact ? 'w-7 h-7' : 'w-8 h-8'
        } rounded-full ${active ? 'text-[var(--ld-bg)]' : 'text-[var(--ld-fg-muted)] hover:text-[var(--ld-fg)]'}`}
      >
        <Icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>
    );
  };

  // Posición del knob: 0 (day), 1 (auto), 2 (night)
  const idx = pref === 'day' ? 0 : pref === 'night' ? 2 : 1;
  const knobSize = compact ? 28 : 32;
  const offset = idx * knobSize;

  return (
    <div
      className="relative inline-flex items-center rounded-full p-0.5 border backdrop-blur-xl"
      style={{
        background: 'var(--ld-glass-soft)',
        borderColor: 'var(--ld-glass-border)',
        boxShadow: 'var(--ld-glass-shadow)',
      }}
      data-liquid-toggle
    >
      {/* Knob deslizante */}
      <span
        aria-hidden="true"
        className="absolute top-0.5 left-0.5 rounded-full transition-all duration-300 ease-out"
        style={{
          width: knobSize,
          height: knobSize,
          transform: `translateX(${offset}px)`,
          background:
            mode === 'day'
              ? 'linear-gradient(135deg,#FFD580 0%,#FFFFFF 100%)'
              : 'linear-gradient(135deg,#0F8B6C 0%,#020617 100%)',
          boxShadow: mode === 'day'
            ? '0 4px 16px rgba(255,213,128,0.5), inset 0 1px 0 rgba(255,255,255,0.6)'
            : '0 4px 16px rgba(15,139,108,0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      />
      <Item value="day" icon={Sun} label="Modo día" />
      <Item value="auto" icon={CircleDashed} label="Automático" />
      <Item value="night" icon={Moon} label="Modo noche" />
    </div>
  );
}
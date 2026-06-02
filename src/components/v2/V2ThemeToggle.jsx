import { Sun, Moon } from 'lucide-react';

// Toggle día/noche para /v2. Controlado por el padre (PeyuV2) que aplica
// data-v2-theme en .v2-root y persiste la preferencia. Pill compacto.
export default function V2ThemeToggle({ theme, onChange }) {
  return (
    <div className="v2-segment inline-flex items-center gap-1">
      <button
        data-active={theme === 'light'}
        onClick={() => onChange('light')}
        aria-label="Modo claro"
        className="v2-segment-btn flex items-center justify-center w-9 h-9"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        data-active={theme === 'dark'}
        onClick={() => onChange('dark')}
        aria-label="Modo oscuro"
        className="v2-segment-btn flex items-center justify-center w-9 h-9"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
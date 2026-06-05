import { Info, Sun, Moon } from 'lucide-react';

/**
 * Bloque explicativo del grabado láser — SIEMPRE visible (item 2 del mandato).
 * Explica: gratis desde 10u, escala de grises tono OPUESTO al color, y el aviso
 * de mockup referencial en 24h cuando no se genera en línea.
 *
 * variant: 'dark' (paneles oscuros B2B) | 'light' (fondos claros B2C).
 */
export default function GrabadoLaserInfo({ variant = 'dark', showMockupNote = true }) {
  const dark = variant === 'dark';
  const box = dark
    ? 'bg-white/[0.05] border-white/12 text-white/80'
    : 'bg-ld-bg-elevated border-ld-border text-ld-fg-soft';
  const title = dark ? 'text-white' : 'text-ld-fg';
  const muted = dark ? 'text-white/55' : 'text-ld-fg-muted';
  const accent = dark ? 'text-amber-300' : '';
  const accentStyle = dark ? undefined : { color: 'var(--ld-action)' };

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 ${box}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <Info className="w-4 h-4 flex-shrink-0" style={accentStyle} />
        <p className={`font-bold text-sm ${title}`}>Cómo funciona el grabado láser</p>
      </div>
      <p className="text-xs leading-relaxed mb-3">
        <span className={`font-semibold ${accent}`} style={accentStyle}>Grabado láser GRATIS desde 10 unidades.</span>{' '}
        Siempre en <strong>escala de grises</strong>, en tonalidad <strong>opuesta</strong> al color del producto. No se imprime a color.
      </p>
      <div className="grid grid-cols-2 gap-2.5 mb-1">
        <div className={`rounded-xl p-2.5 ${dark ? 'bg-white/[0.04]' : 'bg-ld-bg-soft'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Sun className="w-3.5 h-3.5" style={accentStyle} />
            <span className={`text-[11px] font-bold ${title}`}>Producto claro</span>
          </div>
          <p className={`text-[11px] ${muted}`}>Grabado gris oscuro / negro</p>
        </div>
        <div className={`rounded-xl p-2.5 ${dark ? 'bg-white/[0.04]' : 'bg-ld-bg-soft'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Moon className="w-3.5 h-3.5" style={accentStyle} />
            <span className={`text-[11px] font-bold ${title}`}>Producto oscuro</span>
          </div>
          <p className={`text-[11px] ${muted}`}>Grabado gris claro / blanco</p>
        </div>
      </div>
      {showMockupNote && (
        <p className={`text-[11px] mt-2.5 ${muted}`}>
          Si no se genera un mockup en línea, te enviaremos un <strong>mockup referencial</strong> junto con la propuesta dentro de 24h.
        </p>
      )}
    </div>
  );
}
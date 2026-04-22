import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import BackgroundCarousel from './BackgroundCarousel';

/**
 * Botón para el sidebar/drawer que abre el carrusel fullscreen de fondos.
 *
 * Props:
 *   - expanded: bool — si el sidebar está expandido (muestra label).
 */
export default function BackgroundSwitcher({ expanded = false }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cambiar fondo"
        className={`flex items-center rounded-lg transition-colors h-11 text-white/80 hover:bg-white/10 hover:text-white w-full ${
          expanded ? 'px-3 gap-3 justify-start' : 'justify-center'
        }`}
      >
        <ImageIcon className="w-[18px] h-[18px] flex-shrink-0" />
        {expanded && (
          <span className="text-xs font-medium whitespace-nowrap overflow-hidden">Fondo</span>
        )}
      </button>

      <BackgroundCarousel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
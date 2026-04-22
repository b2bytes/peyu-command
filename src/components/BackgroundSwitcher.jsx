import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import BackgroundCarousel from './BackgroundCarousel';

/**
 * Botón flotante INDEPENDIENTE del sidebar para abrir el selector de fondo.
 * Se ubica en la esquina inferior izquierda, sobre el sidebar pero sin formar parte de él.
 * Visible solo en desktop (en móvil el selector se ofrece desde el drawer/menú).
 */
export default function BackgroundSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cambiar fondo"
        aria-label="Cambiar fondo de la app"
        className="hidden lg:flex fixed bottom-4 left-4 z-[70] w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/15 text-white/85 hover:text-white items-center justify-center shadow-xl shadow-black/40 transition-all hover:scale-105 active:scale-95"
      >
        <ImageIcon className="w-[18px] h-[18px]" />
      </button>

      <BackgroundCarousel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
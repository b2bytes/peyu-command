import { useState, useEffect } from 'react';
import { ImageIcon, X } from 'lucide-react';
import BackgroundPicker from './BackgroundPicker';

/**
 * Botón para el sidebar que abre un modal con BackgroundPicker.
 * Se renderiza como un ítem más del menú lateral (no flotante).
 *
 * Props:
 *   - expanded: bool — si el sidebar está expandido (muestra label).
 */
export default function BackgroundSwitcher({ expanded = false }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cambiar fondo"
        className={`flex items-center rounded-lg transition-colors h-11 text-white/80 hover:bg-white/10 hover:text-white ${
          expanded ? 'px-3 gap-3 justify-start' : 'justify-center'
        }`}
      >
        <ImageIcon className="w-[18px] h-[18px] flex-shrink-0" />
        {expanded && (
          <span className="text-xs font-medium whitespace-nowrap overflow-hidden">Fondo</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center p-0 lg:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Selector de fondo"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full lg:max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-t lg:border border-white/15 rounded-t-3xl lg:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                <h3 className="font-poppins font-bold text-white text-sm">Fondo de la app</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
              <BackgroundPicker />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
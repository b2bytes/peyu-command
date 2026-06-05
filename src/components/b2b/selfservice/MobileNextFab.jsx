import { ArrowRight } from 'lucide-react';

/**
 * FAB (botón flotante) "Siguiente" para MÓVIL en el paso 0 del cotizador B2B.
 * Centrado, grande y SIEMPRE visible por encima de todo (z muy alto), flota
 * sobre la barra inferior para que el avance nunca quede tapado ni se confunda.
 *
 * Solo se muestra cuando hay productos en el carrito. Llama onContinue al tocar.
 */
export default function MobileNextFab({ visible, onContinue }) {
  if (!visible) return null;

  return (
    <button
      onClick={onContinue}
      aria-label="Siguiente paso"
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 pl-6 pr-5 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 active:from-teal-600 active:to-cyan-700 text-white font-extrabold text-base shadow-2xl shadow-teal-500/50 ring-4 ring-slate-900/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.25rem)' }}
    >
      Siguiente
      <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
        <ArrowRight className="w-5 h-5" />
      </span>
    </button>
  );
}
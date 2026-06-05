import { ArrowRight, Loader2, Wand2 } from 'lucide-react';

/**
 * FAB (botón flotante) "Siguiente" para MÓVIL en TODOS los pasos del cotizador B2B.
 * Centrado, grande y SIEMPRE visible por encima de todo (z muy alto), flota
 * sobre la barra/footer para que el avance nunca quede tapado ni se confunda.
 *
 * - visible: si debe mostrarse (controlado por el padre)
 * - enabled: si la acción está habilitada (validación del paso)
 * - isLast: si es el último paso (genera la propuesta en vez de avanzar)
 * - loading: muestra spinner mientras genera
 * - label: texto del botón
 */
export default function MobileNextFab({ visible, enabled = true, isLast = false, loading = false, label, onAction }) {
  if (!visible) return null;

  const text = label || (isLast ? 'Generar propuesta' : 'Siguiente');

  return (
    <button
      onClick={enabled && !loading ? onAction : undefined}
      disabled={!enabled || loading}
      aria-label={text}
      className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 pl-6 pr-5 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 active:from-teal-600 active:to-cyan-700 text-white font-extrabold text-base shadow-2xl shadow-teal-500/50 ring-4 ring-slate-900/40 animate-in fade-in slide-in-from-bottom-4 duration-300 disabled:opacity-40 disabled:shadow-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.25rem)' }}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generando…
        </>
      ) : (
        <>
          {text}
          <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
            {isLast ? <Wand2 className="w-4 h-4" /> : <ArrowRight className="w-5 h-5" />}
          </span>
        </>
      )}
    </button>
  );
}
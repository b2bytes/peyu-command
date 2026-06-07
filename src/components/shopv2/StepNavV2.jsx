import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// StepNavV2 — Botonera Atrás / Siguiente consistente para el flujo de compra.
// • backTo  : ruta del paso anterior (si falta, usa navigate(-1))
// • nextLabel + onNext (o nextTo): acción primaria del paso.
// • nextDisabled: deshabilita el botón primario.
// Diseño Warm Dusk. Pensado para pie de página en escritorio.
// ════════════════════════════════════════════════════════════════════════
export default function StepNavV2({
  backTo, backLabel = 'Atrás',
  nextTo, onNext, nextLabel = 'Siguiente', nextDisabled = false, nextLoading = false,
  hideNext = false,
}) {
  const navigate = useNavigate();

  const goBack = () => (backTo ? navigate(backTo) : navigate(-1));
  const goNext = () => { if (onNext) onNext(); else if (nextTo) navigate(nextTo); };

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#EBE3D6] text-[#4B4F54] font-bold text-sm hover:border-[#0F8B6C]/40 hover:text-[#0F8B6C] transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      {!hideNext && (
        <button
          onClick={goNext}
          disabled={nextDisabled || nextLoading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0F8B6C] hover:bg-[#0B6E55] text-white font-bold text-sm shadow-lg shadow-[#0F8B6C]/20 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          {nextLoading ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando…</>
          ) : (
            <>{nextLabel} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
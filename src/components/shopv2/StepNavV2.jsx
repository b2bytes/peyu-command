import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// StepNavV2 — Botonera Atrás / Siguiente. Warm Clay 2027.
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
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-[#EDE3D6]"
        style={{ background: 'white', border: '1.5px solid #D4C4B0', color: '#7A6050' }}
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </button>

      {!hideNext && (
        <button
          onClick={goNext}
          disabled={nextDisabled || nextLoading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          style={{
            background: 'linear-gradient(135deg,#C0785C,#A86440)',
            boxShadow: '0 6px 20px rgba(192,120,92,.28)',
          }}
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
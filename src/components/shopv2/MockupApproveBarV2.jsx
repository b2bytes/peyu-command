import { CheckCircle2, Pencil, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// MockupApproveBarV2 — Barra de aprobación SIEMPRE pegada al mockup.
// El cliente revisa el preview y aprueba AHÍ MISMO (antes el botón vivía
// lejos, dentro del personalizador, y el usuario se perdía). Estados:
//   · Sin aprobar → CTA verde grande "Aprobar mockup" con hint.
//   · Aprobada    → confirmación verde + "Editar" para reabrir.
// Controlado: recibe pers/setPers del padre (mismo contrato del flujo).
// ════════════════════════════════════════════════════════════════════════
export default function MockupApproveBarV2({ pers, setPers }) {
  if (pers.aprobada) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-2xl px-4 py-3"
        style={{ background: 'rgba(15,139,108,.12)', border: '1.5px solid rgba(15,139,108,.35)' }}>
        <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#0F8B6C' }}>
          <CheckCircle2 className="w-5 h-5" /> Mockup aprobado
        </span>
        <button
          onClick={() => setPers({ ...pers, aprobada: false })}
          className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors hover:bg-white"
          style={{ color: '#7A6050', border: '1px solid #D4C4B0' }}
        >
          <Pencil className="w-3 h-3" /> Editar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl p-3"
      style={{ background: 'rgba(217,107,77,.08)', border: '1.5px dashed rgba(217,107,77,.45)' }}>
      <p className="text-[11px] font-bold text-center mb-2 flex items-center justify-center gap-1" style={{ color: '#D96B4D' }}>
        <Sparkles className="w-3.5 h-3.5" /> ¿Te gusta cómo quedó? Aprueba tu mockup para continuar
      </p>
      <button
        type="button"
        onClick={() => setPers({ ...pers, aprobada: true })}
        className="w-full h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)', boxShadow: '0 6px 20px rgba(15,139,108,.3)' }}
      >
        <CheckCircle2 className="w-5 h-5" /> Aprobar mockup
      </button>
    </div>
  );
}
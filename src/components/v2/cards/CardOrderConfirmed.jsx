import { CheckCircle2, Clock, Truck, RotateCcw } from 'lucide-react';
import { formatCLP } from '@/lib/v2-catalog';

// Card de confirmación post-pago en el río. data: { numero, nombre, total, estado, pending, onRetry }
export default function CardOrderConfirmed({ data }) {
  const { numero, nombre, total, pending, onRetry } = data || {};

  if (pending) {
    return (
      <div className="v2-card v2-fade-up p-4 w-full max-w-[340px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-gold-soft)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--v2-gold)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>Pago en proceso</p>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--v2-fg-soft)' }}>
          Tu pedido {numero ? <strong>{numero}</strong> : ''} está registrado pero el pago aún no se confirma 🐢. Si ya pagaste, se confirmará en minutos. Si no, puedes reintentar.
        </p>
        {onRetry && (
          <button onClick={onRetry} className="v2-btn-primary w-full h-10 flex items-center justify-center gap-2 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Reintentar pago
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="v2-card v2-fade-up p-4 w-full max-w-[340px]">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--v2-teal-soft)' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--v2-teal)' }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: 'var(--v2-fg)' }}>¡Pago confirmado! 🐢</p>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--v2-fg-soft)' }}>
        ¡Listo{nombre ? `, ${nombre}` : ''}! Tu pedido <strong>{numero}</strong> está confirmado.
        {total ? <> Total <strong>{formatCLP(total)}</strong>.</> : null}
      </p>
      <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg" style={{ background: 'var(--v2-surface-2)' }}>
        <Truck className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--v2-teal)' }} />
        <p className="text-[11px]" style={{ color: 'var(--v2-fg-soft)' }}>Te llega por BlueExpress. Te avisamos el tracking por email.</p>
      </div>
    </div>
  );
}
import { Send, Check, Eye } from 'lucide-react';
import ActionButton from '../ActionButton';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Fila densa de propuesta: empresa + monto arriba, acciones compactas abajo.
export default function ProposalRow({ propuesta: c, onVer, onDone }) {
  return (
    <div className="rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-ld-fg truncate leading-tight">{c.empresa || 'Sin empresa'}</p>
          <p className="text-[10.5px] text-ld-fg-muted truncate">
            {c.numero || ''}{c.contacto ? ` · ${c.contacto}` : ''} · {c.status}
          </p>
        </div>
        <span className="text-[12.5px] font-bold text-ld-fg tabular-nums flex-shrink-0">{fmtCLP(c.total)}</span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <button
          onClick={() => onVer({ id: c.id, titulo: `${c.empresa || ''}${c.numero ? ` · ${c.numero}` : ''}` })}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Ver
        </button>
        {c.email && (
          <ActionButton action="reenviarPropuesta" payload={{ proposalId: c.id }} label="Reenviar" icon={Send} onDone={onDone} />
        )}
        <ActionButton action="updatePropuestaEstado" payload={{ id: c.id, status: 'Aceptada' }} label="Aceptada" icon={Check} onDone={onDone} />
      </div>
    </div>
  );
}
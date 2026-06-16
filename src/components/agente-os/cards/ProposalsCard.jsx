import { useState } from 'react';
import { FileText, ChevronRight, Send, Check, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import ActionButton from '../ActionButton';
import PropuestaViewerModal from '../PropuestaViewerModal';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

// Propuestas corporativas pendientes (enviadas sin respuesta) + acciones:
// reenviar / marcar aceptada. Acepta `cotizaciones` (CRM) o `lista` (brain).
export default function ProposalsCard({ cotizaciones = [], lista, onDone }) {
  const [verPropuesta, setVerPropuesta] = useState(null); // { id, titulo }
  const pendientes = lista
    ? lista
    : cotizaciones.filter((c) => c.status === 'Enviada' || c.status === 'Borrador').slice(0, 6);

  if (pendientes.length === 0) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-ld-fg-muted">No hay propuestas pendientes.</p>
      </div>
    );
  }

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <FileText className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Propuestas pendientes</span>
        </div>
        <Link to="/admin/propuestas" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver todas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {pendientes.map((c) => (
          <div key={c.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{c.empresa || 'Sin empresa'}</div>
                <div className="text-[11px] text-ld-fg-muted truncate">{c.numero || ''}{c.contacto ? ` · ${c.contacto}` : ''}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-ld-fg">{fmtCLP(c.total)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ld-bg-soft text-ld-fg-muted font-medium">{c.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              <button
                onClick={() => setVerPropuesta({ id: c.id, titulo: `${c.empresa || ''}${c.numero ? ` · ${c.numero}` : ''}` })}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ld-glass-soft text-ld-fg-soft hover:text-ld-fg hover:border-ld-action/50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Ver propuesta
              </button>
              {c.email && (
                <ActionButton action="reenviarPropuesta" payload={{ proposalId: c.id }} label="Reenviar" icon={Send} onDone={onDone} />
              )}
              <ActionButton action="updatePropuestaEstado" payload={{ id: c.id, status: 'Aceptada' }} label="Marcar aceptada" icon={Check} onDone={onDone} />
            </div>
          </div>
        ))}
      </div>

      {verPropuesta && (
        <PropuestaViewerModal
          proposalId={verPropuesta.id}
          titulo={verPropuesta.titulo}
          onClose={() => setVerPropuesta(null)}
        />
      )}
    </div>
  );
}
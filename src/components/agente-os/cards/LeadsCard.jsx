import { Target, Trash2, CalendarDays, FileText } from 'lucide-react';
import ActionButton from '../ActionButton';
import { fmtFechaCompleta } from '@/lib/fecha-relativa';

const fmtNum = (n) => (n != null ? Number(n).toLocaleString('es-CL') : '—');

// Pipeline B2B en el río: leads activos con score + acciones (avanzar estado,
// enviar propuesta si existe). Datos reales desde peyuBrainOps.lists.leads_top.
export default function LeadsCard({ leads = [], onDone }) {
  if (leads.length === 0) {
    return (
      <div className="ld-glass rounded-2xl p-4 sm:p-5">
        <p className="text-sm text-ld-fg-muted">No hay leads B2B activos.</p>
      </div>
    );
  }

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Target className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Leads B2B activos</span>
        </div>
        <span className="text-[11px] text-ld-fg-subtle">{leads.length}</span>
      </div>

      <div className="space-y-2.5">
        {leads.map((l) => (
          <div key={l.id} className="rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{l.company_name || 'Sin empresa'}</div>
                <div className="text-[11px] text-ld-fg-muted truncate">
                  {l.contact_name || 'N/A'}{l.qty_estimate ? ` · ${fmtNum(l.qty_estimate)}u` : ''}{l.product_interest ? ` · ${l.product_interest}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {l.lead_score != null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.lead_score >= 70 ? 'bg-ld-highlight-soft text-ld-highlight' : 'bg-ld-action-soft text-ld-action'}`}>
                    🔥 {l.lead_score}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ld-bg-soft text-ld-fg-muted font-medium">{l.status}</span>
              </div>
            </div>
            {/* Fecha precisa: cuándo llegó el lead y por qué canal */}
            {l.created_date && (
              <div className="text-[10px] text-ld-fg-subtle mt-1.5 flex items-center gap-1">
                <CalendarDays className="w-2.5 h-2.5" /> Llegó {fmtFechaCompleta(l.created_date)}{l.source ? ` · ${l.source}` : ''}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {l.status !== 'Contactado' && (
                <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'Contactado' }} label="Marcar contactado" confirm={false} onDone={onDone} />
              )}
              <ActionButton action="updateLeadEstado" payload={{ id: l.id, status: 'En revisión' }} label="A revisión" confirm={false} onDone={onDone} />
              <ActionButton action="autoCotizarLead" payload={{ id: l.id }} label="Generar propuesta" icon={FileText} variant="primary" confirm={true} onDone={onDone} />
              <ActionButton action="eliminarLead" payload={{ id: l.id }} label="Eliminar" icon={Trash2} confirm={true} onDone={onDone} className="ml-auto bg-ld-highlight-soft text-ld-highlight hover:text-ld-highlight" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
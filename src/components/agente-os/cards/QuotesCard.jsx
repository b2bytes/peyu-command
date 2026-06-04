import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtCLP = (n) => (n != null ? `$${Number(n).toLocaleString('es-CL')}` : '—');

const STATUS_STYLE = {
  'Borrador': 'bg-ld-bg-soft text-ld-fg-muted',
  'Enviada': 'bg-ld-action-soft text-ld-action',
  'Aceptada': 'bg-ld-action-soft text-ld-action',
  'Rechazada': 'bg-ld-highlight-soft text-ld-highlight',
  'Vencida': 'bg-ld-highlight-soft text-ld-highlight',
};

// Lista de cotizaciones / propuestas B2B recientes con estado.
export default function QuotesCard({ cotizaciones = [] }) {
  const recientes = cotizaciones.slice(0, 6);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <FileText className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Cotizaciones B2B</span>
        </div>
        <Link to="/admin/propuestas" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Ver todas <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {recientes.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">Sin cotizaciones recientes.</p>
      ) : (
        <div className="space-y-2">
          {recientes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-ld-bg-soft/60 border border-ld-border">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{c.empresa}</div>
                <div className="text-[11px] text-ld-fg-muted truncate">{c.numero || ''} · {c.contacto || ''}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-ld-fg">{fmtCLP(c.total)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[c.status] || 'bg-ld-bg-soft text-ld-fg-muted'}`}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
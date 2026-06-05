import { FileText, Clock, CheckCircle2, XCircle, Send, AlertTriangle } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// Estado de cotizaciones recientes del cliente. Une CorporateProposal (B2B) y
// Cotizacion en una sola lista ordenada por fecha, con badge de estado claro.
// ════════════════════════════════════════════════════════════════════════

const ESTADO = {
  Borrador:  { cls: 'bg-gray-100 text-gray-600',   Icon: Clock },
  Enviada:   { cls: 'bg-blue-100 text-blue-700',   Icon: Send },
  Aceptada:  { cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  Rechazada: { cls: 'bg-red-100 text-red-700',     Icon: XCircle },
  Vencida:   { cls: 'bg-orange-100 text-orange-700', Icon: AlertTriangle },
};

function EstadoBadge({ estado }) {
  const { cls, Icon } = ESTADO[estado] || ESTADO.Borrador;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="w-3 h-3" /> {estado || 'Borrador'}
    </span>
  );
}

export default function RecentQuotesSummary({ cotizaciones }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" /> Cotizaciones recientes
        {cotizaciones.length > 0 && (
          <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cotizaciones.length}</span>
        )}
      </h2>

      {cotizaciones.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin cotizaciones registradas</p>
      ) : (
        <div className="space-y-2">
          {cotizaciones.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {c.numero || c.id.slice(-6)}
                    <span className="text-[10px] font-normal text-gray-400 ml-1.5">{c.origen}</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.fecha || '—'}{c.detalle ? ` · ${c.detalle}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-bold text-sm text-gray-900">${(c.total || 0).toLocaleString('es-CL')}</p>
                <EstadoBadge estado={c.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
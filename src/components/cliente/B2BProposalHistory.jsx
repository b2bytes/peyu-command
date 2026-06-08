import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, TrendingDown, Calendar, Eye, Loader2, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { fmtCLP } from '@/lib/shop-v2-cart';

// Badge de estado
function StatusBadge({ status }) {
  const cfg = {
    Borrador: { bg: '#F2ECE2', color: '#A08070', icon: AlertCircle },
    Enviada: { bg: '#E3F2FD', color: '#1976D2', icon: Clock },
    Aceptada: { bg: '#E8F5E9', color: '#388E3C', icon: CheckCircle2 },
    Rechazada: { bg: '#FFEBEE', color: '#D32F2F', icon: XCircle },
    Vencida: { bg: '#FFF3E0', color: '#F57C00', icon: AlertCircle },
  }[status] || { bg: '#F2ECE2', color: '#A08070', icon: AlertCircle };

  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function B2BProposalHistory({ empresa }) {
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresa) { setLoading(false); return; }
    (async () => {
      try {
        const data = await base44.entities.CorporateProposal.filter(
          { empresa },
          '-created_date',
          50
        );
        setPropuestas(data || []);
      } catch {
        setPropuestas([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [empresa]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  const totalPropuestas = propuestas.length;
  const aceptadas = propuestas.filter(p => p.status === 'Aceptada').length;
  const montoTotal = propuestas
    .filter(p => p.status === 'Aceptada')
    .reduce((acc, p) => acc + (p.total || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" /> Historial de propuestas B2B
        </h2>
      </div>

      {totalPropuestas === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin propuestas registradas</p>
      ) : (
        <>
          {/* KPIs mini */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Total enviadas</p>
              <p className="text-xl font-bold text-gray-900">{totalPropuestas}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xs text-green-700">Aceptadas</p>
              <p className="text-xl font-bold text-green-700">{aceptadas}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 text-center">
              <p className="text-xs text-teal-700">Monto ganado</p>
              <p className="text-sm font-bold text-teal-700">${(montoTotal / 1000000).toFixed(1)}M</p>
            </div>
          </div>

          {/* Tabla de propuestas */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {propuestas.map((prop) => {
              const fecha = prop.fecha_envio
                ? new Date(prop.fecha_envio).toLocaleDateString('es-CL', { day: 'short', month: 'short', year: '2-digit' })
                : prop.created_date
                  ? new Date(prop.created_date).toLocaleDateString('es-CL', { day: 'short', month: 'short', year: '2-digit' })
                  : '—';

              return (
                <div
                  key={prop.id}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors border border-gray-100"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        Prop. {prop.numero || prop.id?.slice(-4).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fecha}
                        {prop.lead_time_dias && <span>· {prop.lead_time_dias}d lead time</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">${(prop.total || 0).toLocaleString('es-CL')}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end">
                        {prop.items_json && JSON.parse(prop.items_json || '[]').length > 0
                          && `${JSON.parse(prop.items_json).reduce((a, i) => a + (i.cantidad || i.qty || 0), 0)}u`}
                      </p>
                    </div>
                    <StatusBadge status={prop.status} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Tasa de conversión</p>
              <p className="font-bold text-gray-900">{totalPropuestas > 0 ? `${Math.round((aceptadas / totalPropuestas) * 100)}%` : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Ticket promedio (aceptadas)</p>
              <p className="font-bold text-gray-900">
                {aceptadas > 0 ? `$${(montoTotal / aceptadas).toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : '—'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
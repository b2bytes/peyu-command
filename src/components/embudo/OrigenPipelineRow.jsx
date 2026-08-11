import { AlertTriangle, ChevronDown } from 'lucide-react';
import { ETAPAS, diasSinMovimiento } from '@/lib/origen-pipeline';

const COLOR_ETAPA = {
  'Nuevo': '#94A3B8',
  'Contactado': '#0EA5E9',
  'En revisión': '#F59E0B',
  'Propuesta enviada': '#C0785C',
  'Aceptado': '#16A34A',
  'Perdido': '#EF4444',
};

// Fila por fuente de tráfico: distribución por etapa + tasa de estancamiento.
export default function OrigenPipelineRow({ grupo, abierto, onToggle, peor }) {
  return (
    <div className={`rounded-2xl bg-white overflow-hidden ${peor ? 'ring-2 ring-amber-300' : ''}`} style={{ border: '1px solid #E5E7EB' }}>
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{grupo.origen}</p>
            <p className="text-[11px] text-gray-500">
              {grupo.total} leads · {grupo.cierrePct}% cierra
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <p className={`font-poppins font-bold text-lg ${grupo.estancadoPct >= 30 ? 'text-amber-600' : 'text-gray-900'}`}>
                {grupo.estancadoPct}%
              </p>
              <p className="text-[10px] font-semibold text-gray-500">estancado</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Barra apilada por etapa */}
        <div className="mt-3 flex h-2.5 rounded-full overflow-hidden bg-gray-100">
          {ETAPAS.map((e) => {
            const n = grupo.etapas[e] || 0;
            if (!n) return null;
            return (
              <div key={e} style={{ width: `${(n / grupo.total) * 100}%`, background: COLOR_ETAPA[e] }} title={`${e}: ${n}`} />
            );
          })}
        </div>
      </button>

      {abierto && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-1.5">
            {ETAPAS.map((e) => (
              <span key={e} className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: `${COLOR_ETAPA[e]}18`, color: COLOR_ETAPA[e] }}>
                {e}: {grupo.etapas[e] || 0}
              </span>
            ))}
          </div>

          {grupo.leadsEstancados.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Leads sin movimiento
              </p>
              <div className="space-y-1">
                {grupo.leadsEstancados.slice(0, 6).map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-gray-700">{l.company_name || l.contact_name}</span>
                    <span className="text-gray-400 flex-shrink-0">{l.status} · {diasSinMovimiento(l)}d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
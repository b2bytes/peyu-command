// ============================================================================
// PEYU OS · Bloque KPIs hidratado — datos reales del CRM
// ============================================================================
import { TrendingUp, FileText, Receipt, Clock } from 'lucide-react';
import { fmtCLP, fmtNum } from '../helpers';

export default function KpiBlock({ data }) {
  const items = [
    { label: 'Pipeline B2B', value: fmtNum(data.pipelineB2B), sub: 'leads activos', icon: TrendingUp, accent: false },
    { label: 'Cotizaciones', value: fmtNum(data.cotizaciones), sub: 'enviadas abiertas', icon: FileText, accent: false },
    { label: 'Ticket promedio', value: fmtCLP(data.ticketPromedio), sub: 'por cotización', icon: Receipt, accent: false },
    { label: 'Por vencer', value: fmtNum(data.porVencer), sub: '≤ 3 días', icon: Clock, accent: data.porVencer > 0 },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {items.map((k) => (
        <div
          key={k.label}
          className={`rounded-2xl border p-3.5 ${
            k.accent ? 'bg-[#fbeee9] border-[#D96B4D]/30' : 'bg-white border-[#ece4d8]'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <k.icon className={`w-3.5 h-3.5 ${k.accent ? 'text-[#D96B4D]' : 'text-[#0F8B6C]'}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa6a0]">{k.label}</span>
          </div>
          <p className={`font-poppins font-bold text-xl leading-none tabular-nums ${k.accent ? 'text-[#D96B4D]' : 'text-[#22302c]'}`}>
            {k.value}
          </p>
          <p className="text-[11px] text-[#9aa6a0] mt-1">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}
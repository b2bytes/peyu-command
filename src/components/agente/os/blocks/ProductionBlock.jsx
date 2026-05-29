// ============================================================================
// PEYU OS · Gráfico simple de carga de producción por día.
// Calcula pedidos activos agrupados por fecha de los próximos 7 días.
// ============================================================================
import { Factory } from 'lucide-react';

export default function ProductionBlock({ pedidos }) {
  // Agrupar pedidos activos por día (próximos 7 días desde hoy)
  const activos = pedidos.filter((p) => !['Entregado', 'Cancelado', 'Reembolsado'].includes(p.estado));
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = activos.filter((p) => (p.fecha || p.created_date || '').slice(0, 10) === key).length;
    dias.push({
      label: d.toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', ''),
      count,
      hoy: i === 0,
    });
  }
  const max = Math.max(1, ...dias.map((d) => d.count));

  return (
    <div className="rounded-2xl bg-white border border-[#ece4d8] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Factory className="w-4 h-4 text-[#0F8B6C]" />
        <span className="text-sm font-semibold text-[#22302c] font-poppins">Carga de producción · 7 días</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-28">
        {dias.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#6f7d77] tabular-nums">{d.count}</span>
            <div className="w-full flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-t-lg transition-all ${d.hoy ? 'bg-[#0F8B6C]' : 'bg-[#A7D9C9]'}`}
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '6px' : '2px' }}
              />
            </div>
            <span className={`text-[10px] capitalize ${d.hoy ? 'text-[#0F8B6C] font-semibold' : 'text-[#9aa6a0]'}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// FunnelStrip · Visualiza la conversión etapa por etapa del día.
import { ChevronRight } from 'lucide-react';

export default function FunnelStrip({ metrics }) {
  const steps = [
    { label: 'Sesiones', value: metrics.visitas, color: 'from-blue-500 to-blue-600' },
    { label: 'Vistas producto', value: metrics.productViews, color: 'from-indigo-500 to-indigo-600' },
    { label: 'Add to cart', value: metrics.addToCarts, color: 'from-violet-500 to-violet-600' },
    { label: 'Checkout', value: metrics.checkoutStarts, color: 'from-amber-500 to-amber-600' },
    { label: 'Pedidos', value: metrics.pedidos, color: 'from-emerald-500 to-emerald-600' },
  ];

  const max = Math.max(...steps.map(s => s.value), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 font-jakarta">Funnel del día</h2>
        <span className="text-xs text-slate-500">% sobre etapa anterior</span>
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
        {steps.map((step, idx) => {
          const prev = idx > 0 ? steps[idx - 1].value : null;
          const ratio = prev && prev > 0 ? ((step.value / prev) * 100).toFixed(1) : null;
          const widthPct = (step.value / max) * 100;
          return (
            <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
              <div className="min-w-[140px]">
                <div className={`bg-gradient-to-br ${step.color} rounded-xl p-3 text-white shadow-sm`}>
                  <p className="text-xs opacity-90 font-medium">{step.label}</p>
                  <p className="text-2xl font-bold font-jakarta mt-1">{step.value}</p>
                  {ratio !== null && (
                    <p className="text-[10px] opacity-80 mt-1">
                      {ratio}% del anterior
                    </p>
                  )}
                </div>
                <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${step.color} transition-all`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
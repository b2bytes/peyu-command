import { Bug, Sparkles, Rocket, Calendar } from 'lucide-react';
import { changelogPorFecha, fmtFecha } from '@/lib/changelog-peyu';

const TIPO_CONFIG = {
  bug: { icon: Bug, label: 'Bug corregido', badge: 'bg-red-100 text-red-700 border-red-200', border: 'border-red-300', bg: 'bg-red-50/60' },
  mejora: { icon: Sparkles, label: 'Mejora', badge: 'bg-purple-100 text-purple-700 border-purple-200', border: 'border-purple-300', bg: 'bg-purple-50/60' },
  feature: { icon: Rocket, label: 'Nueva función', badge: 'bg-blue-100 text-blue-700 border-blue-200', border: 'border-blue-300', bg: 'bg-blue-50/60' },
};

/**
 * ChangelogTimeline — Renderiza el historial de avances agrupado por fecha.
 * Se alimenta 100% de lib/changelog-peyu.js: agregar una entrada ahí
 * actualiza esta vista automáticamente.
 */
export default function ChangelogTimeline() {
  const grupos = changelogPorFecha();

  return (
    <div className="space-y-5 sm:space-y-6">
      {grupos.map(([fecha, entradas]) => (
        <div key={fecha}>
          <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
            <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold capitalize">
              <Calendar className="w-3 h-3" /> {fmtFecha(fecha)}
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">{entradas.length} cambios</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3">
            {entradas.map((e, i) => {
              const cfg = TIPO_CONFIG[e.tipo] || TIPO_CONFIG.mejora;
              const Icon = cfg.icon;
              return (
                <div key={i} className={`border-l-4 ${cfg.border} ${cfg.bg} rounded-xl p-3 sm:p-3.5`}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-bold ${cfg.badge}`}>
                      <Icon className="w-2.5 h-2.5" /> {cfg.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-slate-500">{e.area}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900">{e.titulo}</p>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">{e.detalle}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
import { Check, Package, Building2, Sparkles, FileCheck } from 'lucide-react';

const STEP_ICONS = [Package, Building2, Sparkles, FileCheck];

/**
 * Stepper visual premium para el flujo B2B Self-Service.
 * Diseño 2027 trend: ícono por step, conector animado, glow en step activo.
 */
export default function StepperProgress({ steps, current }) {
  return (
    <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/12 rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
      {/* Desktop: ícono + label + conector */}
      <div className="hidden sm:flex items-center gap-1">
        {steps.map((label, i) => {
          const Icon = STEP_ICONS[i] || Package;
          const isDone = i < current;
          const isActive = i === current;
          return (
            <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg shadow-teal-500/40 ring-2 ring-teal-300/30 ring-offset-2 ring-offset-transparent scale-110'
                      : isDone
                      ? 'bg-teal-500/25 border border-teal-400/40'
                      : 'bg-white/[0.05] border border-white/15'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 text-teal-300" strokeWidth={3} />
                  ) : (
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/45'}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-[9px] uppercase tracking-wider font-bold ${isActive ? 'text-teal-300' : isDone ? 'text-white/60' : 'text-white/35'}`}>
                    Paso {i + 1}
                  </p>
                  <p className={`text-xs font-bold whitespace-nowrap ${isActive ? 'text-white' : isDone ? 'text-white/70' : 'text-white/40'}`}>
                    {label}
                  </p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500 ${
                      i < current ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: dots con label actual */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
              {(() => {
                const Icon = STEP_ICONS[current] || Package;
                return <Icon className="w-3.5 h-3.5 text-white" />;
              })()}
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-teal-300 font-bold leading-none">Paso {current + 1} de {steps.length}</p>
              <p className="text-sm font-bold text-white leading-none mt-0.5">{steps[current]}</p>
            </div>
          </div>
          <span className="text-[10px] text-white/40 font-medium">
            {Math.round(((current + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                i < current
                  ? 'bg-teal-400'
                  : i === current
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-400 shadow-sm shadow-teal-500/50'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
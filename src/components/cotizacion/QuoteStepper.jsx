import { Check } from 'lucide-react';

// Barra de progreso del viaje de cotización B2B. Muestra los 3 pasos del flujo
// con estado (completado / activo / pendiente) y línea de conexión animada.
const PASOS = ['Productos', 'Tus datos', 'Revisar'];

export default function QuoteStepper({ step, onStep, maxStep }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 max-w-md mx-auto">
      {PASOS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        const reachable = i <= maxStep;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              disabled={!reachable}
              onClick={() => reachable && onStep(i)}
              className="flex items-center gap-2 group disabled:cursor-not-allowed"
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? 'bg-[#0F8B6C] text-white'
                    : active
                    ? 'bg-[#0F8B6C] text-white ring-4 ring-[#0F8B6C]/15 scale-110'
                    : 'bg-white border border-[#EBE3D6] text-[#A78B6F]'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span
                className={`text-xs font-bold whitespace-nowrap transition-colors hidden sm:inline ${
                  active ? 'text-[#0F8B6C]' : done ? 'text-[#2A2420]' : 'text-[#A78B6F]'
                }`}
              >
                {label}
              </span>
            </button>
            {i < PASOS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 rounded-full bg-[#EBE3D6] overflow-hidden">
                <div
                  className="h-full bg-[#0F8B6C] transition-all duration-500"
                  style={{ width: done ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
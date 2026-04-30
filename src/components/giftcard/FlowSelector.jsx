import { Heart, Building2 } from 'lucide-react';

export default function FlowSelector({ flow, onChange }) {
  const opciones = [
    {
      id: 'b2c',
      icon: Heart,
      label: 'Para alguien especial',
      sub: 'Cumpleaños, aniversario, agradecimiento',
      gradient: 'from-pink-500/30 to-rose-500/30',
      border: 'border-pink-400/50',
      iconColor: 'text-pink-300',
    },
    {
      id: 'b2b',
      icon: Building2,
      label: 'Para mi empresa',
      sub: 'Volumen 5+ · Descuentos · Email branded',
      gradient: 'from-blue-500/30 to-indigo-500/30',
      border: 'border-blue-400/50',
      iconColor: 'text-blue-300',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-3 mb-8 max-w-3xl mx-auto">
      {opciones.map(o => {
        const Icon = o.icon;
        const active = flow === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={`text-left p-5 rounded-2xl border-2 transition-all backdrop-blur-md ${
              active
                ? `${o.border} bg-gradient-to-br ${o.gradient} shadow-2xl scale-[1.02]`
                : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                active ? 'bg-white/15' : 'bg-white/8'
              }`}>
                <Icon className={`w-5 h-5 ${active ? o.iconColor : 'text-white/60'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-poppins font-bold text-base ${active ? 'text-white' : 'text-white/80'}`}>
                  {o.label}
                </p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{o.sub}</p>
              </div>
              {active && (
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse flex-shrink-0 mt-1.5" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
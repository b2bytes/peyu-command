import { Moon, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// StudioModeToggle — Segmented pill Dark / Social para Social Studio.
// dark   = estudio nocturno sobrio (fondo profundo, glows sutiles)
// social = modo vibrante (gradiente fucsia/violeta/cian, glows intensos)
// ════════════════════════════════════════════════════════════════════════
export default function StudioModeToggle({ mode, onChange }) {
  const opts = [
    { id: 'dark', label: 'Dark', icon: Moon, accent: 'from-slate-600 to-slate-800' },
    { id: 'social', label: 'Social', icon: Sparkles, accent: 'from-fuchsia-500 to-violet-600' },
  ];
  return (
    <div className="inline-flex p-0.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl gap-0.5 flex-shrink-0">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            title={o.id === 'dark' ? 'Modo oscuro sobrio' : 'Modo social vibrante'}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              active ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {active && (
              <span className={`absolute inset-0 rounded-lg bg-gradient-to-br ${o.accent} opacity-90 shadow-md`} />
            )}
            <Icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
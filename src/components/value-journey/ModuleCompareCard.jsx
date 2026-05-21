// Card comparativa: módulo PEYU vs alternativa del mercado con precio CLP.
import { Check, ExternalLink } from 'lucide-react';
import { fmtCLP } from '@/lib/peyu-value-journey';

const TONE = {
  teal:     { ring: 'border-teal-500/30',     glow: 'bg-teal-500/10',     accent: 'text-teal-300' },
  cyan:     { ring: 'border-cyan-500/30',     glow: 'bg-cyan-500/10',     accent: 'text-cyan-300' },
  violet:   { ring: 'border-violet-500/30',   glow: 'bg-violet-500/10',   accent: 'text-violet-300' },
  emerald:  { ring: 'border-emerald-500/30',  glow: 'bg-emerald-500/10',  accent: 'text-emerald-300' },
  amber:    { ring: 'border-amber-500/30',    glow: 'bg-amber-500/10',    accent: 'text-amber-300' },
  fuchsia:  { ring: 'border-fuchsia-500/30',  glow: 'bg-fuchsia-500/10',  accent: 'text-fuchsia-300' },
  slate:    { ring: 'border-slate-500/30',    glow: 'bg-slate-500/10',    accent: 'text-slate-300' },
};

export default function ModuleCompareCard({ item, color = 'teal' }) {
  const t = TONE[color] || TONE.teal;
  return (
    <div className={`bg-slate-900 border ${t.ring} rounded-2xl p-4 md:p-5 flex flex-col h-full`}>
      <div className="flex-1 space-y-3">
        <div className="flex items-start gap-2">
          <Check className={`w-4 h-4 mt-1 flex-shrink-0 ${t.accent}`} />
          <h4 className="font-jakarta font-bold text-slate-50 text-[15px] md:text-base leading-snug">
            {item.modulo}
          </h4>
        </div>
        <p className="text-[13px] text-slate-400 font-inter leading-relaxed pl-6">
          {item.que_hace}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-1">
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 font-jakarta">
          Equivalente del mercado
        </p>
        <p className="text-slate-200 font-inter text-[13px] flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3 text-slate-500" />
          {item.alternativa}
        </p>
        <p className={`font-jakarta font-extrabold text-lg md:text-xl ${t.accent}`}>
          {fmtCLP(item.precio_mercado_clp)}
          <span className="text-[11px] font-medium text-slate-500 ml-1">/mes</span>
        </p>
        <p className="text-[10px] text-slate-600 font-mono">{item.precio_referencia}</p>
      </div>
    </div>
  );
}
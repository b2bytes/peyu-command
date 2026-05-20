// ============================================================================
// KeywordBucketSummary · Cards-resumen por bucket de posición.
// Rediseño 2026: fondos sólidos (slate-900) en vez de transparentes,
// contraste alto, responsive real (2 cols mobile / 5 desktop).
// ============================================================================
import { Trophy, Medal, Target, ArrowUpRight, MinusCircle } from 'lucide-react';

const BUCKETS = [
  { key: 'top3',  label: 'TOP 3',       sub: 'Pos 1-3',     icon: Trophy,      tone: 'emerald' },
  { key: 'top10', label: 'Página 1',    sub: 'Pos 4-10',    icon: Medal,       tone: 'teal' },
  { key: 'top20', label: 'Página 2',    sub: 'Pos 11-20',   icon: ArrowUpRight,tone: 'amber' },
  { key: 'top50', label: 'Pos 21-50',   sub: 'Necesita SEO',icon: Target,      tone: 'cyan' },
  { key: 'fondo', label: 'Fondo +50',   sub: 'Invisibles',  icon: MinusCircle, tone: 'rose' },
];

const TONE = {
  emerald: { ring: 'border-emerald-500/40', icon: 'text-emerald-300', text: 'text-emerald-100', glow: 'bg-emerald-500/15' },
  teal:    { ring: 'border-teal-500/40',    icon: 'text-teal-300',    text: 'text-teal-100',    glow: 'bg-teal-500/15' },
  amber:   { ring: 'border-amber-500/40',   icon: 'text-amber-300',   text: 'text-amber-100',   glow: 'bg-amber-500/15' },
  cyan:    { ring: 'border-cyan-500/40',    icon: 'text-cyan-300',    text: 'text-cyan-100',    glow: 'bg-cyan-500/15' },
  rose:    { ring: 'border-rose-500/40',    icon: 'text-rose-300',    text: 'text-rose-100',    glow: 'bg-rose-500/15' },
};

export default function KeywordBucketSummary({ summary, total }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
      {BUCKETS.map(b => {
        const Icon = b.icon;
        const t = TONE[b.tone];
        const count = summary[b.key] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={b.key} className={`bg-slate-900 border ${t.ring} rounded-2xl p-3 md:p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className={`w-7 h-7 rounded-lg ${t.glow} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${t.icon}`} />
              </div>
              <span className={`text-[10px] font-bold font-jakarta ${t.text} opacity-80`}>{pct}%</span>
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 font-jakarta">{b.label}</p>
            <p className={`font-jakarta font-extrabold text-2xl md:text-3xl tracking-tight leading-none ${t.text} mb-1`}>
              {count}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight font-inter">{b.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
// ============================================================================
// KeywordBucketSummary · Cards-resumen por bucket de posición
// ============================================================================
import { Trophy, Medal, Target, ArrowUpRight, MinusCircle } from 'lucide-react';

const BUCKETS = [
  { key: 'top3',  label: 'TOP 3',       sub: 'Pos 1-3 · Campeón',         icon: Trophy,      tone: 'emerald' },
  { key: 'top10', label: 'Página 1',    sub: 'Pos 4-10 · Primera',        icon: Medal,       tone: 'teal' },
  { key: 'top20', label: 'Página 2',    sub: 'Pos 11-20 · Oportunidad',   icon: ArrowUpRight,tone: 'amber' },
  { key: 'top50', label: 'Pos 21-50',   sub: 'Requieren trabajo SEO',     icon: Target,      tone: 'cyan' },
  { key: 'fondo', label: 'Fondo',       sub: 'Pos +50 · Casi invisibles', icon: MinusCircle, tone: 'rose' },
];

const TONE = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/25 text-emerald-200',
  teal:    'from-teal-500/15 to-teal-500/5 border-teal-400/20 text-teal-200',
  amber:   'from-amber-500/15 to-amber-500/5 border-amber-400/20 text-amber-200',
  cyan:    'from-cyan-500/15 to-cyan-500/5 border-cyan-400/20 text-cyan-200',
  rose:    'from-rose-500/15 to-rose-500/5 border-rose-400/20 text-rose-200',
};

export default function KeywordBucketSummary({ summary, total }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {BUCKETS.map(b => {
        const Icon = b.icon;
        const count = summary[b.key] || 0;
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={b.key} className={`bg-gradient-to-br border rounded-2xl p-4 ${TONE[b.tone]}`}>
            <Icon className="w-4 h-4 opacity-80 mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-bold opacity-70 mb-1">{b.label}</p>
            <p className="font-jakarta font-extrabold text-2xl tracking-tight leading-none mb-1">
              {count} <span className="text-[10px] opacity-60 font-normal">/ {pct}%</span>
            </p>
            <p className="text-[10px] opacity-60 leading-tight">{b.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
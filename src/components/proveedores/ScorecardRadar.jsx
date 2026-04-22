import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { toRadarData, computeGlobalScore, scoreTier } from '@/lib/supplier-scorecard';

/**
 * Radar 360° del scorecard del proveedor.
 * Recibe un proveedor o una evaluación con los 6 scores.
 */
export default function ScorecardRadar({ data, size = 'md', showScore = true }) {
  const radarData = toRadarData(data);
  const globalScore = data?.score_global ?? computeGlobalScore(data);
  const tier = scoreTier(globalScore);

  const sizes = {
    sm: { h: 180, outer: 60, fontSize: 10 },
    md: { h: 260, outer: 90, fontSize: 11 },
    lg: { h: 340, outer: 120, fontSize: 12 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className="relative w-full">
      <ResponsiveContainer width="100%" height={s.h}>
        <RadarChart data={radarData} outerRadius={s.outer}>
          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#4B4F54', fontSize: s.fontSize, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9CA3AF', fontSize: 9 }}
            stroke="#e5e7eb"
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#0F8B6C"
            fill="#0F8B6C"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {showScore && globalScore != null && (
        <div className="absolute top-2 right-2 flex flex-col items-center bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg border border-border">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">Score</span>
          <span className="font-poppins font-black text-2xl leading-none" style={{ color: tier.color }}>
            {globalScore}
          </span>
          <span className="text-[9px] font-bold mt-0.5" style={{ color: tier.color }}>
            {tier.label}
          </span>
        </div>
      )}
    </div>
  );
}
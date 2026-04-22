import { riskBadge, tierBadge } from '@/lib/supplier-scorecard';

export function RiskPill({ nivel }) {
  const r = riskBadge(nivel);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${r.bg}`}>
      <span>{r.icon}</span>
      <span>Riesgo {nivel || '—'}</span>
    </span>
  );
}

export function TierPill({ tier }) {
  if (!tier) return null;
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border ${tierBadge(tier)}`}>
      {tier.replace(/^Tier (\d) - /, 'T$1 · ')}
    </span>
  );
}
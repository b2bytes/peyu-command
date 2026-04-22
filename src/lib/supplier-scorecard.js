// ============================================================
// PEYU — Lógica de Scorecard 360° de proveedores
// Basado en best practices SAP Ariba / Coupa / Ivalua 2026.
//
// 6 dimensiones ponderadas (suma = 100%):
//   Calidad         20%
//   Entregas OTIF   20%
//   Precio/Costo    15%
//   Servicio        15%
//   ESG             15%
//   Riesgo          15%
// ============================================================

export const SCORECARD_DIMENSIONS = [
  { key: 'score_calidad',       label: 'Calidad',          peso: 0.20, color: '#0F8B6C', icon: '✅' },
  { key: 'score_entrega_otif',  label: 'Entregas OTIF',    peso: 0.20, color: '#0EA5E9', icon: '📦' },
  { key: 'score_precio',        label: 'Precio / Costo',   peso: 0.15, color: '#F59E0B', icon: '💰' },
  { key: 'score_servicio',      label: 'Servicio',         peso: 0.15, color: '#8B5CF6', icon: '🤝' },
  { key: 'score_esg',           label: 'ESG / Sust.',      peso: 0.15, color: '#10B981', icon: '♻️' },
  { key: 'score_riesgo',        label: 'Riesgo (bajo)',    peso: 0.15, color: '#EC4899', icon: '🛡️' },
];

// Calcula score global ponderado (0-100) desde un objeto Proveedor o Evaluación.
export function computeGlobalScore(src = {}) {
  let total = 0, pesoTotal = 0;
  for (const dim of SCORECARD_DIMENSIONS) {
    const v = Number(src[dim.key]);
    if (!isNaN(v)) {
      total += v * dim.peso;
      pesoTotal += dim.peso;
    }
  }
  if (pesoTotal === 0) return null;
  return Math.round(total / pesoTotal);
}

// Etiqueta + color según score global.
export function scoreTier(score) {
  if (score == null) return { label: 'Sin datos', color: '#9CA3AF', bg: 'bg-gray-100', text: 'text-gray-500' };
  if (score >= 85)   return { label: 'Excelente',  color: '#059669', bg: 'bg-emerald-100', text: 'text-emerald-700' };
  if (score >= 70)   return { label: 'Bueno',      color: '#0284C7', bg: 'bg-sky-100',     text: 'text-sky-700' };
  if (score >= 55)   return { label: 'Regular',    color: '#D97706', bg: 'bg-amber-100',   text: 'text-amber-700' };
  if (score >= 40)   return { label: 'Deficiente', color: '#DC2626', bg: 'bg-red-100',     text: 'text-red-700' };
  return               { label: 'Crítico',    color: '#7F1D1D', bg: 'bg-red-200',     text: 'text-red-900' };
}

// Semáforo de riesgo (4 niveles).
export function riskBadge(nivel) {
  switch (nivel) {
    case 'Bajo':    return { color: '#059669', bg: 'bg-emerald-100 text-emerald-700', icon: '🟢' };
    case 'Medio':   return { color: '#D97706', bg: 'bg-amber-100 text-amber-700',     icon: '🟡' };
    case 'Alto':    return { color: '#DC2626', bg: 'bg-red-100 text-red-700',         icon: '🔴' };
    case 'Crítico': return { color: '#7F1D1D', bg: 'bg-red-200 text-red-900',         icon: '⚫' };
    default:        return { color: '#6B7280', bg: 'bg-gray-100 text-gray-600',       icon: '⚪' };
  }
}

// Tier estratégico badge.
export function tierBadge(tier) {
  switch (tier) {
    case 'Tier 1 - Estratégico':  return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Tier 2 - Preferente':   return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Tier 3 - Transaccional':return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'Tier 4 - Backup':       return 'bg-slate-100 text-slate-600 border-slate-200';
    default:                      return 'bg-gray-100 text-gray-500';
  }
}

// Transforma un proveedor en datos para recharts RadarChart.
export function toRadarData(src = {}) {
  return SCORECARD_DIMENSIONS.map(dim => ({
    dimension: dim.label,
    score: Number(src[dim.key]) || 0,
    fullMark: 100,
  }));
}

// Utilidad: formato CLP compacto.
export const fmtClp = (n) => {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

// Bandera emoji por código ISO país.
export function countryFlag(iso) {
  if (!iso || iso.length !== 2) return '🌍';
  const codePoints = iso
    .toUpperCase()
    .split('')
    .map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
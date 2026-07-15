import { CreditCard, Coins, TrendingDown, CalendarClock } from 'lucide-react';

const fmtCLP = (n) => `$${Math.round(n).toLocaleString('es-CL')}`;
const fmtNum = (n) => Math.round(n).toLocaleString('es-CL');

// Tarjeta principal del plan: divide el fee mensual (490.000 CLP) en los
// créditos incluidos y muestra consumo, restante y proyección de fin de mes.
export default function PlanCreditosCard({ config, onChange }) {
  const { feeCLP, creditosIncluidos, creditosUsados } = config;
  const clpPorCredito = creditosIncluidos > 0 ? feeCLP / creditosIncluidos : 0;
  const usados = Math.min(creditosUsados, creditosIncluidos);
  const pct = creditosIncluidos > 0 ? (usados / creditosIncluidos) * 100 : 0;
  const clpConsumidos = usados * clpPorCredito;
  const restantes = Math.max(0, creditosIncluidos - creditosUsados);

  // Proyección: run-rate según el día del mes
  const now = new Date();
  const diaDelMes = now.getDate();
  const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const proyeccion = diaDelMes > 0 ? (creditosUsados / diaDelMes) * diasMes : 0;
  const sobrepasa = proyeccion > creditosIncluidos;

  const barColor = pct >= 90 ? '#DC2626' : pct >= 70 ? '#D96B4D' : '#0F8B6C';

  return (
    <div className="ld-card p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--ld-action-soft)' }}>
            <CreditCard className="w-5 h-5 text-ld-action" />
          </div>
          <div>
            <p className="text-sm font-bold text-ld-fg">Plan mensual PEYU Chile</p>
            <p className="text-xs text-ld-fg-muted">Facturación fija · renueva cada mes</p>
          </div>
        </div>
        <p className="ld-display text-3xl text-ld-fg">{fmtCLP(feeCLP)}<span className="text-sm font-sans font-semibold text-ld-fg-muted"> /mes</span></p>
      </div>

      {/* Inputs editables: créditos del plan y usados (se copian del panel Base44) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">Créditos incluidos / mes</span>
          <input
            type="number" min="1"
            value={creditosIncluidos}
            onChange={(e) => onChange({ ...config, creditosIncluidos: Number(e.target.value) || 0 })}
            className="ld-input mt-1 w-full px-4 py-2 text-sm font-semibold"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">Créditos usados este mes</span>
          <input
            type="number" min="0"
            value={creditosUsados}
            onChange={(e) => onChange({ ...config, creditosUsados: Number(e.target.value) || 0 })}
            className="ld-input mt-1 w-full px-4 py-2 text-sm font-semibold"
          />
        </label>
        <div className="rounded-2xl px-4 py-2.5 flex flex-col justify-center" style={{ background: 'var(--ld-bg-soft)', border: '1px solid var(--ld-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">Valor por crédito</span>
          <span className="text-lg font-bold text-ld-action">{fmtCLP(clpPorCredito)} <span className="text-xs text-ld-fg-muted font-semibold">CLP/crédito</span></span>
        </div>
      </div>
      <p className="text-[11px] text-ld-fg-muted -mt-3">
        Los créditos usados se copian desde el panel de Base44 (Workspace → Billing/Usage). Se guardan en este navegador.
      </p>

      {/* Barra de consumo */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-ld-fg">{fmtNum(creditosUsados)} de {fmtNum(creditosIncluidos)} créditos usados</span>
          <span className="text-xs font-bold" style={{ color: barColor }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--ld-bg-soft)', border: '1px solid var(--ld-border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
        </div>
      </div>

      {/* KPIs derivados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Kpi icon={Coins} label="CLP consumidos" value={fmtCLP(clpConsumidos)} sub={`de ${fmtCLP(feeCLP)}`} />
        <Kpi icon={TrendingDown} label="Créditos restantes" value={fmtNum(restantes)} sub={`≈ ${fmtCLP(restantes * clpPorCredito)}`} />
        <Kpi
          icon={CalendarClock}
          label="Proyección fin de mes"
          value={fmtNum(proyeccion)}
          sub={sobrepasa ? `⚠ sobrepasaría el plan (+${fmtNum(proyeccion - creditosIncluidos)})` : 'dentro del plan'}
          warn={sobrepasa}
        />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, warn }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--ld-bg-soft)', border: '1px solid var(--ld-border)' }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-ld-fg-muted" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-ld-fg-muted">{label}</span>
      </div>
      <p className="text-xl font-bold text-ld-fg">{value}</p>
      <p className={`text-[11px] font-semibold ${warn ? 'text-red-600' : 'text-ld-fg-muted'}`}>{sub}</p>
    </div>
  );
}
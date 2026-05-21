// Tabla proyección ROI mes a mes con campañas pagadas + orgánico.
import { TrendingUp, ArrowDown } from 'lucide-react';
import { fmtCLP, ROI_PROYECCION } from '@/lib/peyu-value-journey';

export default function ROITable() {
  // Total acumulado para mostrar contexto.
  const totalVentas = ROI_PROYECCION.reduce((s, r) => s + r.ventas_proyectadas_clp + r.ingresos_organicos_clp, 0);
  const totalInversion = ROI_PROYECCION.reduce((s, r) => s + r.inversion_ads_clp, 0);

  return (
    <div className="space-y-4">
      {/* Vista mobile: cards apiladas */}
      <div className="md:hidden space-y-3">
        {ROI_PROYECCION.map((r) => {
          const total = r.ventas_proyectadas_clp + r.ingresos_organicos_clp;
          const roas = r.inversion_ads_clp > 0 ? (r.ventas_proyectadas_clp / r.inversion_ads_clp).toFixed(1) : null;
          return (
            <div key={r.mes} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h4 className="font-jakarta font-bold text-slate-50 text-base">{r.mes}</h4>
                {roas && (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded">
                    ROAS {roas}x
                  </span>
                )}
              </div>
              <p className="text-[12px] text-slate-400 font-inter mb-3">{r.estado}</p>
              <div className="grid grid-cols-2 gap-2 text-[12px] font-inter">
                <Stat label="Inversión Ads" value={r.inversion_ads_clp ? fmtCLP(r.inversion_ads_clp) : '—'} tone="rose" />
                <Stat label="Ventas Ads" value={r.ventas_proyectadas_clp ? fmtCLP(r.ventas_proyectadas_clp) : '—'} tone="teal" />
                <Stat label="Orgánico" value={fmtCLP(r.ingresos_organicos_clp)} tone="cyan" />
                <Stat label="Leads B2B" value={r.leads_b2b} tone="amber" />
              </div>
              <p className="text-[11px] text-slate-500 font-inter italic mt-3 leading-relaxed">{r.nota}</p>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-jakarta">Total mes</span>
                <p className="font-jakarta font-extrabold text-emerald-300 text-xl">{fmtCLP(total)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-500 font-jakarta font-bold">
            <tr>
              <th className="px-4 py-3 text-left">Mes</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-right">Ads</th>
              <th className="px-4 py-3 text-right">Ventas Ads</th>
              <th className="px-4 py-3 text-right">Orgánico</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">ROAS</th>
              <th className="px-4 py-3 text-right">Leads B2B</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ROI_PROYECCION.map((r) => {
              const total = r.ventas_proyectadas_clp + r.ingresos_organicos_clp;
              const roas = r.inversion_ads_clp > 0 ? (r.ventas_proyectadas_clp / r.inversion_ads_clp).toFixed(1) : '—';
              return (
                <tr key={r.mes} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-jakarta font-bold text-slate-50">{r.mes}</td>
                  <td className="px-4 py-3 text-slate-400 text-[12px]">{r.estado}</td>
                  <td className="px-4 py-3 text-right text-rose-300 font-mono">
                    {r.inversion_ads_clp ? fmtCLP(r.inversion_ads_clp) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-teal-300 font-mono">
                    {r.ventas_proyectadas_clp ? fmtCLP(r.ventas_proyectadas_clp) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-cyan-300 font-mono">{fmtCLP(r.ingresos_organicos_clp)}</td>
                  <td className="px-4 py-3 text-right font-jakarta font-extrabold text-emerald-300">{fmtCLP(total)}</td>
                  <td className="px-4 py-3 text-center">
                    {roas !== '—' ? (
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded">
                        {roas}x
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-300 font-mono">{r.leads_b2b}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-950/80 font-jakarta font-extrabold">
              <td className="px-4 py-4 text-slate-50" colSpan={2}>Acumulado 6 meses</td>
              <td className="px-4 py-4 text-right text-rose-300 font-mono">{fmtCLP(totalInversion)}</td>
              <td className="px-4 py-4 text-right text-slate-500" colSpan={2}>→</td>
              <td className="px-4 py-4 text-right text-emerald-300 text-base">{fmtCLP(totalVentas)}</td>
              <td className="px-4 py-4 text-center text-emerald-300">
                {(ROI_PROYECCION.reduce((s, r) => s + r.ventas_proyectadas_clp, 0) / totalInversion).toFixed(1)}x
              </td>
              <td className="px-4 py-4 text-right text-amber-300 font-mono">
                {ROI_PROYECCION.reduce((s, r) => s + r.leads_b2b, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-500 font-inter text-center italic">
        Proyección conservadora basada en benchmarks PYME Chile · AOV B2C ~$45K · conv 1.5% · AOV B2B ~$650K · GSC actual 7.12% CTR
      </p>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const COLORS = {
    rose: 'text-rose-300',
    teal: 'text-teal-300',
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
  };
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-jakarta">{label}</p>
      <p className={`font-jakarta font-bold ${COLORS[tone]}`}>{value}</p>
    </div>
  );
}
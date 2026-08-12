/**
 * Una fila del embudo de checkout: barra proporcional + caída respecto al paso
 * anterior. Pensada para leerse de un vistazo en el Cockpit.
 */
export default function CheckoutFunnelStep({ label, hint, valor, base, previo, color }) {
  const pctBase = base > 0 ? Math.round((valor / base) * 100) : 0;
  const caida = previo != null ? previo - valor : null;
  const pctCaida = previo > 0 ? Math.round((caida / previo) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-tight truncate">{label}</p>
          <p className="text-[11px] text-white/65 leading-tight truncate">{hint}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="font-mono font-black text-white text-lg leading-none">{valor}</span>
          <span className="text-[11px] text-white/70 ml-1">{pctBase}%</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pctBase, 2)}%`, background: color }} />
      </div>

      {caida > 0 && (
        <p className="text-[11px] font-semibold text-rose-200">
          ↓ Se cayeron {caida} aquí ({pctCaida}% del paso anterior)
        </p>
      )}
    </div>
  );
}
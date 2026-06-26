const ESTADOS = [
  { id: "Planificada", color: "border-sky-500/40 bg-sky-500/5", dot: "bg-sky-400", text: "text-sky-300" },
  { id: "En revisión", color: "border-amber-500/40 bg-amber-500/5", dot: "bg-amber-400", text: "text-amber-300" },
  { id: "Activa", color: "border-emerald-500/40 bg-emerald-500/5", dot: "bg-emerald-400", text: "text-emerald-300" },
  { id: "Pausada", color: "border-orange-500/40 bg-orange-500/5", dot: "bg-orange-400", text: "text-orange-300" },
  { id: "Finalizada", color: "border-white/15 bg-white/[0.02]", dot: "bg-white/40", text: "text-white/50" },
];

const CANAL_DOT = {
  "Meta Ads": "bg-blue-400",
  "Google Search": "bg-cyan-400",
  "TikTok Ads": "bg-pink-400",
  "LinkedIn Ads": "bg-sky-400",
  "Email": "bg-amber-400",
  "WhatsApp": "bg-emerald-400",
  "Orgánico Instagram": "bg-fuchsia-400",
  "Orgánico TikTok": "bg-rose-400",
};

const fmtM = (v) => `$${(Number(v || 0) / 1_000_000).toFixed(1)}M`;

export default function CampaignPipeline({ campanas, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
      {ESTADOS.map((col) => {
        const items = campanas.filter((c) => c.estado === col.id);
        const gasto = items.reduce((s, c) => s + (c.gasto_real_clp || c.presupuesto_clp || 0), 0);
        return (
          <div key={col.id} className={`rounded-2xl border ${col.color} p-3 flex flex-col min-h-[120px]`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wide ${col.text}`}>{col.id}</span>
              </div>
              <span className="text-[11px] font-black text-white/70">{items.length}</span>
            </div>
            {gasto > 0 && <p className="text-[10px] text-white/30 mb-2 -mt-1.5">{fmtM(gasto)}</p>}
            <div className="space-y-1.5 flex-1">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect?.(c)}
                  className="w-full text-left rounded-lg bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-all p-2"
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${CANAL_DOT[c.canal] || "bg-white/40"}`} />
                    <p className="text-[11px] font-semibold text-white/85 leading-tight truncate">{c.nombre}</p>
                  </div>
                  <p className="text-[9px] text-white/40 truncate">{c.canal} · {c.objetivo}</p>
                </button>
              ))}
              {items.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/10 py-3 text-center">
                  <span className="text-[10px] text-white/25">Vacío</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
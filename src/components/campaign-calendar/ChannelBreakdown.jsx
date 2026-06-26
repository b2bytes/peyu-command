import { Facebook, Search, Music2, Linkedin, Mail, MessageCircle, Instagram, Hash } from "lucide-react";

const fmtM = (v) => `$${(Number(v || 0) / 1_000_000).toFixed(1)}M`;

const CANAL_META = {
  "Meta Ads": { icon: Facebook, color: "from-blue-600 to-indigo-600", bar: "bg-blue-500" },
  "Google Search": { icon: Search, color: "from-cyan-500 to-blue-600", bar: "bg-cyan-500" },
  "TikTok Ads": { icon: Music2, color: "from-pink-500 to-rose-600", bar: "bg-pink-500" },
  "LinkedIn Ads": { icon: Linkedin, color: "from-sky-500 to-blue-600", bar: "bg-sky-500" },
  "Email": { icon: Mail, color: "from-amber-400 to-orange-500", bar: "bg-amber-500" },
  "WhatsApp": { icon: MessageCircle, color: "from-emerald-400 to-teal-500", bar: "bg-emerald-500" },
  "Orgánico Instagram": { icon: Instagram, color: "from-fuchsia-500 to-purple-600", bar: "bg-fuchsia-500" },
  "Orgánico TikTok": { icon: Hash, color: "from-rose-500 to-pink-600", bar: "bg-rose-500" },
};

export default function ChannelBreakdown({ campanas }) {
  const porCanal = {};
  campanas.forEach((c) => {
    if (!porCanal[c.canal]) porCanal[c.canal] = { count: 0, gasto: 0, presupuesto: 0 };
    porCanal[c.canal].count += 1;
    porCanal[c.canal].gasto += c.gasto_real_clp || 0;
    porCanal[c.canal].presupuesto += c.presupuesto_clp || 0;
  });

  const filas = Object.entries(porCanal).sort((a, b) => b[1].count - a[1].count);
  const maxCount = Math.max(1, ...filas.map(([, v]) => v.count));

  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 p-4">
      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Campañas por canal</p>
      <div className="space-y-2.5">
        {filas.map(([canal, v]) => {
          const meta = CANAL_META[canal] || { icon: Hash, color: "from-white/20 to-white/10", bar: "bg-white/40" };
          const Icon = meta.icon;
          return (
            <div key={canal} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-white/85 truncate">{canal}</p>
                  <p className="text-[11px] text-white/50 flex-shrink-0 ml-2">
                    {v.count} {v.count === 1 ? "campaña" : "campañas"}
                    {v.gasto > 0 && <span className="text-white/30"> · {fmtM(v.gasto)}</span>}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${(v.count / maxCount) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
        {filas.length === 0 && <p className="text-xs text-white/30 text-center py-4">Sin campañas registradas</p>}
      </div>
    </div>
  );
}
import { Rocket, Wallet, TrendingUp, Target, Users, Banknote } from "lucide-react";

const fmtCLP = (v) => `$${Number(v || 0).toLocaleString("es-CL")}`;
const fmtM = (v) => `$${(Number(v || 0) / 1_000_000).toFixed(1)}M`;

export default function CampaignKPIs({ campanas }) {
  const activas = campanas.filter((c) => c.estado === "Activa");
  const presupuesto = campanas.reduce((s, c) => s + (c.presupuesto_clp || 0), 0);
  const gasto = campanas.reduce((s, c) => s + (c.gasto_real_clp || 0), 0);
  const conversiones = campanas.reduce((s, c) => s + (c.conversiones || 0), 0);
  const leads = campanas.reduce((s, c) => s + (c.leads_generados || 0), 0);
  const conRoas = campanas.filter((c) => c.roas > 0);
  const roasProm = conRoas.length
    ? conRoas.reduce((s, c) => s + c.roas, 0) / conRoas.length
    : 0;

  const kpis = [
    { label: "Campañas activas", value: activas.length, sub: `${campanas.length} totales`, icon: Rocket, color: "from-violet-500 to-pink-600", text: "text-violet-300" },
    { label: "Presupuesto total", value: fmtM(presupuesto), sub: "asignado", icon: Wallet, color: "from-cyan-500 to-blue-600", text: "text-cyan-300" },
    { label: "Gasto real", value: fmtM(gasto), sub: presupuesto ? `${Math.round((gasto / presupuesto) * 100)}% usado` : "—", icon: Banknote, color: "from-amber-400 to-orange-500", text: "text-amber-300" },
    { label: "ROAS promedio", value: roasProm ? `${roasProm.toFixed(1)}x` : "—", sub: `${conRoas.length} con datos`, icon: TrendingUp, color: "from-emerald-400 to-teal-500", text: "text-emerald-300" },
    { label: "Conversiones", value: conversiones, sub: "atribuidas", icon: Target, color: "from-pink-500 to-rose-600", text: "text-pink-300" },
    { label: "Leads generados", value: leads, sub: "captados", icon: Users, color: "from-sky-500 to-indigo-600", text: "text-sky-300" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div key={i} className="rounded-2xl bg-black/30 border border-white/10 p-3.5">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center shadow-md mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className={`text-2xl font-black leading-none ${k.text}`}>{k.value}</p>
            <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-wide leading-tight">{k.label}</p>
            <p className="text-[10px] text-white/30 leading-tight">{k.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
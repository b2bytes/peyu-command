import { ChevronLeft, ChevronRight } from "lucide-react";

const CANAL_BAR = {
  "Meta Ads": "bg-blue-500/80 border-blue-400",
  "Google Search": "bg-cyan-500/80 border-cyan-400",
  "TikTok Ads": "bg-pink-500/80 border-pink-400",
  "LinkedIn Ads": "bg-sky-500/80 border-sky-400",
  "Email": "bg-amber-500/80 border-amber-400",
  "WhatsApp": "bg-emerald-500/80 border-emerald-400",
  "Orgánico Instagram": "bg-fuchsia-500/80 border-fuchsia-400",
  "Orgánico TikTok": "bg-rose-500/80 border-rose-400",
};

const DIAS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const ymd = (d) => d.toISOString().slice(0, 10);

export default function CampaignMonthGrid({ campanas, monthDate, onPrev, onNext, onToday, onSelect }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = ymd(new Date());

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Campañas que tocan un día dado (con fecha_inicio/fin)
  const campanasEn = (date) => {
    const ds = ymd(date);
    return campanas.filter((c) => {
      if (!c.fecha_inicio) return false;
      const ini = c.fecha_inicio.slice(0, 10);
      const fin = (c.fecha_fin || c.fecha_inicio).slice(0, 10);
      return ds >= ini && ds <= fin;
    });
  };

  const sinFecha = campanas.filter((c) => !c.fecha_inicio);

  const mesLabel = monthDate.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="text-sm font-bold text-white capitalize">{mesLabel}</p>
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={onToday} className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-white/80 transition-colors">Hoy</button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-white/[0.07]">
        {DIAS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[10px] font-semibold text-white/35 tracking-wide">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[88px] border-r border-b border-white/[0.04] bg-white/[0.01]" />;
          const ds = ymd(date);
          const isToday = ds === todayStr;
          const items = campanasEn(date);
          // Solo mostramos la barra el primer día visible de la semana o inicio
          return (
            <div key={i} className="min-h-[88px] border-r border-b border-white/[0.04] p-1.5 relative">
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mb-1 ${isToday ? "bg-gradient-to-br from-violet-500 to-pink-600 text-white" : "text-white/40"}`}>
                {date.getDate()}
              </span>
              <div className="space-y-1">
                {items.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelect?.(c)}
                    className={`w-full text-left text-[9px] leading-tight px-1.5 py-0.5 rounded border-l-2 text-white/90 truncate ${CANAL_BAR[c.canal] || "bg-white/20 border-white/40"}`}
                    title={c.nombre}
                  >
                    {c.nombre}
                  </button>
                ))}
                {items.length > 3 && <p className="text-[9px] text-white/35 px-1">+{items.length - 3} más</p>}
              </div>
            </div>
          );
        })}
      </div>

      {sinFecha.length > 0 && (
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-white/35 uppercase tracking-wide">Sin fecha:</span>
          {sinFecha.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c)}
              className={`text-[10px] px-2 py-0.5 rounded-full border-l-2 text-white/80 ${CANAL_BAR[c.canal] || "bg-white/20 border-white/40"}`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
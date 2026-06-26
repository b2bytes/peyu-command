import { X, Pencil, Trash2 } from "lucide-react";

const fmtCLP = (v) => (v ? `$${Number(v).toLocaleString("es-CL")}` : "—");
const fmtDate = (d) => (d ? new Date(d.slice(0, 10) + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "2-digit" }) : "—");

const ESTADO_COLOR = {
  Activa: "bg-emerald-500/20 text-emerald-300",
  Planificada: "bg-sky-500/20 text-sky-300",
  "En revisión": "bg-amber-500/20 text-amber-300",
  Pausada: "bg-orange-500/20 text-orange-300",
  Finalizada: "bg-white/10 text-white/50",
};

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3">
      <p className="text-[10px] text-white/40 uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-white/90 mt-0.5">{value}</p>
    </div>
  );
}

export default function CampaignDetailDrawer({ campana, onClose, onEdit, onDelete }) {
  if (!campana) return null;
  const c = campana;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-slate-950 border-l border-white/10 overflow-y-auto peyu-scrollbar-light"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur">
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
            <p className="text-[11px] text-white/40">{c.canal} · {c.objetivo}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${ESTADO_COLOR[c.estado] || "bg-white/10 text-white/60"}`}>{c.estado}</span>
            {c.tipo_contenido && <span className="text-[11px] text-white/50 px-2.5 py-1 rounded-full bg-white/[0.05]">{c.tipo_contenido}</span>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stat label="Inicio" value={fmtDate(c.fecha_inicio)} />
            <Stat label="Fin" value={fmtDate(c.fecha_fin)} />
            <Stat label="Presupuesto" value={fmtCLP(c.presupuesto_clp)} />
            <Stat label="Gasto real" value={fmtCLP(c.gasto_real_clp)} />
          </div>

          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Rendimiento</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Impresiones" value={Number(c.impresiones || 0).toLocaleString("es-CL")} />
              <Stat label="Clics" value={Number(c.clics || 0).toLocaleString("es-CL")} />
              <Stat label="CTR" value={c.ctr_pct ? `${c.ctr_pct}%` : "—"} />
              <Stat label="Conversiones" value={c.conversiones || 0} />
              <Stat label="Leads" value={c.leads_generados || 0} />
              <Stat label="ROAS" value={c.roas ? `${c.roas}x` : "—"} />
              <Stat label="CAC" value={fmtCLP(c.cac_clp)} />
              <Stat label="SKU" value={c.sku_promovido || "—"} />
            </div>
          </div>

          {c.publico && (
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Público</p>
              <p className="text-sm text-white/80">{c.publico}</p>
            </div>
          )}
          {c.notas && (
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3">
              <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Notas</p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{c.notas}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => onEdit(c)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90">
              <Pencil className="w-4 h-4" /> Editar
            </button>
            <button onClick={() => onDelete(c)} className="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-300 hover:bg-red-500/25 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
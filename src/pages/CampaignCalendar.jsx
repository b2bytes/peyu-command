// ============================================================================
// CampaignCalendar · Calendario de Campañas con pipeline + estadísticas.
// Muestra cuántas campañas corren, por qué medio/canal, su pipeline por estado,
// un calendario mensual y stats en vivo. Lee de la entidad Campana.
// Dark-first, mismo lenguaje visual que el Social Studio.
// ============================================================================
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Megaphone, Plus, Loader2, LayoutGrid, CalendarDays } from "lucide-react";
import CampaignKPIs from "@/components/campaign-calendar/CampaignKPIs";
import CampaignPipeline from "@/components/campaign-calendar/CampaignPipeline";
import ChannelBreakdown from "@/components/campaign-calendar/ChannelBreakdown";
import CampaignMonthGrid from "@/components/campaign-calendar/CampaignMonthGrid";
import CampaignDetailDrawer from "@/components/campaign-calendar/CampaignDetailDrawer";
import CampaignFormModal from "@/components/campaign-calendar/CampaignFormModal";

export default function CampaignCalendar() {
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Dark-first como el Social Studio
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-liquid-mode");
    document.documentElement.setAttribute("data-liquid-mode", "night");
    return () => document.documentElement.setAttribute("data-liquid-mode", prev || "day");
  }, []);

  const load = async () => {
    setLoading(true);
    const rows = await base44.entities.Campana.list("-created_date", 300);
    setCampanas(rows);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setSelected(null); setEditing(c); setFormOpen(true); };
  const onSaved = () => { setFormOpen(false); setEditing(null); load(); };
  const handleDelete = async (c) => {
    if (!confirm(`¿Eliminar la campaña "${c.nombre}"?`)) return;
    await base44.entities.Campana.delete(c.id);
    setSelected(null);
    load();
  };

  const shiftMonth = (n) => setMonthDate((d) => { const nd = new Date(d); nd.setMonth(nd.getMonth() + n); return nd; });
  const goToday = () => { const d = new Date(); d.setDate(1); setMonthDate(d); };

  return (
    <div className="min-h-full ld-canvas relative" style={{ background: "var(--ld-grad-canvas)" }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative p-4 lg:p-6 space-y-4 max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-none">Calendario de Campañas</h1>
              <p className="text-[12px] text-white/40 mt-1">Cuántas corren, por qué medio y canal · pipeline + estadísticas</p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-violet-500/20">
            <Plus className="w-4 h-4" /> Nueva campaña
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : (
          <>
            <CampaignKPIs campanas={campanas} />

            <div>
              <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" /> Pipeline por estado
              </p>
              <CampaignPipeline campanas={campanas} onSelect={setSelected} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Calendario mensual
                </p>
                <CampaignMonthGrid
                  campanas={campanas}
                  monthDate={monthDate}
                  onPrev={() => shiftMonth(-1)}
                  onNext={() => shiftMonth(1)}
                  onToday={goToday}
                  onSelect={setSelected}
                />
              </div>
              <div className="space-y-4">
                <ChannelBreakdown campanas={campanas} />
              </div>
            </div>
          </>
        )}
      </div>

      <CampaignDetailDrawer campana={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} />
      <CampaignFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
    </div>
  );
}
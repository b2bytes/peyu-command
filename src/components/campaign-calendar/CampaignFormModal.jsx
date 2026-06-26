import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CANALES = ["Meta Ads", "Google Search", "TikTok Ads", "LinkedIn Ads", "Email", "WhatsApp", "Orgánico Instagram", "Orgánico TikTok"];
const OBJETIVOS = ["Awareness", "Consideración", "Conversión", "Retargeting", "B2B Lead Gen"];
const ESTADOS = ["Planificada", "En revisión", "Activa", "Pausada", "Finalizada"];
const TIPOS = ["Video Reel", "Imagen Estática", "Carrusel", "Story", "Texto", "Video largo"];

const DEFAULTS = { estado: "Planificada", canal: "Meta Ads", objetivo: "Awareness" };

const Field = ({ label, children }) => (
  <div>
    <label className="text-[11px] font-medium text-white/50">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

const inputCls = "w-full bg-white/[0.05] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/60";

export default function CampaignFormModal({ open, editing, onClose, onSaved }) {
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(editing ? { ...editing } : DEFAULTS);
  }, [editing, open]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nombre) return;
    setSaving(true);
    const data = {
      nombre: form.nombre, canal: form.canal, objetivo: form.objetivo, estado: form.estado,
      tipo_contenido: form.tipo_contenido, publico: form.publico, sku_promovido: form.sku_promovido,
      fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin,
      presupuesto_clp: Number(form.presupuesto_clp) || 0, gasto_real_clp: Number(form.gasto_real_clp) || 0,
      impresiones: Number(form.impresiones) || 0, clics: Number(form.clics) || 0,
      conversiones: Number(form.conversiones) || 0, leads_generados: Number(form.leads_generados) || 0,
      ctr_pct: Number(form.ctr_pct) || 0, roas: Number(form.roas) || 0, cac_clp: Number(form.cac_clp) || 0,
      notas: form.notas,
    };
    if (editing) await base44.entities.Campana.update(editing.id, data);
    else await base44.entities.Campana.create(data);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto peyu-scrollbar-light bg-slate-950 border border-white/10 rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur z-10">
          <p className="text-sm font-bold text-white">{editing ? "Editar campaña" : "Nueva campaña"}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Nombre *"><input value={form.nombre || ""} onChange={(e) => set("nombre", e.target.value)} className={inputCls} placeholder="Meta Ads — Escritorio Q3" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Canal"><select value={form.canal} onChange={(e) => set("canal", e.target.value)} className={inputCls}>{CANALES.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            <Field label="Objetivo"><select value={form.objetivo} onChange={(e) => set("objetivo", e.target.value)} className={inputCls}>{OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            <Field label="Estado"><select value={form.estado} onChange={(e) => set("estado", e.target.value)} className={inputCls}>{ESTADOS.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            <Field label="Tipo contenido"><select value={form.tipo_contenido || ""} onChange={(e) => set("tipo_contenido", e.target.value)} className={inputCls}><option value="">—</option>{TIPOS.map((o) => <option key={o} value={o}>{o}</option>)}</select></Field>
            <Field label="Fecha inicio"><input type="date" value={form.fecha_inicio?.slice(0, 10) || ""} onChange={(e) => set("fecha_inicio", e.target.value)} className={inputCls} /></Field>
            <Field label="Fecha fin"><input type="date" value={form.fecha_fin?.slice(0, 10) || ""} onChange={(e) => set("fecha_fin", e.target.value)} className={inputCls} /></Field>
            <Field label="Presupuesto (CLP)"><input type="number" value={form.presupuesto_clp || ""} onChange={(e) => set("presupuesto_clp", e.target.value)} className={inputCls} /></Field>
            <Field label="Gasto real (CLP)"><input type="number" value={form.gasto_real_clp || ""} onChange={(e) => set("gasto_real_clp", e.target.value)} className={inputCls} /></Field>
            <Field label="Impresiones"><input type="number" value={form.impresiones || ""} onChange={(e) => set("impresiones", e.target.value)} className={inputCls} /></Field>
            <Field label="Clics"><input type="number" value={form.clics || ""} onChange={(e) => set("clics", e.target.value)} className={inputCls} /></Field>
            <Field label="Conversiones"><input type="number" value={form.conversiones || ""} onChange={(e) => set("conversiones", e.target.value)} className={inputCls} /></Field>
            <Field label="Leads"><input type="number" value={form.leads_generados || ""} onChange={(e) => set("leads_generados", e.target.value)} className={inputCls} /></Field>
            <Field label="CTR (%)"><input type="number" step="0.01" value={form.ctr_pct || ""} onChange={(e) => set("ctr_pct", e.target.value)} className={inputCls} /></Field>
            <Field label="ROAS"><input type="number" step="0.1" value={form.roas || ""} onChange={(e) => set("roas", e.target.value)} className={inputCls} /></Field>
          </div>

          <Field label="Público objetivo"><input value={form.publico || ""} onChange={(e) => set("publico", e.target.value)} className={inputCls} /></Field>
          <Field label="SKU / Producto promovido"><input value={form.sku_promovido || ""} onChange={(e) => set("sku_promovido", e.target.value)} className={inputCls} /></Field>
          <Field label="Notas"><textarea value={form.notas || ""} onChange={(e) => set("notas", e.target.value)} className={`${inputCls} resize-none h-16`} /></Field>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving || !form.nombre} className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40">
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-white/[0.06] text-white/70 text-sm hover:bg-white/10">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
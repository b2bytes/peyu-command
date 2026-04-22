import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCORECARD_DIMENSIONS, computeGlobalScore } from '@/lib/supplier-scorecard';

const PERIODOS = ['Q1 2026','Q2 2026','Q3 2026','Q4 2026','Q1 2027','Q2 2027','Q3 2027','Q4 2027','Anual 2026','Anual 2027'];
const RECS = ['Mantener','Ampliar volumen','Reducir volumen','Reemplazar','Suspender'];

export default function EvaluationFormModal({ open, onClose, proveedor, onSaved }) {
  const [form, setForm] = useState({
    periodo: 'Q2 2026',
    fecha_evaluacion: new Date().toISOString().slice(0,10),
    score_calidad: 70, score_entrega_otif: 70, score_precio: 70,
    score_servicio: 70, score_esg: 50, score_riesgo: 70,
    recomendacion: 'Mantener',
  });

  const handleSave = async () => {
    if (!proveedor?.id) return;
    const score_global = computeGlobalScore(form);
    await base44.entities.ProveedorEvaluacion.create({
      ...form,
      proveedor_id: proveedor.id,
      proveedor_nombre: proveedor.nombre,
      score_global,
    });
    // Actualizar proveedor con últimos scores
    await base44.entities.Proveedor.update(proveedor.id, {
      score_calidad: form.score_calidad,
      score_entrega_otif: form.score_entrega_otif,
      score_precio: form.score_precio,
      score_servicio: form.score_servicio,
      score_esg: form.score_esg,
      score_riesgo: form.score_riesgo,
      score_global,
    });
    onSaved?.();
  };

  const preview = computeGlobalScore(form);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins">Nueva evaluación — {proveedor?.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Período</label>
              <Select value={form.periodo} onValueChange={v => setForm({...form, periodo: v})}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PERIODOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fecha</label>
              <Input type="date" value={form.fecha_evaluacion} onChange={e => setForm({...form, fecha_evaluacion: e.target.value})} className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Evaluador</label>
            <Input value={form.evaluador || ''} onChange={e => setForm({...form, evaluador: e.target.value})} className="mt-1" placeholder="Nombre del responsable" />
          </div>

          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Scorecard 6 dimensiones (0-100)</p>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Score Global</p>
                <p className="font-poppins font-black text-xl text-primary">{preview}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {SCORECARD_DIMENSIONS.map(dim => (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <span>{dim.icon}</span>{dim.label}
                      <span className="text-[9px] text-muted-foreground">({Math.round(dim.peso*100)}%)</span>
                    </label>
                    <span className="text-xs font-bold" style={{ color: dim.color }}>{form[dim.key]}</span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="1"
                    value={form[dim.key]}
                    onChange={e => setForm({...form, [dim.key]: +e.target.value})}
                    className="w-full accent-primary"
                    style={{ accentColor: dim.color }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">N° pedidos</label><Input type="number" value={form.num_pedidos_periodo||''} onChange={e=>setForm({...form, num_pedidos_periodo:+e.target.value})} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">OTIF real (%)</label><Input type="number" value={form.otif_pct||''} onChange={e=>setForm({...form, otif_pct:+e.target.value})} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Incidencias</label><Input type="number" value={form.incidencias||''} onChange={e=>setForm({...form, incidencias:+e.target.value})} className="mt-1" /></div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Fortalezas</label>
            <textarea value={form.fortalezas||''} onChange={e=>setForm({...form, fortalezas:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm h-14 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Debilidades / Oportunidades</label>
            <textarea value={form.debilidades||''} onChange={e=>setForm({...form, debilidades:e.target.value})} className="w-full mt-1 border border-input rounded-lg px-3 py-2 text-sm h-14 resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Recomendación</label>
            <Select value={form.recomendacion} onValueChange={v => setForm({...form, recomendacion: v})}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{RECS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1 text-white" style={{ background: '#0F8B6C' }}>Guardar evaluación</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
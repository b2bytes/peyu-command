import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

const VACIA = {
  titulo: '', detalle: '', fase: 'Sprint Julio 2026', estado: 'Pendiente',
  prioridad: 'Media', lado_responsable: 'agencia', solicitado_por: '',
  avance_pct: 0, fecha_inicio: '', fecha_objetivo: '', notas: '', orden: 0,
};

// Modal crear/editar tarea del Plan de Cambios (B2bytes ↔ PEYU).
export default function TareaFormModal({ open, onClose, tarea, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({ ...VACIA, ...(tarea || {}) }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    const data = {
      ...form,
      avance_pct: Number(form.avance_pct) || 0,
      orden: Number(form.orden) || 0,
      fecha_completada: form.estado === 'Completada' ? (form.fecha_completada || new Date().toISOString().split('T')[0]) : '',
    };
    await onSave(data);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tarea?.id ? 'Editar cambio' : 'Nuevo cambio'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold">Título *</label>
            <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ej: Corregir botón Personalizar" />
          </div>
          <div>
            <label className="text-xs font-bold">Detalle</label>
            <Textarea rows={2} value={form.detalle} onChange={(e) => set('detalle', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold">Estado</label>
              <Select value={form.estado} onValueChange={(v) => set('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pendiente', 'En curso', 'En revisión', 'Bloqueada', 'Completada'].map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold">Responsable</label>
              <Select value={form.lado_responsable} onValueChange={(v) => set('lado_responsable', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agencia">B2bytes (agencia)</SelectItem>
                  <SelectItem value="peyu">PEYU Chile</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold">Prioridad</label>
              <Select value={form.prioridad} onValueChange={(v) => set('prioridad', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Alta', 'Media', 'Baja'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold">Avance (%)</label>
              <Input type="number" min="0" max="100" value={form.avance_pct} onChange={(e) => set('avance_pct', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold">Fecha inicio</label>
              <Input type="date" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold">Fecha objetivo</label>
              <Input type="date" value={form.fecha_objetivo} onChange={(e) => set('fecha_objetivo', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold">Solicitado por</label>
            <Input value={form.solicitado_por} onChange={(e) => set('solicitado_por', e.target.value)} placeholder="Ej: Joaquín (PEYU)" />
          </div>
          <div>
            <label className="text-xs font-bold">Notas / acuerdos</label>
            <Textarea rows={2} value={form.notas} onChange={(e) => set('notas', e.target.value)} />
          </div>
          <div className="flex items-center justify-between pt-2">
            {tarea?.id && onDelete ? (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(tarea.id)}>
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={guardar} disabled={saving || !form.titulo.trim()}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Modal de creación de cupones del Centro de Fidelización (admin).
export default function CuponFormModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    codigo: '', descripcion: '', tipo: 'porcentaje', valor: 10,
    minimo_compra_clp: 0, max_descuento_clp: '', usos_max: 0,
    uso_unico_por_email: false, fecha_expiracion: '', activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    const codigo = form.codigo.trim().toUpperCase();
    if (!codigo) { setError('El código es obligatorio'); return; }
    if (form.tipo !== 'envio_gratis' && !(Number(form.valor) > 0)) { setError('El valor debe ser mayor a 0'); return; }
    setSaving(true);
    setError('');
    const dup = await base44.entities.Cupon.filter({ codigo }).catch(() => []);
    if (dup.length > 0) { setError('Ya existe un cupón con ese código'); setSaving(false); return; }
    await base44.entities.Cupon.create({
      codigo,
      descripcion: form.descripcion,
      tipo: form.tipo,
      valor: form.tipo === 'envio_gratis' ? 0 : Number(form.valor),
      minimo_compra_clp: Number(form.minimo_compra_clp) || 0,
      max_descuento_clp: form.max_descuento_clp ? Number(form.max_descuento_clp) : undefined,
      usos_max: Number(form.usos_max) || 0,
      usos_actuales: 0,
      uso_unico_por_email: form.uso_unico_por_email,
      origen: 'manual',
      fecha_expiracion: form.fecha_expiracion || undefined,
      activo: form.activo,
    });
    setSaving(false);
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo cupón</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Código</Label>
            <Input value={form.codigo} onChange={(e) => set('codigo', e.target.value.toUpperCase())} placeholder="INVIERNO15" className="uppercase font-mono" />
          </div>
          <div>
            <Label className="text-xs">Descripción interna</Label>
            <Input value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Campaña invierno 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">% descuento</SelectItem>
                  <SelectItem value="monto_fijo">Monto fijo (CLP)</SelectItem>
                  <SelectItem value="envio_gratis">Envío gratis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.tipo !== 'envio_gratis' && (
              <div>
                <Label className="text-xs">{form.tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Monto (CLP)'}</Label>
                <Input type="number" value={form.valor} onChange={(e) => set('valor', e.target.value)} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Mínimo de compra (CLP)</Label>
              <Input type="number" value={form.minimo_compra_clp} onChange={(e) => set('minimo_compra_clp', e.target.value)} />
            </div>
            {form.tipo === 'porcentaje' && (
              <div>
                <Label className="text-xs">Tope descuento (CLP)</Label>
                <Input type="number" value={form.max_descuento_clp} onChange={(e) => set('max_descuento_clp', e.target.value)} placeholder="Sin tope" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Usos máx. (0 = ilimitado)</Label>
              <Input type="number" value={form.usos_max} onChange={(e) => set('usos_max', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Expira</Label>
              <Input type="date" value={form.fecha_expiracion} onChange={(e) => set('fecha_expiracion', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <Label className="text-xs">Un uso por email</Label>
            <Switch checked={form.uso_unico_por_email} onCheckedChange={(v) => set('uso_unico_por_email', v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Activo</Label>
            <Switch checked={form.activo} onCheckedChange={(v) => set('activo', v)} />
          </div>
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <Button onClick={guardar} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear cupón'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
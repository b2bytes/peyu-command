import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Save } from 'lucide-react';

const FIELDS = [
  { key: 'precio_b2c', label: 'Precio B2C (CLP)', type: 'number' },
  { key: 'precio_base_b2b', label: 'Precio base B2B (CLP)', type: 'number' },
  { key: 'precio_50_199', label: '50-199 u', type: 'number' },
  { key: 'precio_200_499', label: '200-499 u', type: 'number' },
  { key: 'precio_500_mas', label: '500+ u', type: 'number' },
  { key: 'stock_actual', label: 'Stock actual (u)', type: 'number' },
  { key: 'lead_time_sin_personal', label: 'Lead sin pers. (días)', type: 'number' },
  { key: 'lead_time_con_personal', label: 'Lead con pers. (días)', type: 'number' },
  { key: 'garantia_anios', label: 'Garantía (años)', type: 'number' },
  { key: 'area_laser_mm', label: 'Área láser (mm)', type: 'text' },
];

export default function ProductQuickEdit({ producto, onSaved }) {
  const [form, setForm] = useState(producto);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { setForm(producto); }, [producto.id]);

  const dirty = FIELDS.some(f => (form[f.key] ?? '') !== (producto[f.key] ?? '')) || !!form._activoChanged;

  const guardar = async () => {
    setSaving(true);
    try {
      const patch = {};
      FIELDS.forEach(f => {
        const v = form[f.key];
        patch[f.key] = f.type === 'number' ? (v === '' || v == null ? 0 : Number(v)) : (v ?? '');
      });
      patch.activo = form.activo !== false;
      await base44.entities.Producto.update(producto.id, patch);
      onSaved?.(patch);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm">Datos del producto</h3>
          <p className="text-xs text-white/50 mt-0.5">Edición rápida de precios, stock y producción</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.activo !== false}
            onChange={e => setForm({ ...form, activo: e.target.checked, _activoChanged: true })}
            className="rounded accent-emerald-500"
          />
          Activo en catálogo
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FIELDS.map(f => (
          <div key={f.key} className="min-w-0">
            <label className="block text-[11px] text-white/50 mb-1 truncate" title={f.label}>{f.label}</label>
            <Input
              type={f.type}
              value={form[f.key] ?? ''}
              onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? e.target.value : e.target.value })}
              className="h-8 bg-white/5 border-white/10 text-white text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={guardar}
          disabled={!dirty || saving}
          size="sm"
          className={`gap-2 ${savedFlash ? 'bg-emerald-600' : 'bg-violet-600 hover:bg-violet-700'} text-white disabled:opacity-40`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {savedFlash ? 'Guardado' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
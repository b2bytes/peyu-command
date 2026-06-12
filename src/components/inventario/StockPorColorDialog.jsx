import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getColoresProducto } from '@/lib/color-parser';

// Editor de stock POR COLOR de un producto. Guarda el mapa stock_por_color y
// sincroniza stock_actual = suma de colores (fuente de verdad por variante).
export default function StockPorColorDialog({ producto, open, onClose, onSaved }) {
  const colores = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const [valores, setValores] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!producto) return;
    const mapa = producto.stock_por_color || {};
    const init = {};
    colores.forEach((c) => {
      const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const hit = Object.entries(mapa).find(([k]) => norm(k) === norm(c.label));
      init[c.label] = hit ? String(hit[1]) : '';
    });
    setValores(init);
  }, [producto, colores]);

  const total = Object.values(valores).reduce((s, v) => s + (Number(v) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    const mapa = {};
    Object.entries(valores).forEach(([color, v]) => {
      if (v !== '') mapa[color] = Number(v) || 0;
    });
    await base44.entities.Producto.update(producto.id, {
      stock_por_color: mapa,
      stock_actual: total,
    });
    setSaving(false);
    onSaved?.();
    onClose();
  };

  if (!producto) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Stock por color · {producto.nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          {colores.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full border flex-shrink-0"
                style={c.id === 'mixto'
                  ? { background: 'conic-gradient(#4DA3DC 0 25%, #212121 25% 50%, #F0807A 50% 75%, #4BC5A5 75% 100%)' }
                  : { backgroundColor: c.hex || '#ccc' }} />
              <span className="flex-1 text-sm font-medium">{c.label}</span>
              <Input
                type="number"
                min="0"
                value={valores[c.label] ?? ''}
                onChange={(e) => setValores((prev) => ({ ...prev, [c.label]: e.target.value }))}
                placeholder="0"
                className="w-24 h-8 text-right"
              />
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-bold">Stock total</span>
            <span className="font-poppins font-bold text-lg" style={{ color: '#0F8B6C' }}>{total} u</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            En la tienda, los colores con 0 unidades aparecerán como "Agotado" y no se podrán elegir.
          </p>
          <Button onClick={handleSave} disabled={saving} className="w-full" style={{ background: '#0F8B6C' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar stock por color'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { getColoresProducto } from '@/lib/color-parser';

// Editor de stock POR COLOR de un producto. Guarda el mapa stock_por_color y
// sincroniza stock_actual = suma de colores (fuente de verdad por variante).
const normColor = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function StockPorColorDialog({ producto, open, onClose, onSaved }) {
  const coloresOficiales = useMemo(() => (producto ? getColoresProducto(producto) : []), [producto]);
  const [valores, setValores] = useState({});
  const [saving, setSaving] = useState(false);

  // Filas a mostrar: los colores oficiales + cualquier color extra que el mapa
  // guardado tenga pero que ya no esté en la lista oficial (ej. tonos viejos de
  // Woo). Así el total editado SIEMPRE cuadra con stock_actual y no hay desfase
  // de visualización entre la tabla y el editor.
  const colores = useMemo(() => {
    const mapa = producto?.stock_por_color || {};
    const filas = [...coloresOficiales];
    Object.keys(mapa).forEach((k) => {
      const yaEsta = coloresOficiales.some((c) => normColor(c.label) === normColor(k));
      if (!yaEsta) filas.push({ id: `extra-${k}`, label: k, hex: '#ccc', extra: true });
    });
    return filas;
  }, [producto, coloresOficiales]);

  useEffect(() => {
    if (!producto) return;
    const mapa = producto.stock_por_color || {};
    const init = {};
    colores.forEach((c) => {
      const hit = Object.entries(mapa).find(([k]) => normColor(k) === normColor(c.label));
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
              <span className="flex-1 text-sm font-medium">
                {c.label}
                {c.extra && <span className="ml-1.5 text-[10px] text-amber-600">(fuera de catálogo)</span>}
              </span>
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
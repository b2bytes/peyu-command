import { useMemo } from 'react';
import { getColoresProducto } from '@/lib/color-parser';

// ════════════════════════════════════════════════════════════════════════
// StockColoresResumen — Vista SIMPLIFICADA de solo lectura del stock por color.
// Muestra exclusivamente cuántas unidades hay de cada color de cada producto
// que maneja variantes de color. NO permite editar — es para verificar de un
// vistazo los niveles reales sin tocar la configuración del catálogo.
// ════════════════════════════════════════════════════════════════════════

const normColor = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

function StockBadge({ unidades }) {
  const u = Number(unidades) || 0;
  const color = u === 0 ? '#D96B4D' : u <= 5 ? '#f59e0b' : '#0F8B6C';
  const bg = u === 0 ? '#fdf3f0' : u <= 5 ? '#fffbeb' : '#f0faf7';
  return (
    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ color, background: bg }}>
      {u}u
    </span>
  );
}

export default function StockColoresResumen({ productos = [] }) {
  // Solo productos con variantes de color reales.
  const filas = useMemo(() => {
    return productos
      .map((p) => {
        const colores = getColoresProducto(p);
        if (colores.length <= 1) return null;
        const mapa = p.stock_por_color && typeof p.stock_por_color === 'object' ? p.stock_por_color : {};
        // Une los colores oficiales del producto con cualquier llave extra del mapa.
        const labels = [...colores.map((c) => c.label)];
        Object.keys(mapa).forEach((k) => {
          if (!labels.some((l) => normColor(l) === normColor(k))) labels.push(k);
        });
        const detalle = labels.map((label) => {
          const hit = Object.entries(mapa).find(([k]) => normColor(k) === normColor(label));
          const swatch = colores.find((c) => normColor(c.label) === normColor(label));
          return { label, unidades: hit ? Number(hit[1]) || 0 : 0, hex: swatch?.hex || '#ccc', mixto: swatch?.id === 'mixto' };
        });
        const total = detalle.reduce((s, d) => s + d.unidades, 0);
        return { id: p.id, nombre: p.nombre, sku: p.sku, detalle, total };
      })
      .filter(Boolean)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  if (filas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No hay productos con variantes de color para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Solo lectura · Verifica los niveles reales por color. Para editar, usa la pestaña <strong>Tabla de Stock</strong>.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filas.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground leading-tight">{f.nombre}</p>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{f.sku}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-poppins font-bold text-lg" style={{ color: f.total === 0 ? '#D96B4D' : '#0F8B6C' }}>{f.total}u</p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {f.detalle.map((d) => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full border flex-shrink-0"
                    style={d.mixto
                      ? { background: 'conic-gradient(#4DA3DC 0 25%, #212121 25% 50%, #F0807A 50% 75%, #4BC5A5 75% 100%)' }
                      : { backgroundColor: d.hex }} />
                  <span className="flex-1 text-xs font-medium text-foreground">{d.label}</span>
                  <StockBadge unidades={d.unidades} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
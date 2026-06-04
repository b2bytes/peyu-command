import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Lista de productos con stock bajo (<10u).
export default function StockCard({ productos = [] }) {
  const bajos = productos
    .filter((p) => typeof p.stock_actual === 'number' && p.stock_actual < 10)
    .sort((a, b) => (a.stock_actual || 0) - (b.stock_actual || 0))
    .slice(0, 8);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-highlight-soft flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-ld-highlight" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Stock bajo</span>
        </div>
        <Link to="/admin/inventario" className="text-xs text-ld-action hover:underline flex items-center gap-0.5">
          Inventario <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      {bajos.length === 0 ? (
        <p className="text-sm text-ld-fg-muted">Stock OK en todos los productos ✅</p>
      ) : (
        <div className="space-y-2">
          {bajos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ld-fg truncate">{p.nombre}</div>
                <div className="text-[11px] text-ld-fg-muted">{p.sku}</div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${(p.stock_actual || 0) <= 3 ? 'text-ld-highlight' : 'text-ld-fg'}`}>
                {p.stock_actual ?? 0}u
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
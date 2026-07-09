import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getColoresProducto } from '@/lib/color-parser';
import { Layers, Search, Minus, Plus, Check, Loader2, ChevronLeft, Package } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// StockColorCard — Gestión de stock POR COLOR directo en el chat del Agent OS.
// Minimalista: elige el producto (auto-detectado desde la frase del founder),
// ajusta unidades por color con steppers y guarda. stock_actual = suma.
// ════════════════════════════════════════════════════════════════════════

const STOP = new Set(['necesito', 'poner', 'stock', 'del', 'por', 'color', 'colores', 'para', 'ajustar', 'cambiar', 'actualizar', 'quiero', 'ver', 'una', 'las', 'los', 'gestionar', 'inventario']);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function StockColorCard({ query = '', onDone }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState(null);
  const [mapa, setMapa] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectProducto = (p) => {
    const stockMap = (p.stock_por_color && typeof p.stock_por_color === 'object') ? p.stock_por_color : {};
    const next = {};
    getColoresProducto(p).forEach((c) => {
      const cand = [c.label, c.id, ...(c.aliases || [])].map(norm);
      const hit = Object.entries(stockMap).find(([k]) => cand.includes(norm(k)));
      next[c.label] = hit ? Number(hit[1]) || 0 : 0;
    });
    setSel(p);
    setMapa(next);
    setSaved(false);
  };

  useEffect(() => {
    base44.entities.Producto.list('nombre', 1000).then((rows) => {
      const conColor = (rows || []).filter((p) => p.activo !== false && getColoresProducto(p).length > 1);
      setProductos(conColor);
      // Auto-selección desde la frase del founder ("stock carcasa samsung s25 por color")
      const tokens = (norm(query).match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t));
      if (tokens.length) {
        const scored = conColor
          .map((p) => ({ p, s: tokens.filter((t) => norm(`${p.nombre} ${p.sku}`).includes(t)).length }))
          .sort((a, b) => b.s - a.s);
        if (scored[0]?.s >= 2) selectProducto(scored[0].p);
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const setColor = (label, val) => {
    setMapa((m) => ({ ...m, [label]: Math.max(0, val) }));
    setSaved(false);
  };

  const total = Object.values(mapa).reduce((a, b) => a + (Number(b) || 0), 0);

  const guardar = async () => {
    if (!sel) return;
    setSaving(true);
    await base44.entities.Producto.update(sel.id, { stock_por_color: mapa, stock_actual: total });
    setProductos((prev) => prev.map((p) => (p.id === sel.id ? { ...p, stock_por_color: mapa, stock_actual: total } : p)));
    setSaving(false);
    setSaved(true);
    onDone?.();
  };

  const filtrados = productos.filter((p) => norm(`${p.nombre} ${p.sku}`).includes(norm(search))).slice(0, 8);

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        {sel && (
          <button onClick={() => { setSel(null); setSaved(false); }} className="w-7 h-7 rounded-lg flex items-center justify-center bg-ld-bg-soft/60 border border-ld-border hover:bg-ld-action-soft transition-colors">
            <ChevronLeft className="w-4 h-4 text-ld-fg-muted" />
          </button>
        )}
        <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
          <Layers className="w-4 h-4 text-ld-action" />
        </span>
        <span className="text-sm font-semibold text-ld-fg">Stock por color</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ld-fg-muted py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando productos con colores…
        </div>
      ) : !sel ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ld-fg-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto (ej. Samsung S25)…"
              className="ld-input w-full h-9 pl-9 pr-3 text-sm"
            />
          </div>
          {filtrados.map((p) => (
            <button key={p.id} onClick={() => selectProducto(p)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border hover:border-ld-action transition-colors text-left">
              <div className="w-9 h-9 rounded-lg overflow-hidden bg-ld-bg flex-shrink-0 flex items-center justify-center">
                {p.imagen_url
                  ? <img src={p.imagen_url} alt="" className="w-full h-full object-contain" loading="lazy" />
                  : <Package className="w-4 h-4 text-ld-fg-subtle" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ld-fg truncate">{p.nombre}</p>
                <p className="text-[11px] text-ld-fg-muted">{p.sku} · {getColoresProducto(p).length} colores · {p.stock_actual ?? 0}u total</p>
              </div>
            </button>
          ))}
          {filtrados.length === 0 && <p className="text-sm text-ld-fg-muted py-2">Sin productos con variantes de color para "{search}".</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Producto seleccionado */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-ld-bg-soft/60 border border-ld-border flex-shrink-0 flex items-center justify-center">
              {sel.imagen_url
                ? <img src={sel.imagen_url} alt="" className="w-full h-full object-contain" />
                : <Package className="w-4 h-4 text-ld-fg-subtle" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ld-fg truncate">{sel.nombre}</p>
              <p className="text-[11px] text-ld-fg-muted">{sel.sku}</p>
            </div>
          </div>

          {/* Steppers por color */}
          <div className="space-y-1.5">
            {getColoresProducto(sel).map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 bg-ld-bg-soft/60 border border-ld-border">
                <div className="flex items-center gap-2 min-w-0">
                  {c.hex && <span className="w-3 h-3 rounded-full border border-ld-border-strong flex-shrink-0" style={{ background: c.hex }} />}
                  <span className="text-sm text-ld-fg truncate">{c.label}</span>
                  {(mapa[c.label] ?? 0) === 0 && <span className="text-[10px] font-bold text-ld-highlight flex-shrink-0">agotado</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setColor(c.label, (mapa[c.label] || 0) - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-ld-bg border border-ld-border hover:bg-ld-highlight-soft transition-colors">
                    <Minus className="w-3.5 h-3.5 text-ld-fg-muted" />
                  </button>
                  <input
                    type="number"
                    value={mapa[c.label] ?? 0}
                    onChange={(e) => setColor(c.label, parseInt(e.target.value, 10) || 0)}
                    className="w-14 h-7 text-center text-sm font-bold text-ld-fg bg-transparent border border-ld-border rounded-lg focus:outline-none focus:border-ld-action [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => setColor(c.label, (mapa[c.label] || 0) + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-ld-bg border border-ld-border hover:bg-ld-action-soft transition-colors">
                    <Plus className="w-3.5 h-3.5 text-ld-fg-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total + guardar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm text-ld-fg-muted">Total: <span className="font-bold text-ld-fg">{total}u</span></p>
            <button
              onClick={guardar}
              disabled={saving}
              className="ld-btn-primary h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
              {saved ? 'Guardado' : 'Guardar stock'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
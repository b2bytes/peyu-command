import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Boxes, Search, Plus, Pencil, Loader2, RefreshCw } from 'lucide-react';
import ProductEditPanel from '../catalog/ProductEditPanel';
import ProductCreatePanel from '../catalog/ProductCreatePanel';

const CATEGORIAS = ['Todas', 'Carcasas B2C', 'Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo'];

// Gestor de catálogo embebido en el chat del Agente: grilla de productos
// (carcasas + otros) con buscador, filtro por categoría, edición inline de cada
// producto (incl. subir/cambiar imágenes) y alta de productos nuevos.
export default function CatalogManagerCard({ categoriaInicial }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoria, setCategoria] = useState(categoriaInicial || 'Todas');
  const [editId, setEditId] = useState(null);
  const [creating, setCreating] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('catalogManager', { action: 'list', payload: { categoria } });
      setProductos(res?.data?.productos || []);
    } finally {
      setLoading(false);
    }
  }, [categoria]);

  useEffect(() => { cargar(); }, [cargar]);

  const visibles = productos.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (p.nombre || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
  });

  return (
    <div className="ld-glass rounded-2xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-ld-action-soft flex items-center justify-center">
            <Boxes className="w-4 h-4 text-ld-action" />
          </span>
          <span className="text-sm font-semibold text-ld-fg">Gestor de catálogo</span>
          <span className="text-[11px] text-ld-fg-muted">({visibles.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={cargar} className="w-8 h-8 rounded-lg hover:bg-ld-bg-elevated flex items-center justify-center text-ld-fg-muted" title="Refrescar">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setCreating((v) => !v); setEditId(null); }}
            className="ld-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
      </div>

      {/* Buscador + filtro */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ld-fg-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="w-full bg-ld-bg-soft/60 border border-ld-border rounded-full pl-9 pr-3 py-1.5 text-sm text-ld-fg focus:outline-none focus:border-ld-action"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${categoria === c ? 'ld-btn-primary' : 'ld-btn-ghost text-ld-fg-soft'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {creating && <ProductCreatePanel onCreated={cargar} onClose={() => setCreating(false)} />}

      {/* Grilla de productos */}
      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-ld-fg-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-sm">Cargando catálogo…</span>
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-ld-fg-muted py-4 text-center">No hay productos que coincidan.</p>
      ) : (
        <div className="space-y-2 mt-3">
          {visibles.map((p) => (
            <div key={p.id} className="rounded-xl border border-ld-border bg-ld-bg-soft/40 overflow-hidden">
              <div className="flex items-center gap-3 p-2.5">
                <div className="w-12 h-12 rounded-lg bg-ld-bg-elevated overflow-hidden flex-shrink-0 border border-ld-border">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-ld-fg-subtle"><Boxes className="w-5 h-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ld-fg truncate">{p.nombre}</div>
                  <div className="text-[11px] text-ld-fg-muted">
                    {p.sku} · ${(p.precio_b2c || 0).toLocaleString('es-CL')} · {p.stock_actual ?? '–'}u
                    {p.activo === false && <span className="text-ld-highlight"> · inactivo</span>}
                  </div>
                </div>
                <button
                  onClick={() => { setEditId(editId === p.id ? null : p.id); setCreating(false); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${editId === p.id ? 'ld-btn-primary' : 'ld-btn-ghost text-ld-fg-soft'}`}
                >
                  <Pencil className="w-3.5 h-3.5" /> {editId === p.id ? 'Cerrar' : 'Editar'}
                </button>
              </div>
              {editId === p.id && (
                <div className="px-2.5 pb-2.5">
                  <ProductEditPanel producto={p} onSaved={cargar} onClose={() => setEditId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
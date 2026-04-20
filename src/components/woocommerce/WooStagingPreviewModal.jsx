import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Search, Filter, Eye, AlertCircle, CheckCircle2, Clock, SkipForward, Package, User, ShoppingBag } from 'lucide-react';
import { Input } from '@/components/ui/input';

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock, label: 'Pendiente' },
  promoted: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2, label: 'Promovido' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-700', icon: SkipForward, label: 'Omitido' },
  error: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Error' },
};

const TYPE_LABELS = {
  product: { label: 'Productos', icon: Package },
  customer: { label: 'Clientes', icon: User },
  order: { label: 'Pedidos', icon: ShoppingBag },
};

export default function WooStagingPreviewModal({ resourceType, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('wooStagingList', {
        resource_type: resourceType, status, limit: 100, search,
      });
      setItems(data?.items || []);
    } catch {}
    setLoading(false);
  }, [resourceType, status, search]);

  useEffect(() => { load(); }, [load]);

  const TypeMeta = TYPE_LABELS[resourceType];
  const TypeIcon = TypeMeta.icon;

  const getDisplayName = (it) => it.nombre || it.sku || it.email || `Woo #${it.woo_id}`;
  const getSecondary = (it) => {
    if (resourceType === 'product') return `SKU: ${it.sku || '—'} · $${(it.mapped_preview?.precio_b2c || 0).toLocaleString('es-CL')}`;
    if (resourceType === 'customer') return `${it.email || '—'} · ${it.mapped_preview?.num_pedidos || 0} pedidos`;
    return `#${it.mapped_preview?.numero_pedido} · ${it.mapped_preview?.cliente_nombre} · $${(it.mapped_preview?.total || 0).toLocaleString('es-CL')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 font-poppins">Revisión staging: {TypeMeta.label}</h2>
              <p className="text-xs text-gray-600">Inspecciona cómo quedará el mapeo antes de promover.</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/80 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b bg-gray-50 flex gap-3 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, SKU o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white h-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 mx-1" />
            {['pending', 'promoted', 'skipped', 'error', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition ${
                  status === s ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s === 'all' ? 'Todos' : STATUS_STYLES[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo: lista + detalle */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista */}
          <div className="w-1/2 border-r overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Cargando…</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No hay items con ese filtro.
              </div>
            ) : (
              <ul>
                {items.map(it => {
                  const st = STATUS_STYLES[it.status] || STATUS_STYLES.pending;
                  const StIcon = st.icon;
                  const isActive = selected?.id === it.id;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => setSelected(it)}
                        className={`w-full text-left px-4 py-3 border-b hover:bg-indigo-50 transition ${isActive ? 'bg-indigo-100' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-md ${st.bg} ${st.text} flex items-center justify-center mt-0.5`}>
                            <StIcon className="w-3 h-3" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{getDisplayName(it)}</p>
                            <p className="text-[11px] text-gray-500 truncate">{getSecondary(it)}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detalle */}
          <div className="w-1/2 overflow-y-auto p-5 bg-gray-50">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <Eye className="w-8 h-8" />
                <p>Selecciona un item para ver el mapeo</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider mb-1">Mapeo propuesto → {selected.target_entity || 'destino'}</p>
                  <div className="bg-white border rounded-xl p-3 space-y-1.5">
                    {Object.entries(selected.mapped_preview || {}).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-3 gap-2 text-xs border-b last:border-0 pb-1.5 last:pb-0">
                        <span className="font-semibold text-gray-600 col-span-1 truncate">{k}</span>
                        <span className="text-gray-900 col-span-2 break-all">{String(v).slice(0, 200) || <em className="text-gray-400">(vacío)</em>}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                    <b>Error:</b> {selected.error_message}
                  </div>
                )}

                <div className="text-[11px] text-gray-500 pt-2 border-t">
                  Woo ID: <b>{selected.woo_id}</b> · Importado: {new Date(selected.imported_at).toLocaleString('es-CL')}
                  {selected.target_id && <> · Base44 ID: <code className="bg-white px-1 rounded">{selected.target_id}</code></>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
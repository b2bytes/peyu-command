import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Sparkles, Image as ImageIcon, FileText, Package, Loader2, AlertCircle, X, RefreshCw, Check, Share2 } from 'lucide-react';
import AIContentGenerator from '@/components/admin-products/AIContentGenerator';
import AIImageEnhancer from '@/components/admin-products/AIImageEnhancer';
import ProductQuickEdit from '@/components/admin-products/ProductQuickEdit';
import PromoImageGenerator from '@/components/admin-products/PromoImageGenerator';
import WordPressMigrationPanel from '@/components/admin-products/WordPressMigrationPanel';
import DriveMatchMigrationPanel from '@/components/admin-products/DriveMatchMigrationPanel';
import WaybackRecoveryPanel from '@/components/admin-products/WaybackRecoveryPanel';
import GoogleShoppingAuditPanel from '@/components/admin-products/GoogleShoppingAuditPanel';
import BulkImageGeneratorPanel from '@/components/admin-products/BulkImageGeneratorPanel';
import LaunchReadinessPanel from '@/components/admin-products/LaunchReadinessPanel';
import DuplicateMergePanel from '@/components/admin-products/DuplicateMergePanel';
import MerchantCenterSyncCard from '@/components/admin-products/MerchantCenterSyncCard';
import { Button } from '@/components/ui/button';

export default function AdminProducts() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('publicados');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('datos');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.Producto.list('nombre', 200);
    setProductos(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    return productos.filter(p => {
      if (filter === 'publicados' && p.activo === false) return false;
      if (filter === 'inactivos' && p.activo !== false) return false;
      if (filter === 'sin_descripcion' && p.descripcion) return false;
      if (filter === 'sin_imagen' && p.imagen_url) return false;
      const q = search.toLowerCase();
      return !q || p.nombre?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    });
  }, [productos, search, filter]);

  const stats = useMemo(() => ({
    total: productos.length,
    publicados: productos.filter(p => p.activo !== false).length,
    inactivos: productos.filter(p => p.activo === false).length,
    sinDescripcion: productos.filter(p => !p.descripcion).length,
    sinImagen: productos.filter(p => !p.imagen_url).length,
    completos: productos.filter(p => p.descripcion && p.imagen_url).length,
  }), [productos]);

  const selected = productos.find(p => p.id === selectedId);

  useEffect(() => {
    if (!selected && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selected]);

  const updateLocalProduct = (patch) => {
    setProductos(prev => prev.map(p => p.id === selectedId ? { ...p, ...patch } : p));
  };

  return (
    <div className="min-h-screen flex flex-col p-4 lg:p-6 gap-4 bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-violet-600 flex-shrink-0" />
            <span className="truncate">Administración de Productos</span>
          </h1>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">
            Edita precios, stock e imágenes · Genera descripciones SEO con IA · Sincroniza con peyuchile.cl
          </p>
        </div>
        <Button
          onClick={async () => {
            setSyncing(true); setSyncResult(null);
            try {
              const res = await base44.functions.invoke('syncWooCatalogo', { fullSync: true });
              setSyncResult(res.data); await loadData();
            } catch (e) { setSyncResult({ error: e.message }); }
            finally { setSyncing(false); }
          }}
          disabled={syncing}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {syncing ? 'Sincronizando…' : 'Sync con peyuchile.cl'}
        </Button>
      </div>

      {syncResult && (
        <div className={`px-4 py-2.5 rounded-xl border flex items-start gap-2 text-xs ${
          syncResult.error ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {syncResult.error ? <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <div className="flex-1">
            {syncResult.error ? <span>Error: {syncResult.error}</span> : (
              <span>
                ✓ Sincronizados <strong>{syncResult.total_woo}</strong> productos ·{' '}
                <strong>{syncResult.creados}</strong> nuevos ·{' '}
                <strong>{syncResult.actualizados}</strong> actualizados
                {syncResult.desactivados > 0 && <> · <strong className="text-red-700">{syncResult.desactivados}</strong> desactivados</>}
                {syncResult.errores > 0 && <> · <strong className="text-amber-700">{syncResult.errores}</strong> errores</>}
              </span>
            )}
          </div>
          <button onClick={() => setSyncResult(null)} className="text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
        </div>
      )}

      <MerchantCenterSyncCard />
      <LaunchReadinessPanel onProductClick={(id) => { setSelectedId(id); setTab('datos'); }} onAction={loadData} />
      <DuplicateMergePanel onActionComplete={loadData} />
      <DriveMatchMigrationPanel onComplete={loadData} />
      <WaybackRecoveryPanel onComplete={loadData} />
      <WordPressMigrationPanel onComplete={loadData} />
      <GoogleShoppingAuditPanel onProductClick={(id) => { setSelectedId(id); setTab('imagen'); }} />
      <BulkImageGeneratorPanel productos={productos} onComplete={loadData} />

      {/* KPIs clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <KPI label="Publicados" value={stats.publicados} color="text-emerald-700" bgActive="bg-emerald-50 border-emerald-400" active={filter === 'publicados'} onClick={() => setFilter('publicados')} />
        <KPI label="Inactivos" value={stats.inactivos} color="text-gray-600" bgActive="bg-gray-100 border-gray-400" active={filter === 'inactivos'} onClick={() => setFilter('inactivos')} />
        <KPI label="Todos" value={stats.total} color="text-gray-900" bgActive="bg-violet-50 border-violet-400" active={filter === 'todos'} onClick={() => setFilter('todos')} />
        <KPI label="Sin descripción" value={stats.sinDescripcion} color="text-amber-700" bgActive="bg-amber-50 border-amber-400" highlight active={filter === 'sin_descripcion'} onClick={() => setFilter('sin_descripcion')} />
        <KPI label="Sin imagen" value={stats.sinImagen} color="text-red-700" bgActive="bg-red-50 border-red-400" highlight active={filter === 'sin_imagen'} onClick={() => setFilter('sin_imagen')} />
        <KPI label="Completos" value={stats.completos} color="text-cyan-700" bgActive="bg-cyan-50 border-cyan-400" active={false} />
      </div>

      {/* Layout: lista + detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-3 h-[720px] max-h-[calc(100vh-120px)]">
        {/* Lista */}
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm h-[720px] max-h-[calc(100vh-120px)] lg:h-auto">
          <div className="p-3 space-y-2 border-b border-gray-100 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar SKU o nombre…"
                className="pl-9 h-9 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {[
                { id: 'publicados', label: `Publicados · ${stats.publicados}`, color: 'emerald' },
                { id: 'inactivos', label: `Inactivos · ${stats.inactivos}`, color: 'slate' },
                { id: 'todos', label: `Todos · ${stats.total}`, color: 'violet' },
                { id: 'sin_descripcion', label: `Sin desc · ${stats.sinDescripcion}`, color: 'amber' },
                { id: 'sin_imagen', label: `Sin img · ${stats.sinImagen}`, color: 'rose' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filter === f.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto peyu-scrollbar p-2 min-h-0">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando productos…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" /> Sin productos
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(p => (
                  <button key={p.id} onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-2.5 border ${
                      selectedId === p.id ? 'bg-violet-50 border-violet-300' : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                    } ${p.activo === false ? 'opacity-60' : ''}`}>
                    {p.imagen_url ? (
                      <img src={p.imagen_url} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedId === p.id ? 'text-violet-900' : 'text-gray-900'}`}>{p.nombre}</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-400 truncate">{p.sku}</span>
                        {!p.descripcion && <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">desc</span>}
                        {!p.imagen_url && <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700">img</span>}
                        {p.activo === false && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">off</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalle */}
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm h-[720px] max-h-[calc(100vh-120px)] lg:h-auto">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <AlertCircle className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Selecciona un producto de la lista</p>
            </div>
          ) : (
            <>
              <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-gray-400">{selected.sku}</p>
                    <h2 className="text-lg lg:text-xl font-poppins font-bold text-gray-900 mt-0.5 truncate">{selected.nombre}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Pill>{selected.categoria}</Pill>
                      <Pill>{selected.material}</Pill>
                      <Pill>{selected.canal}</Pill>
                      {selected.activo === false && <Pill className="bg-red-100 text-red-700">Inactivo</Pill>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 lg:hidden flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 mt-3 border-b border-gray-100 -mb-3">
                  {[
                    { id: 'datos', label: 'Datos', icon: Package },
                    { id: 'imagen', label: 'Imagen IA', icon: ImageIcon },
                    { id: 'descripcion', label: 'Descripción IA', icon: FileText },
                    { id: 'promo', label: 'Promo Social', icon: Share2 },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
                        tab === t.id ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}>
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto peyu-scrollbar p-5 min-h-0">
                {tab === 'datos' && <ProductQuickEdit key={selected.id} producto={selected} onSaved={updateLocalProduct} />}
                {tab === 'imagen' && <AIImageEnhancer producto={selected} onSaved={updateLocalProduct} />}
                {tab === 'descripcion' && <AIContentGenerator producto={selected} onSaved={(desc) => updateLocalProduct({ descripcion: desc })} />}
                {tab === 'promo' && <PromoImageGenerator producto={selected} onSaved={updateLocalProduct} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, color, highlight, active, bgActive, onClick }) {
  const Cmp = onClick ? 'button' : 'div';
  return (
    <Cmp onClick={onClick}
      className={`text-left border rounded-xl px-3 py-2 transition-all shadow-sm ${
        active ? `${bgActive} ring-1` : 'bg-white border-gray-200'
      } ${onClick ? 'hover:shadow-md cursor-pointer' : ''}`}>
      <div className="text-[11px] text-gray-500 font-medium mb-0.5 truncate">{label}</div>
      <div className={`text-xl font-poppins font-bold ${color}`}>{value}</div>
    </Cmp>
  );
}

function Pill({ children, className = '' }) {
  return <span className={`text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium ${className}`}>{children}</span>;
}
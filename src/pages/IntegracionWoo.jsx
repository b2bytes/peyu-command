import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Shield, Database, ArrowRight } from 'lucide-react';
import WooStatsCard from '@/components/woocommerce/WooStatsCard';
import WooCredentialsGuide from '@/components/woocommerce/WooCredentialsGuide';

const TYPES = ['product', 'customer', 'order'];

export default function IntegracionWoo() {
  const [testing, setTesting] = useState(false);
  const [connection, setConnection] = useState(null); // { ok, counts, site, error }
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(null); // { type, action: 'import'|'promote' }
  const [progress, setProgress] = useState(null); // { type, label, current, total }
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ ts: new Date(), msg, type }, ...prev.slice(0, 29)]);
  };

  const testConnection = useCallback(async () => {
    setTesting(true);
    setConnection(null);
    try {
      const { data } = await base44.functions.invoke('wooTestConnection', {});
      setConnection(data);
      if (data.ok) addLog(`✅ Conexión OK: ${data.counts.products} productos, ${data.counts.customers} clientes, ${data.counts.orders_last_12m} pedidos`);
      else addLog(`❌ ${data.error}`, 'error');
    } catch (e) {
      setConnection({ ok: false, error: e.message });
      addLog(`❌ Error: ${e.message}`, 'error');
    }
    setTesting(false);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await base44.functions.invoke('wooStagingStats', {});
      if (data?.ok) setStats(data.stats);
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const importAll = async (type) => {
    setBusy({ type, action: 'import' });
    addLog(`⏳ Iniciando import de ${type}s…`);
    try {
      let page = 1;
      let totalItems = 0;
      let imported = 0;
      while (true) {
        const { data } = await base44.functions.invoke('wooImportBatch', { resource: type, page });
        if (data.error) { addLog(`❌ ${data.error}`, 'error'); break; }
        totalItems = data.totalItems || totalItems;
        imported += data.imported || 0;
        setProgress({ type, label: `Página ${page}/${data.totalPages || '?'}`, current: imported, total: totalItems || imported });
        if (!data.hasMore) break;
        page++;
      }
      addLog(`✅ ${imported} ${type}s importados al staging`);
      setProgress(null);
      await loadStats();
    } catch (e) {
      addLog(`❌ Error import: ${e.message}`, 'error');
    }
    setBusy(null);
  };

  const promoteAll = async (type) => {
    setBusy({ type, action: 'promote' });
    addLog(`⏳ Promoviendo ${type}s al sistema…`);
    try {
      let totalPromoted = 0, totalUpdated = 0, totalSkipped = 0;
      while (true) {
        const { data } = await base44.functions.invoke('wooPromoteStaging', { resource_type: type, limit: 100 });
        if (data.error) { addLog(`❌ ${data.error}`, 'error'); break; }
        totalPromoted += data.promoted || 0;
        totalUpdated += data.updated || 0;
        totalSkipped += data.skipped || 0;
        setProgress({ type, label: 'Promoviendo…', current: totalPromoted + totalUpdated, total: totalPromoted + totalUpdated + (data.hasMore ? 100 : 0) });
        if (!data.hasMore) break;
      }
      addLog(`✅ ${totalPromoted} creados, ${totalUpdated} actualizados, ${totalSkipped} omitidos`);
      setProgress(null);
      await loadStats();
    } catch (e) {
      addLog(`❌ Error promote: ${e.message}`, 'error');
    }
    setBusy(null);
  };

  const getBusyFor = (type) => busy?.type === type ? busy.action : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold mb-2">
              <Zap className="w-3 h-3" /> Módulo aislado · no afecta el sistema actual
            </div>
            <h1 className="text-3xl font-bold font-poppins">Integración WooCommerce</h1>
            <p className="text-white/80 text-sm mt-1">Trae productos, clientes y pedidos de peyuchile.cl de forma segura, con staging intermedio.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={testConnection} disabled={testing} className="bg-white text-indigo-700 hover:bg-white/90 font-bold gap-2">
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Probando…' : 'Probar conexión'}
            </Button>
          </div>
        </div>
      </div>

      {/* Estado conexión */}
      {connection && (
        connection.ok ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-green-900">Conectado a {connection.site?.site_url || 'WooCommerce'}</h3>
              <p className="text-xs text-green-800 mt-0.5">WC v{connection.site?.wc_version} · Moneda {connection.site?.currency || '—'}</p>
              <div className="flex gap-4 mt-2 text-xs text-green-900">
                <span><b>{connection.counts.products}</b> productos</span>
                <span><b>{connection.counts.customers}</b> clientes</span>
                <span><b>{connection.counts.orders_last_12m}</b> pedidos (12m)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900">No se pudo conectar</h3>
              <p className="text-xs text-red-800 mt-0.5 break-all">{connection.error}</p>
            </div>
          </div>
        )
      )}

      {/* Guía si aún no hay conexión */}
      {!connection?.ok && <WooCredentialsGuide />}

      {/* Flujo de 3 pasos */}
      {connection?.ok && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" /> Flujo de integración
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
              <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-full font-semibold">1. WooCommerce</span>
              <ArrowRight className="w-3 h-3" />
              <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-semibold">2. Staging (revisión)</span>
              <ArrowRight className="w-3 h-3" />
              <span className="bg-green-100 text-green-900 px-2.5 py-1 rounded-full font-semibold">3. Base44 (Producto / Cliente / PedidoWeb)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> El staging es intermedio: puedes revisar antes de promover. De-dup por SKU/email/número de pedido.
            </p>
          </div>

          {/* Cards de recursos */}
          <div className="grid md:grid-cols-3 gap-4">
            {TYPES.map(type => (
              <WooStatsCard
                key={type}
                type={type}
                stats={stats?.[type]}
                remoteCount={type === 'product' ? connection.counts.products : type === 'customer' ? connection.counts.customers : connection.counts.orders_last_12m}
                onImport={() => importAll(type)}
                onPromote={() => promoteAll(type)}
                busy={getBusyFor(type)}
                progress={progress?.type === type ? progress : null}
              />
            ))}
          </div>
        </>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-2xl p-4 font-mono text-xs max-h-64 overflow-y-auto">
          <p className="text-white/60 mb-2 font-sans">Registro de actividad</p>
          {logs.map((log, i) => (
            <div key={i} className={log.type === 'error' ? 'text-red-400' : ''}>
              <span className="text-white/40">[{log.ts.toLocaleTimeString()}]</span> {log.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
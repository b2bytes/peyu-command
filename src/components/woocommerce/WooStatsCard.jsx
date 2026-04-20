import { Package, Users, ShoppingBag } from 'lucide-react';

const CONFIG = {
  product: { label: 'Productos', icon: Package, color: 'from-blue-500 to-indigo-500' },
  customer: { label: 'Clientes', icon: Users, color: 'from-emerald-500 to-teal-500' },
  order: { label: 'Pedidos (12m)', icon: ShoppingBag, color: 'from-orange-500 to-pink-500' },
};

export default function WooStatsCard({ type, stats, remoteCount, onImport, onPromote, busy, progress }) {
  const cfg = CONFIG[type];
  const Icon = cfg.icon;
  const s = stats || { pending: 0, promoted: 0, skipped: 0, error: 0, total: 0 };
  const pct = remoteCount ? Math.min(100, Math.round((s.total / remoteCount) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center text-white shadow-md`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{cfg.label}</h3>
          <p className="text-xs text-gray-500">
            En WooCommerce: <b className="text-gray-900">{remoteCount ?? '—'}</b>
          </p>
        </div>
      </div>

      {/* Progreso staging */}
      {remoteCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1">
            <span>Importados al staging</span>
            <span className="font-semibold">{s.total} / {remoteCount} ({pct}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${cfg.color} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="grid grid-cols-4 gap-1.5 mb-4 text-center">
        <div className="bg-amber-50 border border-amber-200 rounded-lg py-1.5">
          <p className="text-[10px] text-amber-700 font-semibold">Pendientes</p>
          <p className="text-sm font-bold text-amber-900">{s.pending}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg py-1.5">
          <p className="text-[10px] text-green-700 font-semibold">Promovidos</p>
          <p className="text-sm font-bold text-green-900">{s.promoted}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg py-1.5">
          <p className="text-[10px] text-gray-600 font-semibold">Omitidos</p>
          <p className="text-sm font-bold text-gray-900">{s.skipped}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg py-1.5">
          <p className="text-[10px] text-red-700 font-semibold">Error</p>
          <p className="text-sm font-bold text-red-900">{s.error}</p>
        </div>
      </div>

      {/* Barra de progreso actual (si está corriendo) */}
      {progress && (
        <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-900">
          <div className="flex justify-between mb-1"><span>{progress.label}</span><span className="font-semibold">{progress.current}/{progress.total}</span></div>
          <div className="h-1.5 bg-blue-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onImport}
          disabled={busy}
          className={`flex-1 text-xs font-bold rounded-lg py-2 transition ${
            busy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `bg-gradient-to-r ${cfg.color} text-white hover:opacity-90`
          }`}
        >
          {busy === 'import' ? 'Importando…' : s.total > 0 ? 'Re-importar' : '1. Importar a staging'}
        </button>
        <button
          onClick={onPromote}
          disabled={busy || s.pending === 0}
          className={`flex-1 text-xs font-bold rounded-lg py-2 transition ${
            busy || s.pending === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {busy === 'promote' ? 'Promoviendo…' : `2. Promover (${s.pending})`}
        </button>
      </div>
    </div>
  );
}
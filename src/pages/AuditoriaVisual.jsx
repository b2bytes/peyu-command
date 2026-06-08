// AuditoriaVisual — Detección de imágenes de baja calidad, rotas o desactualizadas.
import { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AuditFilters from '@/components/auditoria-visual/AuditFilters';
import AuditRow from '@/components/auditoria-visual/AuditRow';
import { Eye, Loader2, ImageIcon } from 'lucide-react';

export default function AuditoriaVisual() {
  const [data, setData] = useState({ stats: null, results: [] });
  const [loading, setLoading] = useState(false);
  const [staleMonths, setStaleMonths] = useState(12);
  const [filter, setFilter] = useState('all');
  const [hasRun, setHasRun] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('auditVisualQuality', { stale_months: staleMonths });
      setData(res?.data || { stats: null, results: [] });
      setHasRun(true);
    } catch (e) {
      console.error('auditVisualQuality error:', e);
      setData({ stats: null, results: [] });
    }
    setLoading(false);
  };

  useEffect(() => { run(); }, []); // eslint-disable-line

  const results = data.results || [];

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    if (['alta', 'media', 'baja'].includes(filter)) return results.filter(r => r.severidad === filter);
    return results.filter(r => r.issues?.includes(filter));
  }, [results, filter]);

  const counts = useMemo(() => ({
    all: results.length,
    alta: results.filter(r => r.severidad === 'alta').length,
    media: results.filter(r => r.severidad === 'media').length,
    baja: results.filter(r => r.severidad === 'baja').length,
    sin_imagen: results.filter(r => r.issues?.includes('sin_imagen')).length,
    rota: results.filter(r => r.issues?.includes('rota')).length,
    baja_resolucion: results.filter(r => r.issues?.includes('baja_resolucion')).length,
    desactualizada: results.filter(r => r.issues?.includes('desactualizada')).length,
  }), [results]);

  const stats = data.stats;

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0 bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600" />
            Auditoría Visual
          </h1>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">
            Detección automática de imágenes rotas, de baja resolución o desactualizadas.
          </p>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
          <Kpi label="Productos auditados" value={stats.total_productos} />
          <Kpi label="Con problemas" value={stats.con_problemas} accent="amber" />
          <Kpi label="Críticos" value={stats.alta} accent="red" />
          <Kpi label="Baja resolución" value={stats.baja_resolucion} accent="blue" />
        </div>
      )}

      {/* Filtros */}
      <div className="flex-shrink-0">
        <AuditFilters
          filter={filter}
          onFilterChange={setFilter}
          staleMonths={staleMonths}
          onStaleChange={setStaleMonths}
          loading={loading}
          onReload={run}
          counts={counts}
        />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto peyu-scrollbar min-h-0 space-y-2">
        {loading && !hasRun ? (
          <div className="text-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Inspeccionando todas las imágenes del catálogo…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {hasRun ? '¡Sin problemas con este filtro! Tu catálogo está limpio. 🎉' : 'Aún no se ha corrido la auditoría.'}
            </p>
          </div>
        ) : (
          filtered.map(row => <AuditRow key={row.producto_id} row={row} />)
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent = 'default' }) {
  const styles = {
    default: 'bg-white border-gray-200 text-gray-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const labelStyle = {
    default: 'text-gray-500',
    amber: 'text-amber-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  };
  return (
    <div className={`${styles[accent]} border rounded-xl px-3 py-2.5`}>
      <p className={`text-[11px] font-medium ${labelStyle[accent]}`}>{label}</p>
      <p className="text-xl font-poppins font-bold mt-0.5">{value ?? '—'}</p>
    </div>
  );
}
// ============================================================================
// AuditoriaVisual — Página admin que detecta productos con imágenes de baja
// calidad, rotas o desactualizadas, y permite actuar rápido (análisis IA,
// abrir Galería Maestra para reemplazar desde Drive).
// ============================================================================
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
      const res = await base44.functions.invoke('auditVisualQuality', {
        stale_months: staleMonths,
      });
      setData(res?.data || { stats: null, results: [] });
      setHasRun(true);
    } catch (e) {
      console.error('auditVisualQuality error:', e);
      setData({ stats: null, results: [] });
    }
    setLoading(false);
  };

  // Auto-run la primera vez
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = data.results || [];

  const filtered = useMemo(() => {
    if (filter === 'all') return results;
    if (['alta', 'media', 'baja'].includes(filter)) {
      return results.filter(r => r.severidad === filter);
    }
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
    <div className="h-full flex flex-col p-4 lg:p-6 gap-4 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-poppins font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" />
            Auditoría Visual
          </h1>
          <p className="text-white/60 text-xs lg:text-sm mt-1">
            Detección automática de imágenes rotas, de baja resolución o desactualizadas.
            Compará con IA y reemplazá desde Drive en un click.
          </p>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
          <Kpi label="Productos auditados" value={stats.total_productos} />
          <Kpi label="Con problemas" value={stats.con_problemas} accent="text-amber-300" />
          <Kpi label="Críticos" value={stats.alta} accent="text-rose-300" />
          <Kpi label="Baja resolución" value={stats.baja_resolucion} accent="text-sky-300" />
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
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light min-h-0 space-y-2">
        {loading && !hasRun ? (
          <div className="text-center py-16 text-white/60">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Inspeccionando todas las imágenes del catálogo…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {hasRun
                ? '¡Sin problemas con este filtro! Tu catálogo está limpio. 🎉'
                : 'Aún no se ha corrido la auditoría.'}
            </p>
          </div>
        ) : (
          filtered.map((row) => (
            <AuditRow key={row.producto_id} row={row} />
          ))
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent = 'text-white' }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
      <p className="text-[11px] text-white/55">{label}</p>
      <p className={`text-xl font-poppins font-bold ${accent}`}>{value ?? '—'}</p>
    </div>
  );
}
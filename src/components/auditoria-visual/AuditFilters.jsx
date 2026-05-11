// ============================================================================
// AuditFilters — Chips de filtro + slider de antigüedad para AuditoriaVisual.
// ============================================================================
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

const FILTROS = [
  { id: 'all', label: 'Todos' },
  { id: 'alta', label: 'Crítico', color: 'rose' },
  { id: 'media', label: 'Medio', color: 'amber' },
  { id: 'baja', label: 'Bajo', color: 'sky' },
  { id: 'sin_imagen', label: 'Sin imagen' },
  { id: 'rota', label: 'Rotas' },
  { id: 'baja_resolucion', label: 'Baja resolución' },
  { id: 'desactualizada', label: 'Desactualizadas' },
];

export default function AuditFilters({
  filter, onFilterChange,
  staleMonths, onStaleChange,
  loading, onReload,
  counts,
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => {
          const active = filter === f.id;
          const count = counts?.[f.id] ?? null;
          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`text-[12px] px-2.5 py-1 rounded-full border transition ${
                active
                  ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-50'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {f.label}
              {count !== null && (
                <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
              )}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-xs text-white/70">
          <label className="flex items-center gap-1.5">
            Desactualizada si &gt;
            <input
              type="number"
              min={1}
              max={36}
              value={staleMonths}
              onChange={e => onStaleChange(Number(e.target.value) || 12)}
              className="w-14 h-7 rounded bg-white/10 border border-white/15 px-2 text-white text-xs"
            />
            meses
          </label>
          <Button
            size="sm"
            onClick={onReload}
            disabled={loading}
            className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white h-8"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Auditar
          </Button>
        </div>
      </div>
    </div>
  );
}
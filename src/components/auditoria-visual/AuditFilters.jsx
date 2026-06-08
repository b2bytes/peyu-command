import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

const FILTROS = [
  { id: 'all', label: 'Todos' },
  { id: 'alta', label: 'Crítico' },
  { id: 'media', label: 'Medio' },
  { id: 'baja', label: 'Bajo' },
  { id: 'sin_imagen', label: 'Sin imagen' },
  { id: 'rota', label: 'Rotas' },
  { id: 'baja_resolucion', label: 'Baja resolución' },
  { id: 'desactualizada', label: 'Desactualizadas' },
];

const ACTIVE_STYLE = {
  alta: 'bg-red-100 border-red-400 text-red-800',
  media: 'bg-amber-100 border-amber-400 text-amber-800',
  baja: 'bg-sky-100 border-sky-400 text-sky-800',
};

export default function AuditFilters({ filter, onFilterChange, staleMonths, onStaleChange, loading, onReload, counts }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => {
          const active = filter === f.id;
          const count = counts?.[f.id] ?? null;
          const activeClass = active ? (ACTIVE_STYLE[f.id] || 'bg-cyan-100 border-cyan-500 text-cyan-800') : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50';
          return (
            <button key={f.id} onClick={() => onFilterChange(f.id)}
              className={`text-[12px] px-2.5 py-1 rounded-full border font-medium transition-all ${activeClass}`}>
              {f.label}
              {count !== null && <span className="ml-1.5 text-[10px] opacity-70">({count})</span>}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
          <label className="flex items-center gap-1.5">
            Desact. si &gt;
            <input type="number" min={1} max={36} value={staleMonths}
              onChange={e => onStaleChange(Number(e.target.value) || 12)}
              className="w-14 h-7 rounded border border-gray-300 bg-white px-2 text-gray-900 text-xs" />
            meses
          </label>
          <Button size="sm" onClick={onReload} disabled={loading} className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white h-8">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Auditar
          </Button>
        </div>
      </div>
    </div>
  );
}
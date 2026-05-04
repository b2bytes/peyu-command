import { Search, AlertTriangle, Clock, CheckCircle2, Truck, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ESTADOS_QUICK = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'activos', label: 'Activos', icon: Truck },
  { key: 'excepciones', label: 'Excepciones', icon: AlertTriangle, accent: 'red' },
  { key: 'atrasados', label: 'Atrasados', icon: Clock, accent: 'amber' },
  { key: 'entregados', label: 'Entregados', icon: CheckCircle2, accent: 'emerald' },
];

export default function BluexFilters({ filtro, setFiltro, search, setSearch, counts }) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por tracking, pedido, cliente o comuna..."
          className="pl-9 h-10"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {ESTADOS_QUICK.map(e => {
          const Icon = e.icon;
          const active = filtro === e.key;
          const accentMap = {
            red: 'border-red-300 text-red-700 bg-red-50',
            amber: 'border-amber-300 text-amber-700 bg-amber-50',
            emerald: 'border-emerald-300 text-emerald-700 bg-emerald-50',
          };
          return (
            <button
              key={e.key}
              onClick={() => setFiltro(e.key)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : e.accent && counts[e.key] > 0
                    ? accentMap[e.accent]
                    : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {e.label}
              <span className={`text-[10px] tabular-nums ${active ? 'opacity-80' : 'opacity-60'}`}>
                {counts[e.key] || 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function B2BCatalogFilters({ filters, onFilterChange, activeFilters }) {
  const filterGroups = [
    {
      id: 'categoria',
      label: 'Categoría',
      options: ['Escritorio', 'Hogar', 'Entretenimiento', 'Corporativo']
    },
    {
      id: 'material',
      label: 'Material',
      options: ['Plástico 100% Reciclado', 'Fibra de Trigo (Compostable)']
    },
    {
      id: 'precio',
      label: 'Rango de Precio',
      options: ['0-10K', '10K-20K', '20K-50K', '50K+']
    },
    {
      id: 'stock',
      label: 'Disponibilidad',
      options: ['En Stock', 'Bajo Stock', 'Bajo Pedido']
    }
  ];

  const priceMap = { '0-10K': [0, 10000], '10K-20K': [10000, 20000], '20K-50K': [20000, 50000], '50K+': [50000, Infinity] };
  const stockMap = { 'En Stock': 'stock', 'Bajo Stock': 'low_stock', 'Bajo Pedido': 'on_demand' };

  return (
    <div className="space-y-4">
      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200">
          {activeFilters.map(f => (
            <div key={f} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {f}
              <button onClick={() => onFilterChange(f, false)} className="hover:bg-blue-200 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              Object.keys(filters).forEach(k => onFilterChange(k, null));
            }}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Grupos de filtros */}
      {filterGroups.map(group => (
        <details key={group.id} className="group border border-gray-200 rounded-xl overflow-hidden">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 font-semibold text-sm text-gray-900">
            {group.label}
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
            {group.options.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters[group.id]?.includes(opt) || false}
                  onChange={e => onFilterChange(group.id, opt, e.target.checked)}
                  className="rounded w-4 h-4 text-gray-900 accent-gray-900"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
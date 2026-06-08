import { X } from 'lucide-react';

const ALL_TAGS = [
  'Tecnología', 'Retail', 'Manufactura', 'Servicios', 'Educación', 'Salud', 'Logística', 'Finanzas',
  'Caliente', 'Tibio', 'Frío', 'Cualificado', 'En negociación', 'Presupuestado',
];

export default function TagFilter({ selectedTags, onChange }) {
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter(t => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-900">Filtrar por etiqueta:</p>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpiar filtros
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
              selectedTags.includes(tag)
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
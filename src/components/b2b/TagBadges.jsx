import { X } from 'lucide-react';

const TAG_COLORS = {
  'Tecnología': 'bg-blue-100 text-blue-700 border-blue-200',
  'Retail': 'bg-purple-100 text-purple-700 border-purple-200',
  'Manufactura': 'bg-orange-100 text-orange-700 border-orange-200',
  'Servicios': 'bg-teal-100 text-teal-700 border-teal-200',
  'Educación': 'bg-green-100 text-green-700 border-green-200',
  'Salud': 'bg-red-100 text-red-700 border-red-200',
  'Logística': 'bg-amber-100 text-amber-700 border-amber-200',
  'Finanzas': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Caliente': 'bg-rose-100 text-rose-700 border-rose-200',
  'Tibio': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Frío': 'bg-slate-100 text-slate-700 border-slate-200',
  'Cualificado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'En negociación': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Presupuestado': 'bg-lime-100 text-lime-700 border-lime-200',
};

export default function TagBadges({ tags, onRemove, editable = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags?.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
        >
          {tag}
          {editable && onRemove && (
            <button
              onClick={() => onRemove(tag)}
              className="ml-0.5 hover:opacity-70 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
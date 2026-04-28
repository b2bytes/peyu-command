import { Leaf, Lightbulb, Newspaper, Sparkles } from 'lucide-react';

/**
 * Chips temáticos del blog. Estos filtros buscan en `tags` (no en categoría)
 * para permitir múltiples ejes de navegación: ambiental, consejos, noticias.
 *
 * El valor especial 'todos' desactiva el filtro temático.
 */
export const BLOG_TOPICS = [
  {
    id: 'todos',
    label: 'Todos los temas',
    icon: Sparkles,
    color: 'from-teal-500 to-emerald-500',
    tagMatch: null, // no filtra por tag
  },
  {
    id: 'impacto',
    label: 'Impacto ambiental',
    icon: Leaf,
    color: 'from-emerald-500 to-green-600',
    // matches: cualquier tag que contenga estas keywords
    tagMatch: ['impacto', 'reciclaje', 'medio ambiente', 'sostenibilidad', 'co2', 'plástico', 'plastico', 'huella'],
  },
  {
    id: 'consejos',
    label: 'Consejos de uso',
    icon: Lightbulb,
    color: 'from-amber-500 to-orange-600',
    tagMatch: ['consejos', 'tips', 'guía', 'guia', 'cuidado', 'mantención', 'mantencion', 'limpieza', 'uso'],
  },
  {
    id: 'noticias',
    label: 'Noticias y prensa',
    icon: Newspaper,
    color: 'from-blue-500 to-indigo-600',
    tagMatch: ['noticias', 'prensa', 'lanzamiento', 'novedades', 'evento', 'reconocimiento'],
  },
];

/**
 * Verifica si un post matchea un topic específico mediante tags o categoría.
 */
export function postMatchesTopic(post, topicId) {
  const topic = BLOG_TOPICS.find(t => t.id === topicId);
  if (!topic || !topic.tagMatch) return true;

  const haystack = [
    ...(post.tags || []),
    post.categoria || '',
  ].join(' ').toLowerCase();

  return topic.tagMatch.some(kw => haystack.includes(kw));
}

export default function BlogTopicChips({ value, onChange, counts = {} }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
      {BLOG_TOPICS.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative group rounded-2xl p-4 border-2 transition-all overflow-hidden ${
              active
                ? 'border-white/60 bg-white/15 shadow-lg shadow-black/20 scale-[1.02]'
                : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }`}
          >
            {active && (
              <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-20`} />
            )}
            <div className="relative flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-md`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-white text-center leading-tight">{t.label}</p>
              {typeof counts[t.id] === 'number' && (
                <span className="text-[10px] font-medium text-white/60">
                  {counts[t.id]} artículo{counts[t.id] !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
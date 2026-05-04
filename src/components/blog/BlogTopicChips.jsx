import { Leaf, Lightbulb, Newspaper, Sparkles } from 'lucide-react';

/**
 * Chips temáticos del blog. Versión LIGHT — combina con el blog editorial.
 */
export const BLOG_TOPICS = [
  { id: 'todos',     label: 'Todos los temas',  icon: Sparkles,  accent: 'teal',     tagMatch: null },
  { id: 'impacto',   label: 'Impacto ambiental', icon: Leaf,      accent: 'emerald',  tagMatch: ['impacto', 'reciclaje', 'medio ambiente', 'sostenibilidad', 'co2', 'plástico', 'plastico', 'huella'] },
  { id: 'consejos',  label: 'Consejos de uso',   icon: Lightbulb, accent: 'amber',    tagMatch: ['consejos', 'tips', 'guía', 'guia', 'cuidado', 'mantención', 'mantencion', 'limpieza', 'uso'] },
  { id: 'noticias',  label: 'Noticias y prensa', icon: Newspaper, accent: 'blue',     tagMatch: ['noticias', 'prensa', 'lanzamiento', 'novedades', 'evento', 'reconocimiento'] },
];

const ACCENT_STYLES = {
  teal:    { active: 'border-teal-500 bg-teal-50',       icon: 'bg-teal-100 text-teal-700' },
  emerald: { active: 'border-emerald-500 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-700' },
  amber:   { active: 'border-amber-500 bg-amber-50',     icon: 'bg-amber-100 text-amber-700' },
  blue:    { active: 'border-blue-500 bg-blue-50',       icon: 'bg-blue-100 text-blue-700' },
};

export function postMatchesTopic(post, topicId) {
  const topic = BLOG_TOPICS.find(t => t.id === topicId);
  if (!topic || !topic.tagMatch) return true;
  const haystack = [...(post.tags || []), post.categoria || ''].join(' ').toLowerCase();
  return topic.tagMatch.some(kw => haystack.includes(kw));
}

export default function BlogTopicChips({ value, onChange, counts = {} }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
      {BLOG_TOPICS.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        const styles = ACCENT_STYLES[t.accent];
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative group rounded-2xl p-4 border-2 transition-all overflow-hidden text-left ${
              active
                ? `${styles.active} shadow-md`
                : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 leading-tight">{t.label}</p>
                {typeof counts[t.id] === 'number' && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {counts[t.id]} artículo{counts[t.id] !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
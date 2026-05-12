import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

/**
 * SEOSuggestionRow
 * ----------------
 * Fila editable con la sugerencia IA de meta_title + meta_description + focus_keyword.
 * Muestra contadores de caracteres (verde si está en rango óptimo, ámbar si no).
 */
export default function SEOSuggestionRow({ suggestion, selected, onToggle, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const titleLen = (suggestion.meta_title || '').length;
  const descLen = (suggestion.meta_description || '').length;
  const titleOK = titleLen >= 50 && titleLen <= 60;
  const descOK = descLen >= 150 && descLen <= 160;

  return (
    <div className={`rounded-xl border transition-all ${
      selected ? 'bg-violet-500/10 border-violet-400/40' : 'bg-white/5 border-white/10'
    }`}>
      <div className="p-3 flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
            selected
              ? 'bg-violet-500 border-violet-500'
              : 'border-white/30 hover:border-white/60'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-white/40">{suggestion.sku}</span>
            <span className="text-sm font-medium text-white truncate">{suggestion.nombre}</span>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] text-white/40 w-12 flex-shrink-0">TITLE</span>
              {editing ? (
                <input
                  value={suggestion.meta_title}
                  onChange={e => onChange({ meta_title: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                />
              ) : (
                <span className="text-sm text-white/90 break-words">{suggestion.meta_title}</span>
              )}
              <span className={`text-[10px] font-mono flex-shrink-0 ${titleOK ? 'text-emerald-300' : 'text-amber-300'}`}>
                {titleLen}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-[10px] text-white/40 w-12 flex-shrink-0">DESC</span>
              {editing ? (
                <textarea
                  value={suggestion.meta_description}
                  onChange={e => onChange({ meta_description: e.target.value })}
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white resize-none"
                />
              ) : (
                <span className="text-xs text-white/70 break-words">{suggestion.meta_description}</span>
              )}
              <span className={`text-[10px] font-mono flex-shrink-0 ${descOK ? 'text-emerald-300' : 'text-amber-300'}`}>
                {descLen}
              </span>
            </div>

            {expanded && (
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-[10px] text-white/40 w-12 flex-shrink-0">KW</span>
                {editing ? (
                  <input
                    value={suggestion.focus_keyword}
                    onChange={e => onChange({ focus_keyword: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                  />
                ) : (
                  <span className="text-xs text-violet-300 font-mono">{suggestion.focus_keyword}</span>
                )}
              </div>
            )}

            {expanded && suggestion.current_meta_title && (
              <div className="pt-2 mt-2 border-t border-white/10 space-y-1">
                <p className="text-[10px] text-white/40 uppercase tracking-wide">Anterior</p>
                <p className="text-[11px] text-white/50 line-through">{suggestion.current_meta_title}</p>
                {suggestion.current_meta_description && (
                  <p className="text-[11px] text-white/40 line-through">{suggestion.current_meta_description}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(!editing)}
            className={`p-1.5 rounded-md transition-all ${
              editing ? 'bg-violet-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
            }`}
            title={editing ? 'Terminar edición' : 'Editar'}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10"
            title={expanded ? 'Colapsar' : 'Ver más'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
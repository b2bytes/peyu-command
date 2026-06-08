import { useState } from 'react';
import { Check, X } from 'lucide-react';
import TagBadges from './TagBadges';

const SUGGESTED_TAGS = {
  'Sectores': ['Tecnología', 'Retail', 'Manufactura', 'Servicios', 'Educación', 'Salud', 'Logística', 'Finanzas'],
  'Etapa': ['Caliente', 'Tibio', 'Frío', 'Cualificado', 'En negociación', 'Presupuestado'],
};

export default function TagEditor({ tags, onSave, onCancel }) {
  const [selectedTags, setSelectedTags] = useState(tags || []);
  const [customTag, setCustomTag] = useState('');

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  return (
    <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
      {/* Tags seleccionadas */}
      {selectedTags.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">Etiquetas seleccionadas:</p>
          <TagBadges tags={selectedTags} onRemove={removeTag} editable={true} />
        </div>
      )}

      {/* Etiquetas sugeridas */}
      {Object.entries(SUGGESTED_TAGS).map(([grupo, opciones]) => (
        <div key={grupo}>
          <p className="text-xs font-bold text-gray-600 mb-1.5">{grupo}:</p>
          <div className="flex flex-wrap gap-1.5">
            {opciones.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Tag personalizado */}
      <div className="flex gap-1.5 items-center">
        <input
          type="text"
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
          placeholder="Agregar etiqueta personalizada…"
          className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addCustomTag}
          disabled={!customTag.trim()}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          +
        </button>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2 pt-1.5 border-t border-gray-200">
        <button
          onClick={() => onSave(selectedTags)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Guardar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </button>
      </div>
    </div>
  );
}
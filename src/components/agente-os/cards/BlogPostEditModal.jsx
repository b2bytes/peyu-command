import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Check } from 'lucide-react';

const CATEGORIAS = [
  'Historia PEYU', 'Reciclaje y Medio Ambiente', 'Guías y Tips', 'Casos de Éxito',
  'Noticias y Prensa', 'Regalos Corporativos', 'Educación Ambiental',
];

// Modal de edición de un artículo del blog, dentro del chat del Agente OS.
export default function BlogPostEditModal({ post, onClose, onSaved }) {
  const [form, setForm] = useState({
    titulo: post.titulo || '',
    excerpt: post.excerpt || '',
    categoria: post.categoria || CATEGORIAS[1],
    contenido_md: post.contenido_md || '',
    imagen_portada: post.imagen_portada || '',
    publicado: post.publicado !== false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    await base44.entities.BlogPost.update(post.id, form).catch(() => null);
    setSaving(false);
    onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="ld-glass-strong rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto peyu-scrollbar p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-ld-fg">Editar artículo</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl ld-btn-ghost flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-ld-fg-muted">Título</label>
            <input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} className="w-full h-9 rounded-xl ld-input text-sm px-3 mt-1" />
          </div>
          <div>
            <label className="text-[11px] font-bold text-ld-fg-muted">Resumen corto</label>
            <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} className="w-full rounded-xl ld-input !rounded-xl text-xs px-3 py-2 mt-1 resize-y" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-ld-fg-muted">Categoría</label>
              <select value={form.categoria} onChange={(e) => set('categoria', e.target.value)} className="w-full h-9 rounded-xl ld-input text-xs px-2 mt-1">
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-ld-fg-muted">URL imagen portada</label>
              <input value={form.imagen_portada} onChange={(e) => set('imagen_portada', e.target.value)} className="w-full h-9 rounded-xl ld-input text-xs px-3 mt-1" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-ld-fg-muted">Contenido (Markdown)</label>
            <textarea value={form.contenido_md} onChange={(e) => set('contenido_md', e.target.value)} rows={12} className="w-full rounded-xl ld-input !rounded-xl text-xs px-3 py-2 mt-1 resize-y font-mono" />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ld-fg cursor-pointer">
            <input type="checkbox" checked={form.publicado} onChange={(e) => set('publicado', e.target.checked)} className="accent-current" />
            Publicado (visible en el blog)
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold ld-btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white ld-btn-primary">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
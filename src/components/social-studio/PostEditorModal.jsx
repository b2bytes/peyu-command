import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Calendar, Sparkles, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REDES = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok'];
const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Programado', 'Publicado', 'Pausado', 'Archivado'];

export default function PostEditorModal({ post, onClose }) {
  const [data, setData] = useState(post);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await base44.entities.ContentPost.update(post.id, data);
      onClose(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este post definitivamente?')) return;
    setDeleting(true);
    try {
      await base44.entities.ContentPost.delete(post.id);
      onClose(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between gap-3 p-6 bg-gradient-to-r from-violet-500 to-pink-500 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> Editar post
          </h2>
          <button
            onClick={() => onClose(false)}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Título</label>
            <Input
              value={data.titulo || ''}
              onChange={(e) => setData({ ...data, titulo: e.target.value })}
              placeholder="Título del post"
              className="text-sm"
            />
          </div>

          {/* Red social */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Red</label>
              <Select value={data.red_social || ''} onValueChange={(v) => setData({ ...data, red_social: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REDES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Estado</label>
              <Select value={data.estado || ''} onValueChange={(v) => setData({ ...data, estado: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Fecha de publicación</label>
            <Input
              type="date"
              value={data.fecha_publicacion?.split('T')[0] || ''}
              onChange={(e) => setData({ ...data, fecha_publicacion: e.target.value })}
              className="text-sm"
            />
          </div>

          {/* Copy */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Copy</label>
            <Textarea
              value={data.copy || ''}
              onChange={(e) => setData({ ...data, copy: e.target.value })}
              placeholder="Texto del post..."
              className="h-24 text-sm"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Hashtags</label>
            <Input
              value={data.hashtags || ''}
              onChange={(e) => setData({ ...data, hashtags: e.target.value })}
              placeholder="#sostenibilidad #reciclaje #peyu"
              className="text-sm"
            />
          </div>

          {/* CTA */}
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1.5">Call to Action</label>
            <Input
              value={data.cta || ''}
              onChange={(e) => setData({ ...data, cta: e.target.value })}
              placeholder="Ej: Conoce nuestros regalos corporativos →"
              className="text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t flex items-center justify-between gap-3 p-6">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Eliminar
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onClose(false)}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-semibold text-sm flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
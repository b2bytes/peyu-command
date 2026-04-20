import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download, Calendar, Sparkles, Check, Trash2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import PostMockup from './mockups/PostMockup';

const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Programado', 'Publicado'];

export default function PostPreviewModal({ post, open, onOpenChange, onUpdated }) {
  const [saving, setSaving] = useState(false);
  if (!post) return null;

  const copyAll = () => {
    const txt = `${post.copy || ''}\n\n${post.hashtags || ''}\n\n${post.cta || ''}`.trim();
    navigator.clipboard.writeText(txt);
    toast.success('Copiado al portapapeles');
  };

  const updateEstado = async (estado) => {
    setSaving(true);
    await base44.entities.ContentPost.update(post.id, { estado });
    toast.success(`Estado: ${estado}`);
    setSaving(false);
    onUpdated?.();
  };

  const eliminar = async () => {
    if (!confirm('¿Eliminar este post?')) return;
    await base44.entities.ContentPost.delete(post.id);
    toast.success('Post eliminado');
    onOpenChange(false);
    onUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <DialogTitle className="flex items-center gap-2 font-poppins">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Preview · {post.red_social} · {post.tipo_post}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-5">
          {/* Mockup */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex items-center justify-center">
            <PostMockup post={post} scale="lg" />
          </div>

          {/* Datos */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Título interno</label>
              <p className="font-poppins font-bold text-gray-900">{post.titulo}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                Copy completo
                <button onClick={copyAll} className="text-gray-400 hover:text-gray-700 flex items-center gap-1 normal-case text-[10px]">
                  <Copy className="w-3 h-3" /> Copiar todo
                </button>
              </label>
              <div className="mt-1 bg-gray-50 rounded-xl p-3 text-sm text-gray-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {post.copy}
              </div>
            </div>

            {post.hashtags && (
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Hashtags</label>
                <p className="mt-1 text-xs font-mono bg-blue-50 text-blue-700 p-2 rounded-lg">{post.hashtags}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              {post.cta && (
                <div className="bg-amber-50 rounded-lg px-3 py-2">
                  <span className="text-amber-600 font-bold uppercase text-[10px]">CTA</span>
                  <p className="text-gray-700 mt-0.5">{post.cta}</p>
                </div>
              )}
              {post.pillar_contenido && (
                <div className="bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-purple-600 font-bold uppercase text-[10px]">Pilar</span>
                  <p className="text-gray-700 mt-0.5">{post.pillar_contenido}</p>
                </div>
              )}
              {post.objetivo && (
                <div className="bg-teal-50 rounded-lg px-3 py-2">
                  <span className="text-teal-600 font-bold uppercase text-[10px]">Objetivo</span>
                  <p className="text-gray-700 mt-0.5">{post.objetivo}</p>
                </div>
              )}
              {post.hora_publicacion && (
                <div className="bg-sky-50 rounded-lg px-3 py-2">
                  <span className="text-sky-600 font-bold uppercase text-[10px]">Hora óptima</span>
                  <p className="text-gray-700 mt-0.5">{post.hora_publicacion}</p>
                </div>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Mover a estado</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ESTADOS.map(e => (
                  <button
                    key={e}
                    onClick={() => updateEstado(e)}
                    disabled={saving || post.estado === e}
                    className={`text-[11px] px-3 py-1.5 rounded-full font-semibold transition ${
                      post.estado === e
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-900'
                    }`}
                  >
                    {post.estado === e && <Check className="w-3 h-3 inline mr-1" />}
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {post.notas && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-gray-700">
                <strong className="text-yellow-700">📝 Notas IA:</strong> {post.notas}
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {post.imagen_url && (
                <a href={post.imagen_url} target="_blank" rel="noreferrer" download>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1"><Download className="w-3.5 h-3.5" /> Imagen</Button>
                </a>
              )}
              <Button variant="outline" size="sm" onClick={eliminar} className="rounded-xl gap-1 text-red-600 hover:bg-red-50 ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
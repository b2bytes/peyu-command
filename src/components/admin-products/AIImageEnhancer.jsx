import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Image as ImageIcon, Loader2, Check, Wand2, Sparkles,
  Plus, Trash2, Star, AlertTriangle, X
} from 'lucide-react';
import ManualImageUpload from './ManualImageUpload';

/**
 * AIImageEnhancer — flujo mejorado:
 *
 *  Filosofía: la IA NO reemplaza la imagen principal automáticamente.
 *  Genera imágenes ALTERNATIVAS que se guardan en `galeria_urls`.
 *  El admin decide manualmente si:
 *    1. Promueve una imagen de la galería a principal.
 *    2. Elimina la imagen actual (con confirmación).
 *    3. Elimina una imagen de la galería.
 *
 *  Reglas duras del prompt para preservar fidelidad visual:
 *    - El producto debe verse IDÉNTICO al de la imagen actual
 *      (forma, color, material, detalles).
 *    - Solo cambia el FONDO/ENTORNO/ILUMINACIÓN.
 */

const ESTILOS = [
  { id: 'lifestyle', label: 'Lifestyle',     prompt: 'in a lifestyle scene, soft natural daylight, scandinavian wooden desk surface, plants softly blurred in the background, shallow depth of field' },
  { id: 'studio',    label: 'Estudio limpio',prompt: 'on a seamless white studio background, soft single-source studio lighting, subtle drop shadow, professional product catalog photography' },
  { id: 'corporate', label: 'Corporativo',   prompt: 'in a corporate office environment, modern minimalist desk, neutral business setting, warm professional lighting' },
  { id: 'eco',       label: 'Eco / Natural', prompt: 'on a natural eco surface (wood, linen, recycled paper), surrounded by leaves and natural fibers, earthy tones, sustainability mood' },
];

export default function AIImageEnhancer({ producto, onSaved }) {
  const [estilo, setEstilo] = useState('lifestyle');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [savingGallery, setSavingGallery] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [deletingMain, setDeletingMain] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const galeria = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];

  // ── Generar imagen alternativa (preservando producto) ─────────────
  const generar = async () => {
    setLoading(true);
    setPreviewUrl('');
    try {
      const styleObj = ESTILOS.find(s => s.id === estilo);

      // Prompt fidelity-first: el producto debe ser idéntico al de la referencia.
      const prompt = `Take the EXACT product shown in the reference image (${producto.nombre} — ${producto.material}, ${producto.categoria.toLowerCase()}) and place it in a new scene.

CRITICAL — DO NOT CHANGE THE PRODUCT:
- The product must look IDENTICAL to the reference: same shape, exact same color, same material texture, same proportions, same details and finishings.
- Do not redesign, restyle, recolor, or alter the product in any way.
- Keep the product as the clear hero of the composition, centered and in sharp focus.

ONLY CHANGE THE BACKGROUND, SETTING AND LIGHTING:
${styleObj.prompt}.

Photography style: PEYU Chile brand aesthetic, premium product photography, high resolution, sharp focus on the product, natural realistic shadows, no text, no watermark, no logos other than the product's own.`;

      const payload = { prompt };
      // Referencia obligatoria: la imagen actual del producto.
      // Si no hay imagen principal, usamos la primera de galería como ancla.
      const refUrl = producto.imagen_url || galeria[0];
      if (refUrl) {
        payload.existing_image_urls = [refUrl];
      }

      const res = await base44.integrations.Core.GenerateImage(payload);
      const url = res?.url || res?.data?.url;
      if (url) setPreviewUrl(url);
    } catch (e) {
      console.error('Error generando imagen', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar en galería (NO reemplaza la principal) ────────────────
  const guardarEnGaleria = async () => {
    if (!previewUrl) return;
    setSavingGallery(true);
    try {
      const nueva = [...galeria, previewUrl];
      await base44.entities.Producto.update(producto.id, { galeria_urls: nueva });
      onSaved?.({ galeria_urls: nueva });
      setPreviewUrl('');
    } finally {
      setSavingGallery(false);
    }
  };

  // ── Promover una imagen de galería a principal ────────────────────
  const promoverAPrincipal = async (url) => {
    setPromoting(true);
    try {
      // La imagen actual (si existe) se mueve a galería; la nueva pasa a principal.
      const restoGaleria = galeria.filter(u => u !== url);
      const nuevaGaleria = producto.imagen_url
        ? [producto.imagen_url, ...restoGaleria]
        : restoGaleria;
      await base44.entities.Producto.update(producto.id, {
        imagen_url: url,
        galeria_urls: nuevaGaleria,
      });
      onSaved?.({ imagen_url: url, galeria_urls: nuevaGaleria });
    } finally {
      setPromoting(false);
    }
  };

  // ── Eliminar imagen principal (manual + confirmación) ─────────────
  const eliminarImagenPrincipal = async () => {
    setDeletingMain(true);
    try {
      await base44.entities.Producto.update(producto.id, { imagen_url: '' });
      onSaved?.({ imagen_url: '' });
      setConfirmDelete(false);
    } finally {
      setDeletingMain(false);
    }
  };

  // ── Eliminar una imagen de galería ────────────────────────────────
  const eliminarDeGaleria = async (url) => {
    const nueva = galeria.filter(u => u !== url);
    await base44.entities.Producto.update(producto.id, { galeria_urls: nueva });
    onSaved?.({ galeria_urls: nueva });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-poppins font-semibold text-white text-sm">Imágenes del producto</h3>
        <p className="text-xs text-white/50 mt-0.5">
          La IA preserva el producto exacto y solo cambia el entorno · Las nuevas imágenes se guardan en galería sin reemplazar la principal
        </p>
      </div>

      {/* ───── Imagen principal + Preview generado ───── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Principal */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs uppercase tracking-wider text-white/50 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              Principal
            </p>
            {producto.imagen_url && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[10px] text-rose-300 hover:text-rose-200 flex items-center gap-1"
                title="Eliminar imagen principal"
              >
                <Trash2 className="w-3 h-3" /> Eliminar
              </button>
            )}
          </div>
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full aspect-square object-cover rounded-md"
            />
          ) : (
            <div className="w-full aspect-square rounded-md bg-white/5 flex flex-col items-center justify-center gap-1 text-white/30">
              <ImageIcon className="w-8 h-8" />
              <p className="text-[10px]">Sin imagen principal</p>
            </div>
          )}
        </div>

        {/* Preview IA */}
        <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-2">
          <p className="text-xs uppercase tracking-wider text-violet-300 mb-2 px-1 font-bold">Vista previa IA</p>
          {loading ? (
            <div className="w-full aspect-square rounded-md bg-black/30 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-violet-300 animate-spin" />
              <p className="text-xs text-white/60">Generando…</p>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="generada" className="w-full aspect-square object-cover rounded-md" />
          ) : (
            <div className="w-full aspect-square rounded-md bg-white/5 flex flex-col items-center justify-center gap-1 text-violet-300/40">
              <Wand2 className="w-8 h-8" />
              <p className="text-[10px]">Aún no generada</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmación eliminar principal */}
      {confirmDelete && (
        <div className="bg-rose-500/10 border border-rose-400/40 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-rose-200 font-semibold">¿Eliminar la imagen principal?</p>
            <p className="text-xs text-white/60 mt-0.5">El producto quedará sin imagen principal hasta que promuevas una de la galería o subas otra.</p>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={eliminarImagenPrincipal}
                disabled={deletingMain}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
              >
                {deletingMain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Sí, eliminar
              </Button>
              <Button
                onClick={() => setConfirmDelete(false)}
                size="sm"
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subida manual desde el equipo */}
      <ManualImageUpload producto={producto} onSaved={onSaved} />

      {/* Selector estilo */}
      <div>
        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Estilo del entorno (IA)</p>
        <div className="flex flex-wrap gap-2">
          {ESTILOS.map(s => (
            <button
              key={s.id}
              onClick={() => setEstilo(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                estilo === s.id
                  ? 'bg-violet-500 text-white border border-violet-400'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Acciones generar / guardar */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={generar}
          disabled={loading}
          size="sm"
          className="flex-1 min-w-[160px] gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {previewUrl ? 'Regenerar' : 'Generar imagen IA'}
        </Button>
        {previewUrl && (
          <>
            <Button
              onClick={guardarEnGaleria}
              disabled={savingGallery}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {savingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Añadir a galería
            </Button>
            <Button
              onClick={() => setPreviewUrl('')}
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2"
            >
              <X className="w-4 h-4" /> Descartar
            </Button>
          </>
        )}
      </div>

      {/* ───── Galería ───── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold">
            Galería · {galeria.length} {galeria.length === 1 ? 'imagen' : 'imágenes'}
          </p>
          {galeria.length > 0 && (
            <p className="text-[10px] text-white/40">Click en ⭐ para promover · 🗑 para eliminar</p>
          )}
        </div>
        {galeria.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-lg p-4 text-center text-xs text-white/40">
            Aún no hay imágenes alternativas. Genera una con IA y guárdala en la galería.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {galeria.map((url, i) => (
              <div key={`${url}-${i}`} className="relative group bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => promoverAPrincipal(url)}
                    disabled={promoting}
                    title="Promover a principal"
                    className="w-7 h-7 rounded-md bg-yellow-500 hover:bg-yellow-400 text-white flex items-center justify-center"
                  >
                    {promoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button
                    onClick={() => eliminarDeGaleria(url)}
                    title="Eliminar de galería"
                    className="w-7 h-7 rounded-md bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
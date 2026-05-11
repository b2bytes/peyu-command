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

// Mapea material a una descripción visual rica para la IA cuando NO hay imagen de referencia.
function describirMaterial(material = '') {
  const m = material.toLowerCase();
  if (m.includes('reciclado')) {
    return 'made of 100% recycled plastic with a subtle marbled/speckled texture (visible color flecks from recycled HDPE/PP plastic), matte finish, slightly irregular natural surface that proves it is reclaimed material — NOT shiny mass-produced plastic';
  }
  if (m.includes('trigo') || m.includes('compostable')) {
    return 'made of compostable wheat fiber bioplastic, soft beige/cream color with a natural fibrous texture, matte organic finish, slight grain visible — looks earthy and biodegradable';
  }
  return `made of ${material}`;
}

// Resumen corto de la descripción para inyectar en el prompt sin saturarlo.
function resumirDescripcion(desc = '', maxChars = 280) {
  if (!desc) return '';
  const limpio = desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (limpio.length <= maxChars) return limpio;
  return limpio.slice(0, maxChars).replace(/\s\S*$/, '') + '…';
}

// Detecta cantidad declarada en el título del producto.
// "Pack 6 Cachos", "Set 4 Posavasos", "Promoción 3 Maceteros", "Pack de 5", etc.
function detectarCantidad(nombre = '') {
  const m = nombre.match(/(?:pack|set|kit|combo|promo(?:ci[oó]n)?|caja|grupo)\s*(?:de\s+)?(\d{1,2})/i)
        || nombre.match(/\b(\d{1,2})\s*(?:unidades?|u\.?|pcs|piezas?)\b/i)
        || nombre.match(/\b(\d{1,2})\s*x\s+/i); // "6x cachos"
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 2 && n <= 20 ? n : null;
}

// Detecta el "ítem" del pack (cachos, posavasos, maceteros, etc.)
function detectarItem(nombre = '') {
  const lower = nombre.toLowerCase();
  const items = ['cachos', 'cacho', 'posavasos', 'posacachos', 'maceteros', 'macetero',
                 'sujetadores', 'sujetador', 'paletas', 'paleta', 'pocillos', 'pocillo',
                 'llaveros', 'llavero', 'soportes', 'soporte'];
  for (const it of items) if (lower.includes(it)) return it;
  return 'unidades';
}

export default function AIImageEnhancer({ producto, onSaved }) {
  const [estilo, setEstilo] = useState('lifestyle');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [savingGallery, setSavingGallery] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [deletingMain, setDeletingMain] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [instruccionExtra, setInstruccionExtra] = useState('');
  // Generación batch: una imagen por cada uno de los 4 estilos en paralelo.
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [batchResults, setBatchResults] = useState([]); // [{ id, label, url, error }]
  const [savingBatch, setSavingBatch] = useState(false);

  const galeria = Array.isArray(producto.galeria_urls) ? producto.galeria_urls : [];
  const cantidadEsperada = detectarCantidad(producto.nombre);
  const itemNombre = detectarItem(producto.nombre);

  // ── Construcción del prompt (reutilizable para single + batch) ────
  // 🚫 Compatible con Google Shopping: NO marcas, NO logos, NO texto, NO watermark.
  const buildPrompt = (styleObj, tieneReferencia) => {
    const reglaCantidad = cantidadEsperada
      ? `\n\nCRITICAL — EXACT QUANTITY REQUIRED:
- This product is a "${producto.nombre}". You MUST show EXACTLY ${cantidadEsperada} ${itemNombre} in the image. Not fewer, not more.
- Count them visually before finishing. The image MUST contain ${cantidadEsperada} individual ${itemNombre} clearly visible.
- Arrange them neatly so all ${cantidadEsperada} are clearly countable.`
      : '';

    const reglaExtra = instruccionExtra.trim()
      ? `\n\nADDITIONAL ADMIN INSTRUCTION:\n${instruccionExtra.trim()}`
      : '';

    const descripcionResumida = resumirDescripcion(producto.descripcion);
    const materialVisual = describirMaterial(producto.material);
    const contextoProducto = `
PRODUCT BRIEF (use this to understand what to show):
- Name: ${producto.nombre}
- Category: ${producto.categoria}
- Material: ${materialVisual}
- Channel: ${producto.canal}${descripcionResumida ? `\n- Real product description (from catalog): "${descripcionResumida}"` : ''}`;

    // 🚫 Reglas anti-marca obligatorias (Google Shopping compliance)
    const reglasAntiMarca = `

ABSOLUTE PROHIBITIONS (Google Shopping policy — STRICTLY ENFORCED):
- ❌ NO brand names, NO company names, NO text of any kind anywhere in the image.
- ❌ NO logos: not on the product, not in the background, not on packaging, not on props.
- ❌ NO watermarks, NO captions, NO labels with readable text.
- ❌ NO third-party trademarks (Apple, Nike, Coca-Cola, IKEA, Starbucks, etc.) visible on any object, screen, book cover, mug, sign, or surface.
- ❌ NO competitor products or branded competitor packaging.
- ❌ NO PEYU logo either — this image must be 100% brand-neutral.
- ✅ The product itself must appear completely UNBRANDED — plain surface, no engraved/printed brand marks.
- ✅ If props appear (laptop, phone, mug, notebook), they must be GENERIC and brandless.
- ✅ All text-like surfaces (book spines, packaging, screens, signs) must be blank or blurred.`;

    if (tieneReferencia) {
      return `Take the EXACT product shown in the reference image(s) and place it in a new scene.${contextoProducto}

CRITICAL — DO NOT CHANGE THE PRODUCT:
- The product must look IDENTICAL to the reference: same shape, exact same color, same material texture, same proportions, same details and finishings.
- Do not redesign, restyle, recolor, or alter the product in any way.
- IMPORTANT: If the reference shows any logo or brand mark on the product, REMOVE it cleanly in the output. The output product must be unbranded.
- Keep the product as the clear hero of the composition, centered and in sharp focus.${reglaCantidad}

ONLY CHANGE THE BACKGROUND, SETTING AND LIGHTING:
${styleObj.prompt}.${reglaExtra}${reglasAntiMarca}

Photography style: premium e-commerce product photography, high resolution, sharp focus on the product, natural realistic shadows. Looks like a real DSLR product photo, not 3D render.`;
    }

    return `Create a realistic, premium product photograph for an e-commerce listing of a sustainable Chilean product.${contextoProducto}

CRITICAL — DESIGN THE PRODUCT FROM THE BRIEF:
- Render the product as accurately as possible based on the name, category and description above.
- Make sure the MATERIAL is visually unmistakable: ${materialVisual}. This is the most important visual detail — the viewer must instantly recognize the product is made of this material.
- If the description mentions specific features (size, color, finish, parts), include them faithfully.
- Single hero product, well composed, sharp focus, realistic proportions.${reglaCantidad}

SCENE / BACKGROUND:
${styleObj.prompt}.${reglaExtra}${reglasAntiMarca}

Photography style: sustainability-forward, natural, warm and premium. High resolution, realistic shadows. Looks like a real DSLR product photo, not 3D render.`;
  };

  // ── Generar 1 imagen del estilo seleccionado ──────────────────────
  const generar = async () => {
    setLoading(true);
    setPreviewUrl('');
    try {
      const styleObj = ESTILOS.find(s => s.id === estilo);
      const refs = [producto.imagen_url, ...galeria].filter(Boolean).slice(0, 4);
      const tieneReferencia = refs.length > 0;
      const prompt = buildPrompt(styleObj, tieneReferencia);

      const payload = { prompt };
      if (tieneReferencia) payload.existing_image_urls = refs;

      const res = await base44.integrations.Core.GenerateImage(payload);
      const url = res?.url || res?.data?.url;
      if (url) setPreviewUrl(url);
    } catch (e) {
      console.error('Error generando imagen', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Generar 1 imagen por cada estilo (4 imágenes en paralelo) ─────
  const generarTodosLosEstilos = async () => {
    setBatchLoading(true);
    setBatchResults([]);
    setBatchProgress({ done: 0, total: ESTILOS.length });
    const refs = [producto.imagen_url, ...galeria].filter(Boolean).slice(0, 4);
    const tieneReferencia = refs.length > 0;

    const runOne = async (styleObj) => {
      try {
        const payload = { prompt: buildPrompt(styleObj, tieneReferencia) };
        if (tieneReferencia) payload.existing_image_urls = refs;
        const res = await base44.integrations.Core.GenerateImage(payload);
        const url = res?.url || res?.data?.url;
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
        return { id: styleObj.id, label: styleObj.label, url };
      } catch (e) {
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
        return { id: styleObj.id, label: styleObj.label, error: e.message };
      }
    };

    const results = await Promise.all(ESTILOS.map(runOne));
    setBatchResults(results);
    setBatchLoading(false);
  };

  // ── Guardar TODAS las imágenes batch exitosas a la galería ────────
  const guardarBatchEnGaleria = async () => {
    const urls = batchResults.filter(r => r.url).map(r => r.url);
    if (urls.length === 0) return;
    setSavingBatch(true);
    try {
      const nueva = [...galeria, ...urls];
      await base44.entities.Producto.update(producto.id, { galeria_urls: nueva });
      onSaved?.({ galeria_urls: nueva });
      setBatchResults([]);
    } finally {
      setSavingBatch(false);
    }
  };

  const guardarUnaDelBatch = async (url) => {
    if (!url) return;
    const nueva = [...galeria, url];
    await base44.entities.Producto.update(producto.id, { galeria_urls: nueva });
    onSaved?.({ galeria_urls: nueva });
    setBatchResults(prev => prev.filter(r => r.url !== url));
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

      {/* Modo de generación + contexto que recibirá la IA */}
      <div className="bg-violet-500/5 border border-violet-400/20 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-semibold text-violet-200 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" />
          {producto.imagen_url || galeria.length > 0
            ? 'Modo Restyle · preserva el producto real y cambia el entorno'
            : 'Modo Creativo · sin imagen base, genera desde el título y descripción'}
        </p>
        <ul className="text-[11px] text-white/60 space-y-0.5 pl-5 list-disc">
          <li>Título: <span className="text-white/80">{producto.nombre}</span></li>
          <li>Material: <span className="text-white/80">{producto.material}</span> · Categoría: <span className="text-white/80">{producto.categoria}</span></li>
          <li>
            Descripción del catálogo:{' '}
            {producto.descripcion
              ? <span className="text-emerald-300">✓ se usará para guiar la imagen</span>
              : <span className="text-amber-300">⚠ vacía — generá una en la pestaña "Descripción IA" para mejores resultados</span>}
          </li>
        </ul>
      </div>

      {/* 🎯 Cantidad detectada del título — fuerza a la IA a mostrar la cantidad real */}
      {cantidadEsperada && (
        <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-lg p-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="text-emerald-200 font-semibold">
              Detectamos "<strong>Pack {cantidadEsperada} {itemNombre}</strong>" en el título.
            </p>
            <p className="text-emerald-300/80 mt-0.5">
              La IA va a generar la imagen con <strong>{cantidadEsperada} {itemNombre}</strong> visibles, no menos.
            </p>
          </div>
        </div>
      )}

      {/* Instrucción adicional libre — para casos especiales (color, ángulo, contexto) */}
      <div>
        <label className="text-xs uppercase tracking-wider text-white/40 mb-1.5 block">
          Instrucción extra para la IA <span className="text-white/30 normal-case">(opcional)</span>
        </label>
        <textarea
          value={instruccionExtra}
          onChange={(e) => setInstruccionExtra(e.target.value)}
          placeholder='Ej: "mostrar los 6 cachos en círculo con una mano sosteniendo uno", "tomas cenitales", "incluir empaque"…'
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-violet-400/50 focus:outline-none resize-none"
          rows={2}
        />
      </div>

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
          disabled={loading || batchLoading}
          size="sm"
          className="flex-1 min-w-[160px] gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {previewUrl ? 'Regenerar estilo actual' : 'Generar 1 imagen'}
        </Button>
        <Button
          onClick={generarTodosLosEstilos}
          disabled={loading || batchLoading}
          size="sm"
          className="flex-1 min-w-[160px] gap-2 bg-gradient-to-r from-cyan-500 to-emerald-600 hover:from-cyan-600 hover:to-emerald-700 text-white"
        >
          {batchLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> {batchProgress.done}/{batchProgress.total}…</>
            : <><Wand2 className="w-4 h-4" /> Generar 4 estilos</>
          }
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

      {/* Resultados batch (4 estilos) */}
      {(batchLoading || batchResults.length > 0) && (
        <div className="bg-cyan-500/5 border border-cyan-400/20 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              Los 4 estilos (sin marcas — apto Google Shopping)
            </p>
            {batchResults.filter(r => r.url).length > 0 && !batchLoading && (
              <Button
                onClick={guardarBatchEnGaleria}
                disabled={savingBatch}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-7 text-xs"
              >
                {savingBatch ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Guardar todas en galería ({batchResults.filter(r => r.url).length})
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ESTILOS.map(s => {
              const res = batchResults.find(r => r.id === s.id);
              const pendiente = batchLoading && !res;
              return (
                <div key={s.id} className="bg-black/20 border border-white/10 rounded-lg overflow-hidden">
                  <div className="aspect-square relative bg-white/5 flex items-center justify-center">
                    {pendiente && <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />}
                    {res?.url && (
                      <>
                        <img src={res.url} alt={s.label} className="w-full h-full object-cover" />
                        <button
                          onClick={() => guardarUnaDelBatch(res.url)}
                          className="absolute bottom-1.5 right-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-md font-medium flex items-center gap-1"
                          title="Añadir a galería"
                        >
                          <Plus className="w-3 h-3" /> Guardar
                        </button>
                      </>
                    )}
                    {res?.error && (
                      <div className="text-[10px] text-rose-300 px-2 text-center">
                        <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                        Falló
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-white/70 font-medium text-center border-t border-white/5">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
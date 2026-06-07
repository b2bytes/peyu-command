// ============================================================================
// CreatorPanel · Generador de imágenes y videos IA para Social Studio
// Persiste cada generación en ContentAsset para reutilizar en posts.
// ============================================================================
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon, Video, Loader2, Download, Copy, Sparkles, RefreshCw, Check, FolderOpen, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatorGallery from './CreatorGallery';
import ProductPhotoLibrary from './ProductPhotoLibrary';

const IMAGE_STYLES = [
  { id: 'product_hero', label: '📸 Hero producto', desc: 'Foto editorial clean sobre fondo sustentable' },
  { id: 'social_promo', label: '🎨 Promo social', desc: 'Visual llamativo 1:1 con branding PEYU' },
  { id: 'lifestyle', label: '🏠 Lifestyle', desc: 'Producto en contexto real de uso' },
  { id: 'behind_scenes', label: '🔧 Detrás de escena', desc: 'Proceso de fabricación / reciclaje' },
  { id: 'infographic', label: '📊 Infográfico', desc: 'Data visual sobre impacto ambiental' },
  { id: 'custom', label: '✏️ Custom', desc: 'Describe tú la imagen' },
];

const VIDEO_STYLES = [
  { id: 'product_reveal', label: '🎬 Reveal producto', desc: 'Unboxing / reveal cinematográfico' },
  { id: 'process', label: '♻️ Proceso circular', desc: 'Del plástico reciclado al producto final' },
  { id: 'testimonial', label: '💬 Testimonio', desc: 'Cliente usando el producto' },
  { id: 'custom_video', label: '✏️ Custom', desc: 'Describe tú el video' },
];

export default function CreatorPanel() {
  const [mode, setMode] = useState('image');
  const [style, setStyle] = useState('product_hero');
  const [customPrompt, setCustomPrompt] = useState('');
  const [productContext, setProductContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [videoDuration, setVideoDuration] = useState(6);
  const [videoRatio, setVideoRatio] = useState('9:16');
  const [view, setView] = useState('create'); // 'create' | 'gallery' | 'photos'
  const [gallery, setGallery] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [refPhotoUrl, setRefPhotoUrl] = useState(null); // foto real seleccionada como referencia IA

  // Cargar galería de assets IA
  const loadGallery = async () => {
    const assets = await base44.entities.ContentAsset.filter(
      { generado_por_ia: true },
      '-created_date',
      50
    );
    setGallery(assets || []);
    setLoadingGallery(false);
  };

  useEffect(() => { loadGallery(); }, []);

  const saveToGallery = async (type, url, prompt) => {
    const styleName = currentStyles.find(s => s.id === style)?.label || style;
    const asset = await base44.entities.ContentAsset.create({
      nombre: `${type === 'image' ? 'Imagen' : 'Video'} IA · ${styleName}`,
      tipo: type === 'image' ? 'Imagen' : 'Video',
      url,
      generado_por_ia: true,
      prompt_ia: prompt?.slice(0, 500),
      categoria: style === 'lifestyle' ? 'Lifestyle' : style === 'behind_scenes' || style === 'process' ? 'Proceso productivo' : 'Producto',
      formato: type === 'video' ? (videoRatio === '9:16' ? 'Reel 9:16' : 'Horizontal 16:9') : 'Cuadrado 1:1',
      tags: ['ia-generado', mode, style],
    });
    setGallery(prev => [asset, ...prev]);
  };

  const handleDeleteAsset = async (id) => {
    await base44.entities.ContentAsset.delete(id);
    setGallery(prev => prev.filter(a => a.id !== id));
  };

  const buildImagePrompt = () => {
    const base = `Promotional photo for PEYU Chile, a sustainable brand that makes products from 100% recycled ocean plastic and compostable wheat fiber. Made in Chile. Brand colors: green #0F8B6C, sand #E7D8C6, terracotta #D96B4D.`;
    const product = productContext ? ` Product context: ${productContext}.` : '';
    const refNote = refPhotoUrl ? ` Use the provided reference photo as the base product — replicate the exact product, shape, color and details faithfully, only change the scene/style/lighting as described.` : '';

    const stylePrompts = {
      product_hero: `Clean editorial product photography on a minimalist natural background (recycled wood, kraft paper, plant leaves). Soft directional lighting, slight shadow. Modern, premium feel. Square format.${product}${refNote}`,
      social_promo: `Bold social media promotional image, 1:1 square format. Vibrant yet natural color palette with PEYU green accents. Eye-catching typography-friendly composition with space for text overlay. Dynamic angle.${product}${refNote}`,
      lifestyle: `Lifestyle photography showing the product being used naturally in a modern Chilean home/office. Warm natural lighting, candid feel. Person interacting with the product. Authentic, not staged.${product}${refNote}`,
      behind_scenes: `Documentary-style photo of the sustainable manufacturing process. Raw recycled plastic pellets transforming into finished products. Industrial yet clean aesthetic. Circular economy in action.${product}${refNote}`,
      infographic: `Clean data visualization infographic about environmental impact of recycled products. Modern flat design, PEYU green palette. Stats about ocean plastic rescued, CO2 saved. Square format for Instagram.${product}${refNote}`,
      custom: customPrompt,
    };

    return `${base} ${stylePrompts[style] || customPrompt}`;
  };

  const buildVideoPrompt = () => {
    const base = `Cinematic video for PEYU Chile, sustainable brand. Products made from 100% recycled ocean plastic and compostable wheat fiber. Chilean brand. Premium quality, eco-conscious.`;
    const product = productContext ? ` Product: ${productContext}.` : '';

    const stylePrompts = {
      product_reveal: `Smooth cinematic product reveal/unboxing. Start with close-up of recycled material texture, pull back to reveal the finished product. Elegant lighting transitions. Premium feel with sustainability message.${product}`,
      process: `Documentary-style showing circular economy process: ocean plastic collected → cleaned → pelletized → injection molded into a beautiful product. Time-lapse feel, satisfying transitions.${product}`,
      testimonial: `Professional person in a modern Chilean office using a PEYU product at their desk. Natural movements, warm lighting. Happy, authentic interaction with the product. Subtle focus shift.${product}`,
      custom_video: customPrompt,
    };

    return `${base} ${stylePrompts[style] || customPrompt}`;
  };

  const generate = async () => {
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      if (mode === 'image') {
        const prompt = buildImagePrompt();
        const params = { prompt };
        if (refPhotoUrl) params.existing_image_urls = [refPhotoUrl];
        const res = await base44.integrations.Core.GenerateImage(params);
        setResult({ type: 'image', url: res.url });
        await saveToGallery('image', res.url, prompt);
      } else {
        const prompt = buildVideoPrompt();
        const res = await base44.integrations.Core.GenerateVideo({
          prompt,
          duration: videoDuration,
          aspect_ratio: videoRatio,
        });
        setResult({ type: 'video', url: res.url });
        await saveToGallery('video', res.url, prompt);
      }
    } catch (e) {
      setError(e.message || 'Error al generar');
    } finally {
      setGenerating(false);
    }
  };

  const copyUrl = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentStyles = mode === 'image' ? IMAGE_STYLES : VIDEO_STYLES;

  return (
    <div className="h-full flex flex-col min-h-0 bg-black/20 rounded-2xl border border-white/5">
      <div className="flex-1 overflow-y-auto peyu-scrollbar-light p-4 min-h-0">
        <div className="max-w-3xl mx-auto space-y-4 pb-6">

          {/* View toggle: Crear / Galería */}
          <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-white/5 rounded-xl w-fit">
            <button
              onClick={() => { setMode('image'); setStyle('product_hero'); setResult(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'image' ? 'bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-md' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Imagen IA
            </button>
            <button
              onClick={() => { setMode('video'); setStyle('product_reveal'); setResult(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'video' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Video IA
            </button>
          </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setView('photos')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  view === 'photos'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-400/30'
                    : 'bg-white/5 text-white/50 hover:text-white/80 border border-white/10'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Catálogo{refPhotoUrl ? ' ✓' : ''}
              </button>
              <button
                onClick={() => setView(view === 'gallery' ? 'create' : 'gallery')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  view === 'gallery'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-white/5 text-white/50 hover:text-white/80 border border-white/10'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Galería IA ({gallery.length})
              </button>
            </div>
          </div>

          {/* Product photo library */}
          {view === 'photos' && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3 h-3" /> Selecciona una foto real como referencia IA
                </p>
                <button
                  onClick={() => setView('create')}
                  className="text-[10px] text-white/40 hover:text-white/70 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  ← Volver a crear
                </button>
              </div>
              {refPhotoUrl && (
                <div className="mb-3 p-2 bg-violet-500/10 border border-violet-400/20 rounded-xl flex items-center gap-2">
                  <img src={refPhotoUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-violet-400/40" />
                  <div>
                    <p className="text-[10px] font-bold text-violet-300">Foto de referencia seleccionada</p>
                    <p className="text-[10px] text-white/40">La IA usará esta imagen como base del producto</p>
                  </div>
                </div>
              )}
              <ProductPhotoLibrary
                selectedUrl={refPhotoUrl}
                onSelect={(url) => {
                  setRefPhotoUrl(url);
                  if (url) setView('create');
                }}
              />
            </div>
          )}

          {/* Gallery view */}
          {view === 'gallery' && (
            loadingGallery ? (
              <div className="flex items-center justify-center gap-2 py-10 text-white/40">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando galería…
              </div>
            ) : (
              <CreatorGallery assets={gallery} onDelete={handleDeleteAsset} />
            )
          )}

          {/* Creator form — solo visible en modo crear */}
          {view === 'create' && <>

          {/* Style grid */}
          <div>
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2 block">Estilo</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {currentStyles.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    style === s.id
                      ? 'bg-white/10 border-violet-400/50 ring-1 ring-violet-400/30'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                  }`}
                >
                  <p className="text-xs font-bold text-white leading-tight">{s.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 leading-snug">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Product context */}
          <div>
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Contexto producto (opcional)</label>
            <input
              value={productContext}
              onChange={e => setProductContext(e.target.value)}
              placeholder="Ej: Organizador de escritorio en plástico reciclado azul marino"
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Custom prompt */}
          {(style === 'custom' || style === 'custom_video') && (
            <div>
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Tu prompt personalizado</label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="Describe la imagen o video que necesitas..."
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
          )}

          {/* Video options */}
          {mode === 'video' && (
            <div className="flex items-center gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Duración</label>
                <div className="flex gap-1">
                  {[4, 6, 8].map(d => (
                    <button
                      key={d}
                      onClick={() => setVideoDuration(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        videoDuration === d ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Formato</label>
                <div className="flex gap-1">
                  {[{ v: '9:16', l: '9:16 Reel' }, { v: '16:9', l: '16:9 Feed' }].map(r => (
                    <button
                      key={r.v}
                      onClick={() => setVideoRatio(r.v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        videoRatio === r.v ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {r.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-amber-300/60 mt-4">
                ⚡ {videoDuration * 5} créditos
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={generate}
            disabled={generating || ((style === 'custom' || style === 'custom_video') && !customPrompt.trim())}
            className={`w-full gap-2 text-white font-bold ${
              mode === 'image'
                ? 'bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === 'image' ? 'Generando imagen…' : `Generando video ${videoDuration}s…`}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {mode === 'image' ? 'Generar imagen' : 'Generar video'}
              </>
            )}
          </Button>

          {error && (
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-xl p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  {result.type === 'image' ? 'Imagen generada' : 'Video generado'}
                  <span className="text-[10px] text-white/30 font-normal ml-1">· Guardado en galería</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={copyUrl} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/60 hover:text-white transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado' : 'URL'}
                  </button>
                  <a href={result.url} download target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/60 hover:text-white transition-colors">
                    <Download className="w-3 h-3" /> Descargar
                  </a>
                  <button
                    onClick={generate}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-[10px] text-violet-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerar
                  </button>
                </div>
              </div>
              <div className="p-3">
                {result.type === 'image' ? (
                  <img src={result.url} alt="Generada por IA" className="w-full max-h-[400px] object-contain rounded-xl" />
                ) : (
                  <video src={result.url} controls className="w-full max-h-[400px] rounded-xl" />
                )}
              </div>
            </div>
          )}

          </>}

        </div>
      </div>
    </div>
  );
}
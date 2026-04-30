import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2, Check, Wand2, Sparkles } from 'lucide-react';

const ESTILOS = [
  { id: 'lifestyle', label: 'Lifestyle', prompt: 'lifestyle premium product photography, soft natural light, scandinavian wooden desk, plants in background, shallow depth of field' },
  { id: 'studio', label: 'Estudio limpio', prompt: 'clean studio shot, white seamless background, soft shadow, professional product catalog photography' },
  { id: 'corporate', label: 'Corporativo', prompt: 'corporate gift environment, modern office desk, branded packaging, executive setting, warm lighting' },
  { id: 'eco', label: 'Eco / Naturaleza', prompt: 'natural eco environment, recycled materials texture, leaves and natural fibers, sustainability focused, earthy tones' },
];

/**
 * Genera o mejora una imagen del producto usando GenerateImage,
 * pasando la imagen actual del producto como referencia (si existe).
 */
export default function AIImageEnhancer({ producto, onSaved }) {
  const [estilo, setEstilo] = useState('lifestyle');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const generar = async () => {
    setLoading(true);
    setGeneratedUrl('');
    try {
      const styleObj = ESTILOS.find(s => s.id === estilo);
      const prompt = `Professional product photography of "${producto.nombre}", ${producto.material.toLowerCase()}, sustainable ${producto.categoria.toLowerCase()} product. Style: ${styleObj.prompt}. PEYU Chile brand aesthetic, eco-friendly, premium quality, sharp focus, high resolution.`;

      const payload = { prompt };
      if (producto.imagen_url) {
        payload.existing_image_urls = [producto.imagen_url];
      }

      const res = await base44.integrations.Core.GenerateImage(payload);
      const url = res?.url || res?.data?.url;
      if (url) setGeneratedUrl(url);
    } catch (e) {
      console.error('Error generando imagen', e);
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!generatedUrl) return;
    setSaving(true);
    try {
      await base44.entities.Producto.update(producto.id, { imagen_url: generatedUrl });
      onSaved?.(generatedUrl);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins font-semibold text-white text-sm">Imagen del producto</h3>
          <p className="text-xs text-white/50 mt-0.5">Mejora o genera con IA · Usa la imagen actual como referencia</p>
        </div>
      </div>

      {/* Imagen actual */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-lg p-2">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2 px-1">Actual</p>
          {producto.imagen_url ? (
            <img src={producto.imagen_url} alt={producto.nombre} className="w-full aspect-square object-cover rounded-md" />
          ) : (
            <div className="w-full aspect-square rounded-md bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white/20" />
            </div>
          )}
        </div>

        <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-2">
          <p className="text-xs uppercase tracking-wider text-violet-300 mb-2 px-1 font-bold">Generada IA</p>
          {loading ? (
            <div className="w-full aspect-square rounded-md bg-black/30 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-violet-300 animate-spin" />
              <p className="text-xs text-white/50">Generando…</p>
            </div>
          ) : generatedUrl ? (
            <img src={generatedUrl} alt="generada" className="w-full aspect-square object-cover rounded-md" />
          ) : (
            <div className="w-full aspect-square rounded-md bg-white/5 flex items-center justify-center">
              <Wand2 className="w-8 h-8 text-violet-300/40" />
            </div>
          )}
        </div>
      </div>

      {/* Selector estilo */}
      <div>
        <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Estilo</p>
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

      <div className="flex gap-2">
        <Button
          onClick={generar}
          disabled={loading}
          size="sm"
          className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generatedUrl ? 'Regenerar' : 'Generar imagen IA'}
        </Button>
        {generatedUrl && (
          <Button
            onClick={guardar}
            disabled={saving}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </Button>
        )}
      </div>
    </div>
  );
}
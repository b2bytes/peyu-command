// ============================================================================
// PromoImageGenerator — Genera imagen promocional 1:1 con branding PEYU
// ----------------------------------------------------------------------------
// Pensada para difusión en Instagram/LinkedIn. La función backend integra el
// ADN PEYU (paleta + copy + composición con espacio para texto).
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Loader2, Download, Share2, Instagram, Linkedin,
  AlertTriangle, ImageIcon, RefreshCw, ExternalLink, Copy, Check,
} from 'lucide-react';

export default function PromoImageGenerator({ producto, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const promoUrl = producto.imagen_promo_url;
  const generadaAt = producto.imagen_promo_generada_at;

  const generar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('generateProductPromoImage', {
        producto_id: producto.id,
      });
      const data = res?.data;
      if (!data?.success || !data.imagen_promo_url) {
        throw new Error(data?.error || 'No se pudo generar la imagen');
      }
      onSaved?.({
        imagen_promo_url: data.imagen_promo_url,
        imagen_promo_generada_at: new Date().toISOString(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copiarUrl = async () => {
    if (!promoUrl) return;
    await navigator.clipboard.writeText(promoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const captionSuggestions = buildCaptions(producto);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-poppins font-semibold text-white text-sm flex items-center gap-1.5">
          <Share2 className="w-4 h-4 text-pink-400" />
          Imagen Promo · Redes sociales
        </h3>
        <p className="text-xs text-white/50 mt-0.5">
          Cuadrada (1:1) con paleta PEYU y espacio para tu copy. Lista para Instagram, LinkedIn y feed.
        </p>
      </div>

      {/* Aviso si no hay imagen principal */}
      {!producto.imagen_url && (
        <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">
            Carga primero una imagen principal del producto en la pestaña "Imagen IA". La promo usa esa imagen como referencia visual.
          </p>
        </div>
      )}

      {/* Preview */}
      <div className="bg-gradient-to-br from-pink-500/10 to-violet-500/10 border border-pink-400/20 rounded-xl p-3">
        <div className="aspect-square rounded-lg overflow-hidden bg-black/30 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-white/60">
              <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              <p className="text-xs">Generando imagen promocional…</p>
              <p className="text-[10px] text-white/40">Esto toma 5-10 segundos</p>
            </div>
          ) : promoUrl ? (
            <img src={promoUrl} alt={`Promo ${producto.nombre}`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/30">
              <ImageIcon className="w-10 h-10" />
              <p className="text-xs">Aún no se ha generado</p>
            </div>
          )}
        </div>

        {generadaAt && !loading && (
          <p className="text-[10px] text-white/40 text-center mt-2">
            Generada {new Date(generadaAt).toLocaleString('es-CL')}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-400/30 rounded-lg p-2.5 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={generar}
          disabled={loading || !producto.imagen_url}
          className="flex-1 min-w-[180px] gap-2 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : promoUrl ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {promoUrl ? 'Regenerar imagen' : 'Generar imagen promo'}
        </Button>
        {promoUrl && (
          <>
            <Button
              onClick={copiarUrl}
              variant="outline"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar URL'}
            </Button>
            <a
              href={promoUrl}
              download={`peyu-promo-${producto.sku || producto.id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <Download className="w-4 h-4" /> Descargar
            </a>
          </>
        )}
      </div>

      {/* Captions sugeridas */}
      {promoUrl && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/50 font-semibold flex items-center gap-1.5">
            <Instagram className="w-3 h-3" />
            <Linkedin className="w-3 h-3" />
            Copy sugerido para redes
          </p>
          {captionSuggestions.map((c, i) => (
            <CaptionCard key={i} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function buildCaptions(p) {
  const material = p.material?.includes('Trigo') ? 'fibra de trigo compostable' : 'plástico 100% reciclado';
  return [
    {
      red: 'Instagram',
      texto: `🌱 Te presentamos ${p.nombre}\n\nHecho en Chile con ${material} ♻️\n${p.descripcion?.slice(0, 100) || 'Diseño consciente, gifting con propósito.'}\n\n👉 peyuchile.cl\n\n#PeyuChile #RegalosCorporativos #EconomíaCircular #HechoEnChile`,
    },
    {
      red: 'LinkedIn',
      texto: `Nuevo en el catálogo PEYU: ${p.nombre} 🇨🇱\n\nFabricado con ${material}, ${p.descripcion?.slice(0, 140) || 'una pieza que combina diseño chileno con compromiso ambiental.'}\n\nGifting corporativo con impacto medible. Personalización láser desde 10 unidades.`,
    },
  ];
}

function CaptionCard({ red, texto }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-black/20 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{red}</span>
        <button
          onClick={copy}
          className="text-[10px] text-white/50 hover:text-white flex items-center gap-1"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>
      <p className="text-xs text-white/80 whitespace-pre-line leading-relaxed">{texto}</p>
    </div>
  );
}
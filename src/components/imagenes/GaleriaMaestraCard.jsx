// ============================================================================
// GaleriaMaestraCard — Card individual de imagen con acciones (promover, etc).
// ============================================================================
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, StarOff, Trash2, Share2, ImageIcon, Loader2, ExternalLink, Check } from 'lucide-react';

export default function GaleriaMaestraCard({ image, onUpdated }) {
  const [busy, setBusy] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const action = async (operation) => {
    setBusy(operation);
    try {
      await base44.functions.invoke('manageProductImage', {
        producto_id: image.producto_id,
        image_url: image.url,
        operation,
      });
      onUpdated?.();
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  const isPrincipal = image.role === 'principal';
  const isPromo = image.role === 'promo';
  const isGallery = image.role === 'gallery';

  return (
    <div className={`relative bg-white/5 border rounded-xl overflow-hidden transition-all ${
      isPrincipal ? 'border-amber-400/50 ring-1 ring-amber-400/30' :
      isPromo ? 'border-pink-400/50 ring-1 ring-pink-400/30' :
      'border-white/10 hover:border-white/30'
    }`}>
      <div className="aspect-square bg-black/30 relative">
        {image.url ? (
          <img src={image.url} alt={image.producto_nombre} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {isPrincipal && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/90 backdrop-blur text-[9px] text-white font-bold flex items-center gap-1">
              <Star className="w-2.5 h-2.5" /> Principal
            </span>
          )}
          {isPromo && (
            <span className="px-1.5 py-0.5 rounded-full bg-pink-500/90 backdrop-blur text-[9px] text-white font-bold flex items-center gap-1">
              <Share2 className="w-2.5 h-2.5" /> Promo
            </span>
          )}
          {isGallery && (
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur text-[9px] text-white font-medium">
              Galería
            </span>
          )}
        </div>

        {image.source && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] text-white/80 font-mono">
            {image.source}
          </span>
        )}
      </div>

      <div className="p-2 space-y-1.5">
        <p className="text-[11px] text-white font-medium truncate" title={image.producto_nombre}>
          {image.producto_nombre || 'Sin producto'}
        </p>
        <p className="text-[9px] font-mono text-white/40 truncate">{image.producto_sku}</p>

        <div className="flex gap-1 pt-1">
          {!isPrincipal && isGallery && (
            <button
              onClick={() => action('promote_to_principal')}
              disabled={!!busy}
              title="Promover a imagen principal"
              className="flex-1 h-6 rounded text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 flex items-center justify-center gap-0.5"
            >
              {busy === 'promote_to_principal' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Star className="w-2.5 h-2.5" />} Principal
            </button>
          )}
          {!isPromo && (
            <button
              onClick={() => action('set_as_promo')}
              disabled={!!busy}
              title="Marcar como imagen promo"
              className="flex-1 h-6 rounded text-[10px] bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 disabled:opacity-50 flex items-center justify-center gap-0.5"
            >
              {busy === 'set_as_promo' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Share2 className="w-2.5 h-2.5" />} Promo
            </button>
          )}
          {isPrincipal && (
            <button
              onClick={() => action('demote_to_gallery')}
              disabled={!!busy}
              title="Mover a galería"
              className="flex-1 h-6 rounded text-[10px] bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50 flex items-center justify-center gap-0.5"
            >
              {busy === 'demote_to_gallery' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <StarOff className="w-2.5 h-2.5" />} Galería
            </button>
          )}
          {confirmDelete ? (
            <button
              onClick={() => action('delete')}
              disabled={!!busy}
              className="h-6 px-2 rounded text-[10px] bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center gap-0.5"
            >
              {busy === 'delete' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={!!busy}
              title="Eliminar referencia"
              className="h-6 w-6 rounded bg-white/5 text-white/50 hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-center"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
          {image.url && (
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en nueva pestaña"
              className="h-6 w-6 rounded bg-white/5 text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center"
            >
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
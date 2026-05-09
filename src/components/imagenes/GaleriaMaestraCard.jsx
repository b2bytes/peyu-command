import { useState } from 'react';
import { Trash2, Star, Copy, Check, Download, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ORIGEN_LABELS = {
  base44: { label: 'Base44 CDN', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  wordpress: { label: 'WordPress (legacy)', color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' },
  wayback: { label: 'Wayback', color: 'bg-violet-500/20 text-violet-300 border-violet-400/30' },
  unsplash: { label: 'Unsplash', color: 'bg-sky-500/20 text-sky-300 border-sky-400/30' },
  gdrive: { label: 'G. Drive', color: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
  external: { label: 'Externa', color: 'bg-slate-500/20 text-slate-300 border-slate-400/30' },
  unknown: { label: '?', color: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
};

const SUB_ORIGEN_LABELS = {
  wayback: '🕰️ Wayback',
  drive: '📁 Drive',
  woo: '🛒 Woo',
  ai: '🤖 IA',
  mockup: '🎨 Mockup',
  manual: '✋ Manual',
};

const ROLE_LABELS = {
  principal: { label: '⭐ Principal', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' },
  galeria: { label: 'Galería', color: 'bg-white/10 text-white/70 border-white/20' },
  galeria_dup_principal: { label: '⚠️ Dup', color: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
  promo: { label: '📣 Promo', color: 'bg-pink-500/20 text-pink-300 border-pink-400/30' },
};

export default function GaleriaMaestraCard({ img, onChange }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(null);

  const origen = ORIGEN_LABELS[img.origin] || ORIGEN_LABELS.unknown;
  const role = ROLE_LABELS[img.role] || ROLE_LABELS.galeria;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(img.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const callAction = async (action, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(action);
    try {
      await base44.functions.invoke('manageProductImage', {
        producto_id: img.producto_id,
        url: img.url,
        action,
      });
      onChange?.();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-violet-400/40 transition-all group">
      <div className="relative aspect-square bg-black/40 overflow-hidden">
        <img
          src={img.url}
          alt={img.producto_nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.target.style.opacity = '0.3';
            e.target.style.filter = 'grayscale(1)';
          }}
        />
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${role.color} backdrop-blur`}>
            {role.label}
          </span>
        </div>
        <div className="absolute top-1.5 right-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${origen.color} backdrop-blur`}>
            {origen.label}
          </span>
        </div>
        {img.sub_origin && (
          <div className="absolute bottom-1.5 left-1.5">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/60 text-white/80 backdrop-blur">
              {SUB_ORIGEN_LABELS[img.sub_origin] || img.sub_origin}
            </span>
          </div>
        )}
        {/* Overlay acciones (hover) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
          {img.role !== 'principal' && (
            <button
              onClick={() => callAction('promote')}
              disabled={busy}
              title="Hacer principal"
              className="w-8 h-8 rounded-full bg-yellow-500 hover:bg-yellow-400 text-black flex items-center justify-center disabled:opacity-50"
            >
              {busy === 'promote' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
            </button>
          )}
          {img.role !== 'promo' && (
            <button
              onClick={() => callAction('setAsPromo')}
              disabled={busy}
              title="Marcar como Promo"
              className="w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center disabled:opacity-50"
            >
              {busy === 'setAsPromo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            onClick={copyUrl}
            title="Copiar URL"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={img.url}
            target="_blank"
            rel="noreferrer"
            title="Abrir"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => callAction('delete', `¿Quitar esta imagen del producto "${img.producto_nombre}"?\n\nNota: el archivo permanece en el CDN.`)}
            disabled={busy}
            title="Quitar"
            className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center disabled:opacity-50"
          >
            {busy === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5 space-y-1">
        <p className="text-xs font-semibold text-white truncate" title={img.producto_nombre}>
          {img.producto_nombre}
        </p>
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-mono text-white/40 truncate">{img.producto_sku}</span>
          {!img.producto_activo && <span className="text-rose-300">inactivo</span>}
        </div>
      </div>
    </div>
  );
}
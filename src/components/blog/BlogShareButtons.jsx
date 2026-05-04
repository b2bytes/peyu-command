import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

/**
 * Botones de compartir.
 *  - variant="light" (default) → para fondos claros (blog editorial)
 *  - variant="dark"             → para fondos oscuros (resto del sitio)
 */
export default function BlogShareButtons({ title, url, variant = 'light' }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const isDark = variant === 'dark';

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url: shareUrl }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`;

  const baseBtn = isDark
    ? 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
    : 'bg-white hover:bg-stone-50 border-stone-200 text-slate-700 hover:text-slate-900';
  const copiedBtn = isDark
    ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
    : 'bg-teal-50 border-teal-300 text-teal-800';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-[13px] font-semibold rounded-full transition-colors ${baseBtn}`}
      >
        <Share2 className="w-3.5 h-3.5" /> Compartir
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-[13px] font-semibold rounded-full transition-colors shadow-sm"
      >
        WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-full border transition-colors ${
          copied ? copiedBtn : baseBtn
        }`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
      </button>
    </div>
  );
}
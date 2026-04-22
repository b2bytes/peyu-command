import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

// Usa Web Share API en móvil, fallback a copiar link en desktop.
export default function BlogShareButtons({ title, url }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch { /* usuario canceló */ }
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold rounded-full transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" /> Compartir
      </button>
      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/90 hover:bg-green-600 text-white text-xs font-semibold rounded-full transition-colors"
      >
        WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
          copied
            ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
            : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
        }`}
      >
        {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
      </button>
    </div>
  );
}
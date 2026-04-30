import { Button } from '@/components/ui/button';
import { Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function SuccessActions({ codigo, monto, destinatario, comprador }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareText = `¡Tienes un regalo de ${comprador || 'PEYU'}! 🎁\n\nGift Card PEYU de $${new Intl.NumberFormat('es-CL').format(monto)} CLP\nCódigo: ${codigo}\n\nCanjéalo en https://peyuchile.cl/canjear?code=${codigo}`;

  const handleShareWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Tu Gift Card PEYU',
          text: shareText,
          url: `https://peyuchile.cl/canjear?code=${codigo}`,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Button
        type="button"
        onClick={handleCopy}
        variant="outline"
        className="h-11 bg-white/8 border-white/20 text-white hover:bg-white/15 rounded-xl gap-2"
      >
        {copied ? <><Check className="w-4 h-4 text-emerald-400" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar código</>}
      </Button>
      <Button
        type="button"
        onClick={handleShareWhatsapp}
        className="h-11 bg-[#25D366] hover:bg-[#1FB855] text-white font-semibold rounded-xl gap-2"
      >
        <MessageCircle className="w-4 h-4" /> Compartir WhatsApp
      </Button>
      <Button
        type="button"
        onClick={handleShareNative}
        variant="outline"
        className="h-11 bg-white/8 border-white/20 text-white hover:bg-white/15 rounded-xl gap-2"
      >
        <Share2 className="w-4 h-4" /> Más opciones
      </Button>
    </div>
  );
}
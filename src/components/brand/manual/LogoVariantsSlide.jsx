// ════════════════════════════════════════════════════════════════════════
// LogoVariantsSlide — "Sistema de Logos · Kit descargable". Genera en vivo
// las variantes oficiales del logo (fondo transparente, fidelidad exacta al
// original) y las ofrece listas para descargar: tinta, crema, verde,
// terracota, isotipo y avatar para el widget de chat.
// ════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Download, Loader2, MessageCircle } from 'lucide-react';
import ManualSlide from '@/components/brand/manual/ManualSlide';
import { buildLogoVariant, downloadDataURL, ISOTIPO_CROP } from '@/lib/logo-variants';

const VARIANTES = [
  { id: 'tinta', nombre: 'Logo principal · Tinta', uso: 'Fondos claros, impresión, grabado láser', hex: '#2C1810', bg: '#F8F3ED', crop: null },
  { id: 'crema', nombre: 'Logo negativo · Crema', uso: 'Fondos oscuros, hero, modo noche', hex: '#F8F3ED', bg: '#0B4634', crop: null },
  { id: 'verde', nombre: 'Logo · Verde PEYU', uso: 'Papelería, firmas de correo, web', hex: '#0F8B6C', bg: '#F8F3ED', crop: null },
  { id: 'terracota', nombre: 'Logo · Terracota', uso: 'Campañas, destacados, packaging especial', hex: '#D96B4D', bg: '#F8F3ED', crop: null },
  { id: 'iso-tinta', nombre: 'Isotipo · Tinta', uso: 'Favicon, sticker, sello de caparazón', hex: '#2C1810', bg: '#F8F3ED', crop: ISOTIPO_CROP },
  { id: 'iso-crema', nombre: 'Isotipo · Crema', uso: 'Avatar del widget de chat, app móvil', hex: '#F8F3ED', bg: '#0B4634', crop: ISOTIPO_CROP },
];

export default function LogoVariantsSlide({ num }) {
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const v of VARIANTES) {
        try {
          const url = await buildLogoVariant(v.hex, v.crop);
          if (!alive) return;
          setUrls((prev) => ({ ...prev, [v.id]: url }));
        } catch { /* CORS/red: se omite la variante */ }
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <ManualSlide label="Sistema de Logos · Kit Descargable" num={num} id="logos">
      <p className="text-sm sm:text-base mb-6 max-w-3xl" style={{ color: '#EDE7DD' }}>
        Todas las variantes se generan desde el trazo original — <strong className="text-white">PNG con fondo transparente</strong>, listas para descargar y usar. Nunca redibujar el logo: siempre partir de este kit.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {VARIANTES.map((v) => (
          <div key={v.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            {/* Preview sobre fondo de uso + patrón de transparencia */}
            <div
              className="h-28 sm:h-36 flex items-center justify-center p-4 sm:p-6"
              style={{
                background: v.bg,
                backgroundImage: v.bg === '#F8F3ED'
                  ? 'linear-gradient(45deg, rgba(44,24,16,.05) 25%, transparent 25%, transparent 75%, rgba(44,24,16,.05) 75%), linear-gradient(45deg, rgba(44,24,16,.05) 25%, transparent 25%, transparent 75%, rgba(44,24,16,.05) 75%)'
                  : 'none',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 8px 8px',
              }}
            >
              {urls[v.id]
                ? <img src={urls[v.id]} alt={v.nombre} className={`${v.crop ? 'h-full' : 'w-full'} max-h-full max-w-full object-contain`} draggable={false} />
                : <Loader2 className="w-5 h-5 animate-spin" style={{ color: v.bg === '#F8F3ED' ? '#7A6050' : '#A7D9C9' }} />}
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              <p className="font-bold text-xs sm:text-sm text-white leading-tight">{v.nombre}</p>
              <p className="text-[10px] sm:text-[11px] mt-1 flex-1" style={{ color: '#A7D9C9' }}>{v.uso}</p>
              <button
                onClick={() => urls[v.id] && downloadDataURL(urls[v.id], `peyu-logo-${v.id}.png`)}
                disabled={!urls[v.id]}
                className="mt-3 w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
              >
                <Download className="w-3.5 h-3.5" /> Descargar PNG
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Demo aplicado: widget de chat con fondo transparente */}
      <div className="mt-6 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 sm:gap-6" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute -top-9 right-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold shadow-lg" style={{ background: '#F8F3ED', color: '#2C1810' }}>
              <span style={{ color: '#0F8B6C' }}>Peyu</span> te ayuda 🐢
            </span>
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(145deg,#0F8B6C,#0B4634)', border: '2px solid rgba(255,255,255,.25)' }}>
              {urls['iso-crema']
                ? <img src={urls['iso-crema']} alt="Peyu chat" className="w-9 h-9 object-contain" draggable={false} />
                : <MessageCircle className="w-6 h-6 text-white" />}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-white">Widget de chat · fondo transparente</p>
          <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: '#EDE7DD' }}>
            El isotipo crema (PNG transparente) flota sobre el círculo verde del widget — como Zuri en su web. Descarga «Isotipo · Crema» y úsalo directamente en la burbuja de chat.
          </p>
        </div>
      </div>
    </ManualSlide>
  );
}
// ════════════════════════════════════════════════════════════════════════
// LogoVariantsSlide — "Sistema de Logos · Kit descargable". Genera en vivo
// las variantes oficiales del logo (fondo transparente, fidelidad exacta al
// original): tinta, crema, verde, terracota, isotipo (recorte automático,
// cabeza incluida), logo VERTICAL (tortuga + nombre abajo), favicon y
// imagen para redes sociales — todo listo para descargar.
// ════════════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Download, Loader2, MessageCircle } from 'lucide-react';
import ManualSlide from '@/components/brand/manual/ManualSlide';
import { buildLogoVariant, buildFavicon, buildSocialImage, downloadDataURL } from '@/lib/logo-variants';

const VARIANTES = [
  { id: 'tinta', nombre: 'Logo principal · Tinta', uso: 'Fondos claros, impresión, grabado láser', hex: '#2C1810', bg: '#F8F3ED', modo: 'full' },
  { id: 'crema', nombre: 'Logo negativo · Crema', uso: 'Fondos oscuros, hero, modo noche', hex: '#F8F3ED', bg: '#0B4634', modo: 'full' },
  { id: 'verde', nombre: 'Logo · Verde PEYU', uso: 'Papelería, firmas de correo, web', hex: '#0F8B6C', bg: '#F8F3ED', modo: 'full' },
  { id: 'terracota', nombre: 'Logo · Terracota', uso: 'Campañas, destacados, packaging especial', hex: '#D96B4D', bg: '#F8F3ED', modo: 'full' },
  { id: 'vert-tinta', nombre: 'Logo vertical · Tinta', uso: 'Etiquetas, sellos, formatos cuadrados', hex: '#2C1810', bg: '#F8F3ED', modo: 'vertical' },
  { id: 'vert-crema', nombre: 'Logo vertical · Crema', uso: 'Packaging oscuro, stories, portadas', hex: '#F8F3ED', bg: '#0B4634', modo: 'vertical' },
  { id: 'iso-tinta', nombre: 'Isotipo · Tinta', uso: 'Sticker, sello de caparazón, patterns', hex: '#2C1810', bg: '#F8F3ED', modo: 'isotipo' },
  { id: 'iso-crema', nombre: 'Isotipo · Crema', uso: 'Avatar del widget de chat, app móvil', hex: '#F8F3ED', bg: '#0B4634', modo: 'isotipo' },
];

const btnStyle = { background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' };

function DownloadBtn({ url, filename }) {
  return (
    <button
      onClick={() => url && downloadDataURL(url, filename)}
      disabled={!url}
      className="mt-3 w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
      style={btnStyle}
    >
      <Download className="w-3.5 h-3.5" /> Descargar PNG
    </button>
  );
}

export default function LogoVariantsSlide({ num }) {
  const [urls, setUrls] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const v of VARIANTES) {
        try {
          const url = await buildLogoVariant(v.hex, v.modo);
          if (!alive) return;
          setUrls((prev) => ({ ...prev, [v.id]: url }));
        } catch { /* CORS/red: se omite la variante */ }
      }
      try {
        const fav = await buildFavicon();
        if (!alive) return;
        setUrls((prev) => ({ ...prev, favicon: fav }));
        const social = await buildSocialImage();
        if (!alive) return;
        setUrls((prev) => ({ ...prev, social }));
      } catch { /* se omiten */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <ManualSlide label="Sistema de Logos · Kit Descargable" num={num} id="logos">
      <p className="text-sm sm:text-base mb-6 max-w-3xl" style={{ color: '#EDE7DD' }}>
        Todas las variantes se generan desde el trazo original — <strong className="text-white">PNG con fondo transparente</strong>, listas para descargar y usar. Nunca redibujar el logo: siempre partir de este kit.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {VARIANTES.map((v) => (
          <div key={v.id} className="rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            {/* Preview sobre fondo de uso + patrón de transparencia */}
            <div
              className="h-28 sm:h-36 flex items-center justify-center p-4 sm:p-5"
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
                ? <img src={urls[v.id]} alt={v.nombre} className="max-h-full max-w-full object-contain" draggable={false} />
                : <Loader2 className="w-5 h-5 animate-spin" style={{ color: v.bg === '#F8F3ED' ? '#7A6050' : '#A7D9C9' }} />}
            </div>
            <div className="p-3 sm:p-4 flex-1 flex flex-col">
              <p className="font-bold text-xs sm:text-sm text-white leading-tight">{v.nombre}</p>
              <p className="text-[10px] sm:text-[11px] mt-1 flex-1" style={{ color: '#A7D9C9' }}>{v.uso}</p>
              <DownloadBtn url={urls[v.id]} filename={`peyu-logo-${v.id}.png`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Assets digitales: favicon + imagen redes sociales ── */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Favicon */}
        <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {urls.favicon
              ? <img src={urls.favicon} alt="Favicon PEYU" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg" draggable={false} />
              : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#A7D9C9' }} /></div>}
            {urls.favicon && <img src={urls.favicon} alt="" className="w-6 h-6 rounded-md" draggable={false} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white">Favicon · App icon</p>
            <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: '#EDE7DD' }}>
              512×512 px — tortuga crema sobre verde PEYU. Sirve para favicon del sitio, ícono PWA y app móvil.
            </p>
            <button
              onClick={() => urls.favicon && downloadDataURL(urls.favicon, 'peyu-favicon-512.png')}
              disabled={!urls.favicon}
              className="mt-2.5 h-9 px-4 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
              style={btnStyle}
            >
              <Download className="w-3.5 h-3.5" /> Descargar PNG
            </button>
          </div>
        </div>

        {/* Imagen redes sociales */}
        <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
          <div className="flex-shrink-0 w-32 sm:w-40">
            {urls.social
              ? <img src={urls.social} alt="Imagen redes sociales PEYU" className="w-full rounded-xl shadow-lg" draggable={false} />
              : <div className="w-full aspect-[1200/630] rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)' }}><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#A7D9C9' }} /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white">Redes sociales · OG image</p>
            <p className="text-[11px] sm:text-xs mt-0.5" style={{ color: '#EDE7DD' }}>
              1200×630 px — logo vertical + tagline. Para compartir links (WhatsApp, LinkedIn, Instagram, Facebook).
            </p>
            <button
              onClick={() => urls.social && downloadDataURL(urls.social, 'peyu-social-og-1200x630.png')}
              disabled={!urls.social}
              className="mt-2.5 h-9 px-4 rounded-xl inline-flex items-center gap-1.5 text-[11px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
              style={btnStyle}
            >
              <Download className="w-3.5 h-3.5" /> Descargar PNG
            </button>
          </div>
        </div>
      </div>

      {/* Demo aplicado: widget de chat con fondo transparente */}
      <div className="mt-4 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4 sm:gap-6" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
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
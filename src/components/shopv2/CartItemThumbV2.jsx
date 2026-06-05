import { useState, useEffect } from 'react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';

// ════════════════════════════════════════════════════════════════════════
// CartItemThumbV2 — Miniatura del carrito que RECONSTRUYE el grabado del
// cliente: compone la foto base del color + las capas (frase/diseño PEYU/logo)
// con su posición y tamaño guardados, igual que el preview en vivo. Así el
// cliente ve EXACTAMENTE su diseño durante todo el viaje (no pierde nada).
//
// Props:
//   imagen   : foto base del producto (color elegido)
//   capas    : item.capas_grabado → [{ tipo, url?, texto?, size, x, y }]
//   alt      : nombre del producto
// ════════════════════════════════════════════════════════════════════════
export default function CartItemThumbV2({ imagen, capas = [], alt }) {
  const [tint, setTint] = useState('light');
  const [engraved, setEngraved] = useState({}); // url -> { dataUrl, ok, svg }

  // Tono del producto → color del grabado (claro sobre oscuro / oscuro sobre claro).
  useEffect(() => {
    let cancelled = false;
    if (!imagen) return;
    detectImageTone(imagen).then((t) => { if (!cancelled) setTint(t); });
    return () => { cancelled = true; };
  }, [imagen]);

  // Procesa los gráficos (logo / diseño PEYU) a grabado monocromo transparente.
  useEffect(() => {
    let cancelled = false;
    const urls = Array.from(new Set(capas.filter((c) => c.url).map((c) => c.url)));
    if (!urls.length) return;
    Promise.all(urls.map((u) => engraveLogo(u, tint).then(
      ({ dataUrl, processed, isSvg }) => ({ u, dataUrl, ok: processed !== false, svg: !!isSvg }),
      () => ({ u, dataUrl: u, ok: false, svg: false }),
    ))).then((res) => {
      if (cancelled) return;
      setEngraved((prev) => {
        const next = { ...prev };
        res.forEach(({ u, dataUrl, ok, svg }) => { next[u] = { dataUrl, ok, svg }; });
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [capas, tint]);

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#EBE3D6] bg-[#FAF7F2]">
      {imagen && (
        <img src={imagen} alt={alt} referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Viñeteado sutil: profundidad de superficie para asentar el grabado. */}
      {capas.length > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(115% 90% at 50% 42%, transparent 55%, rgba(0,0,0,0.10) 100%)',
          mixBlendMode: 'multiply',
        }} />
      )}

      {capas.map((c, i) => {
        const x = typeof c.x === 'number' ? c.x : 50;
        const y = typeof c.y === 'number' ? c.y : 50;
        const size = typeof c.size === 'number' ? c.size : 26;

        // Frase grabada.
        if (c.tipo === 'frase') {
          if (!c.texto?.trim()) return null;
          return (
            <span key={i} className="absolute" style={{
              left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
              fontSize: `${size * 0.34}px`, fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600,
              color: tint === 'light' ? 'rgba(236,236,236,0.9)' : 'rgba(34,34,34,0.9)',
              letterSpacing: '0.1em', whiteSpace: 'nowrap', maxWidth: '70%',
              overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: tint === 'light'
                ? '0 0.5px 0.5px rgba(0,0,0,0.5), 0 -0.5px 0.5px rgba(255,255,255,0.2)'
                : '0 0.5px 0.5px rgba(255,255,255,0.45), 0 -0.5px 0.5px rgba(0,0,0,0.25)',
              mixBlendMode: tint === 'light' ? 'soft-light' : 'multiply',
            }}>{c.texto.toUpperCase()}</span>
          );
        }

        // Gráfico (logo / diseño PEYU).
        const eng = c.url ? engraved[c.url] : null;
        if (!eng) return null;

        // Surco del láser: sombra abajo + reflejo arriba → relieve real, sutil.
        const engraveFx = tint === 'light'
          ? 'drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.5)) drop-shadow(0 -0.5px 0.5px rgba(255,255,255,0.22))'
          : 'drop-shadow(0 0.5px 0.5px rgba(255,255,255,0.45)) drop-shadow(0 -0.5px 0.5px rgba(0,0,0,0.3))';

        if (eng.svg) {
          const ink = tint === 'light' ? 'rgba(236,236,236,0.9)' : 'rgba(38,38,38,0.88)';
          return (
            <div key={i} className="absolute" style={{
              left: `${x}%`, top: `${y}%`, width: `${size}%`, aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%)', backgroundColor: ink,
              WebkitMaskImage: `url("${eng.dataUrl}")`, maskImage: `url("${eng.dataUrl}")`,
              WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center', maskPosition: 'center',
              WebkitMaskSize: 'contain', maskSize: 'contain',
              filter: engraveFx, mixBlendMode: tint === 'light' ? 'soft-light' : 'multiply', opacity: 0.92,
            }} />
          );
        }

        const blend = !eng.ok ? 'normal' : (tint === 'light' ? 'soft-light' : 'multiply');
        const fx = !eng.ok ? 'contrast(1.05)' : (tint === 'light' ? `brightness(1.35) contrast(1.08) ${engraveFx}` : `contrast(1.12) ${engraveFx}`);
        return (
          <img key={i} src={eng.dataUrl} alt="" draggable={false} className="absolute" style={{
            left: `${x}%`, top: `${y}%`, width: `${size}%`, transform: 'translate(-50%, -50%)',
            mixBlendMode: blend, opacity: 0.92, filter: fx,
          }} />
        );
      })}
    </div>
  );
}
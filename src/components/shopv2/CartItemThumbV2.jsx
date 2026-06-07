import { useState, useEffect } from 'react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';
import EngravedLayer from '@/components/shopv2/EngravedLayer';

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
export default function CartItemThumbV2({ imagen, capas = [], alt, fallback }) {
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
        <img
          src={imagen}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Reintenta una vez con cache-buster; si falla y hay fallback, úsalo.
            const el = e.currentTarget;
            if (!el.dataset.retried) {
              el.dataset.retried = '1';
              el.src = imagen + (imagen.includes('?') ? '&' : '?') + 'r=1';
            } else if (fallback && el.src !== fallback) {
              el.src = fallback;
            }
          }}
        />
      )}

      {/* Iluminación de estudio: highlight especular + viñeteado → volumen real. */}
      {capas.length > 0 && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(70% 55% at 32% 28%, rgba(255,255,255,0.14) 0%, transparent 60%)',
            mixBlendMode: 'screen',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(120% 95% at 50% 44%, transparent 52%, rgba(0,0,0,0.13) 100%)',
            mixBlendMode: 'multiply',
          }} />
        </>
      )}

      {capas.map((c, i) => {
        const x = typeof c.x === 'number' ? c.x : 50;
        const y = typeof c.y === 'number' ? c.y : 50;
        const size = typeof c.size === 'number' ? c.size : 26;

        let eng = null;
        if (c.tipo !== 'frase') {
          eng = c.url ? engraved[c.url] : null;
          if (!eng) return null;
        }

        return (
          <div key={i} className="absolute" style={{
            left: `${x}%`, top: `${y}%`,
            width: c.tipo === 'frase' ? undefined : `${size}%`,
            transform: 'translate(-50%, -50%)',
          }}>
            {/* Mismo motor de montaje de alta calidad que el preview en vivo. */}
            <EngravedLayer
              eng={eng}
              tipo={c.tipo}
              texto={c.texto}
              sizePct={size * 0.8}
              tint={tint}
              productImg={imagen}
            />
          </div>
        );
      })}
    </div>
  );
}
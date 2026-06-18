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
export default function CartItemThumbV2({ imagen, capas = [], alt, fallback, snapshotUrl }) {
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

  // ── CAMINO FIEL: si la ficha capturó un snapshot real del mockup aprobado
  // (html2canvas), lo mostramos TAL CUAL como imagen plana. Es el diseño exacto
  // que el cliente vio y aprobó — nada se recompone, nada se desarma. ───────
  if (snapshotUrl) {
    return (
      <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#D8CFC0] bg-[#FAF7F2]">
        <img
          src={snapshotUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain"
          onError={(e) => {
            // Si el snapshot no carga, cae a la foto base del producto.
            if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-[#D8CFC0] bg-[#FAF7F2]">
      {/* Fondo con patrón sutil para profundidad */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #000 0.5px, transparent 0.5px)',
        backgroundSize: '40px 40px',
      }} />

      {imagen && (
        <img
          src={imagen}
          alt={alt}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-contain bg-white/40"
          onError={(e) => {
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

      {/* Efectos de iluminación profesional */}
      {capas.length > 0 && (
        <>
          {/* Luz especular de estudio (alto izquierda) */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(60% 50% at 30% 25%, rgba(255,255,255,0.18) 0%, transparent 55%)',
            mixBlendMode: 'screen',
          }} />
          {/* Sombra suave (viñeta abajo) */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(110% 100% at 50% 50%, transparent 45%, rgba(0,0,0,0.08) 100%)',
            mixBlendMode: 'multiply',
          }} />
          {/* Brillo periférico sutil */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.02) 100%)',
          }} />
        </>
      )}

      {/* Capas de grabado (logo, diseño, frase) */}
      {capas.map((c, i) => {
        const x = typeof c.x === 'number' ? c.x : 50;
        const y = typeof c.y === 'number' ? c.y : 50;
        const size = typeof c.size === 'number' ? c.size : 32;

        let eng = null;
        if (c.tipo !== 'frase') {
          eng = c.url ? engraved[c.url] : null;
          if (!eng) return null;
        }

        return (
          <div key={i} className="absolute" style={{
            left: `${x}%`,
            top: `${y}%`,
            width: c.tipo === 'frase' ? 'auto' : `${size}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: i + 1,
          }}>
            <EngravedLayer
              eng={eng}
              tipo={c.tipo}
              texto={c.texto}
              sizePct={size * 0.85}
              tint={tint}
              productImg={imagen}
            />
          </div>
        );
      })}

      {/* Indicador sutil si no tiene grabado */}
      {capas.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="text-center text-[#4B4F54] text-xs font-semibold">
            {alt || 'Producto'}
          </div>
        </div>
      )}
    </div>
  );
}
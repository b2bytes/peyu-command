import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2, Type, Palette, Upload, Wand2 } from 'lucide-react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';
import EngravedLayer from '@/components/shopv2/EngravedLayer';

// ════════════════════════════════════════════════════════════════════════
// MockupLivePreviewV2 — Preview de grabado láser EN VIVO, piel Tema 6 (cream).
// Compone la foto real de la carcasa + MÚLTIPLES capas combinables: frase,
// diseño PEYU y/o logo propio. INTELIGENTE: todas las capas viven DENTRO del
// área técnica de grabado (recuadro láser) y se auto-acomodan apiladas para
// no solaparse. El usuario puede arrastrar/ajustar cada capa dentro del área.
//
// Props:
//   productImageUrl : foto base (color elegido)
//   capas: [{ id, tipo:'frase'|'peyu'|'archivo', texto?, url? }]
//   onPlacementChange: (placements: { [id]: {size,x,y} }) => void
// ════════════════════════════════════════════════════════════════════════

const ICONO = { frase: Type, peyu: Palette, archivo: Upload };
const NOMBRE = { frase: 'Frase', peyu: 'Diseño PEYU', archivo: 'Tu diseño' };

// ── ÁREA TÉCNICA DE GRABADO (en % del lienzo cuadrado) ───────────────────
// Zona centrada y contenida donde se compone el grabado. Pensada para servir
// a CUALQUIER producto (carcasas, set de escritorio, bolsos, etc.): el diseño
// siempre queda centrado y dentro del cuadro, nunca descolocado sobre el resto
// de la foto. Todas las capas se restringen aquí dentro.
// Área vertical AMPLIA: el grabado puede ubicarse desde bastante arriba hasta
// muy abajo de la carcasa (el cliente pedía poder bajar más la frase). El
// ancho se mantiene contenido para que el diseño no se salga por los costados.
const AREA = { left: 26, right: 74, top: 18, bottom: 86 };
const AREA_W = AREA.right - AREA.left; // 48
const AREA_H = AREA.bottom - AREA.top; // 68
const AREA_CX = (AREA.left + AREA.right) / 2; // 50
const AREA_CY = (AREA.top + AREA.bottom) / 2;  // 51

// Tamaño base por tipo de capa (en % del lienzo).
const SIZE_BASE = { frase: 30, peyu: 26, archivo: 26 };

// Auto-layout: distribuye N capas en filas dentro del área técnica, centradas
// verticalmente y sin solaparse. Devuelve { [id]: {size,x,y} }.
function autoLayout(capas) {
  const n = capas.length;
  if (n === 0) return {};
  // Altura por slot dentro del área (deja un pequeño margen arriba/abajo).
  const usableTop = AREA.top + 4;
  const usableBottom = AREA.bottom - 4;
  const slotH = (usableBottom - usableTop) / n;
  const out = {};
  capas.forEach((c, i) => {
    const baseSize = SIZE_BASE[c.tipo] || 26;
    // Si hay varias capas, reduce el tamaño para que quepan apiladas.
    const size = n === 1 ? baseSize : Math.max(14, Math.min(baseSize, slotH * 0.95));
    const y = usableTop + slotH * (i + 0.5);
    out[c.id] = { size, x: AREA_CX, y };
  });
  return out;
}

// Restringe el centro de una capa para que su caja quede dentro del área.
function clampToArea(x, y, sizePct, tipo) {
  // Frase es ancha pero baja; gráficos son ~cuadrados. Aproximamos media-caja.
  const halfW = tipo === 'frase' ? Math.min(sizePct * 0.9, AREA_W / 2) : sizePct / 2;
  // Media-altura de la frase pequeña → permite acercarla mucho a los bordes
  // superior e inferior del área (poder "bajar" la frase como pidió el cliente).
  const halfH = tipo === 'frase' ? sizePct * 0.18 : sizePct / 2;
  const minX = AREA.left + halfW;
  const maxX = AREA.right - halfW;
  const minY = AREA.top + halfH;
  const maxY = AREA.bottom - halfH;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export default function MockupLivePreviewV2({ productImageUrl, capas = [], onPlacementChange, fallbackUrl }) {
  const containerRef = useRef(null);
  // Imagen base efectiva: si la principal falla (CORS/rota), cae al fallback
  // (imagen_url del producto) → la carcasa NUNCA queda en blanco/gris vacío.
  const [imgSrc, setImgSrc] = useState(productImageUrl || fallbackUrl || null);
  const [placements, setPlacements] = useState({}); // id -> {size,x,y}
  const [engraved, setEngraved] = useState({});       // "url::tint" -> {dataUrl, ok}
  const [processing, setProcessing] = useState(false);
  const [activeId, setActiveId] = useState(null);     // capa que se arrastra
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState({});         // id -> el usuario lo movió a mano
  const [tint, setTint] = useState('light');          // tono del grabado (contrario al producto)
  const lastEngRef = useRef({});                       // id -> último {dataUrl,ok} válido (anti-parpadeo)

  const capasKey = capas.map((c) => c.id).join('|');

  // Mantiene la imagen base sincronizada con la prop (al cambiar color/modelo).
  useEffect(() => {
    setImgSrc(productImageUrl || fallbackUrl || null);
  }, [productImageUrl, fallbackUrl]);

  // Detecta el tono del producto → define la tinta del grabado:
  //   producto OSCURO  → grabado CLARO (light), intenso.
  //   producto CLARO   → grabado OSCURO (dark), intenso.
  useEffect(() => {
    let cancelled = false;
    if (!imgSrc) return;
    detectImageTone(imgSrc).then((t) => { if (!cancelled) setTint(t); });
    return () => { cancelled = true; };
  }, [imgSrc]);

  // Inicializa/auto-acomoda las capas. Las que el usuario NO ha tocado se
  // recalculan con autoLayout (para que al combinar no se apilen). Las tocadas
  // a mano conservan su posición.
  useEffect(() => {
    setPlacements((prev) => {
      const auto = autoLayout(capas);
      const next = {};
      capas.forEach((c) => {
        next[c.id] = touched[c.id] && prev[c.id] ? prev[c.id] : auto[c.id];
      });
      return next;
    });
    // limpia "touched" de capas que ya no existen
    setTouched((prev) => {
      const ids = new Set(capas.map((c) => c.id));
      const next = {};
      Object.keys(prev).forEach((k) => { if (ids.has(k)) next[k] = prev[k]; });
      return next;
    });
  }, [capasKey]); // eslint-disable-line

  // Reporta placements al padre.
  useEffect(() => { onPlacementChange?.(placements); }, [placements]); // eslint-disable-line

  // Procesa los logos/diseños (URLs) a grabado monocromo transparente, según el
  // tono del producto. Cachea por "url::tint" → cambiar entre diseños ya
  // procesados es INSTANTÁNEO (no reprocesa, no parpadea). Mantiene el render
  // anterior visible mientras procesa el nuevo (clave anti-"mareo").
  useEffect(() => {
    let cancelled = false;
    const pending = capas
      .filter((c) => c.url && !engraved[`${c.url}::${tint}`])
      .map((c) => c.url);
    const urls = Array.from(new Set(pending));
    if (!urls.length) return;
    setProcessing(true);
    Promise.all(urls.map((u) => engraveLogo(u, tint).then(
      ({ dataUrl, processed }) => ({ u, dataUrl, ok: processed !== false }),
      () => ({ u, dataUrl: u, ok: false }),
    ))).then((results) => {
      if (cancelled) return;
      setEngraved((prev) => {
        const next = { ...prev };
        results.forEach(({ u, dataUrl, ok }) => { next[`${u}::${tint}`] = { dataUrl, ok }; });
        return next;
      });
    }).finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; };
  }, [capasKey, capas.map((c) => c.url || '').join('|'), tint]); // eslint-disable-line

  const moveTo = useCallback((clientX, clientY) => {
    if (!containerRef.current || !activeId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;
    setPlacements((prev) => {
      const cur = prev[activeId];
      if (!cur) return prev;
      const capa = capas.find((c) => c.id === activeId);
      const { x, y } = clampToArea(rawX, rawY, cur.size, capa?.tipo);
      return { ...prev, [activeId]: { ...cur, x, y } };
    });
    setTouched((prev) => ({ ...prev, [activeId]: true }));
  }, [activeId, capas]);

  const endDrag = () => { setDragging(false); };

  const setSize = (id, size) => {
    setPlacements((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const capa = capas.find((c) => c.id === id);
      const { x, y } = clampToArea(cur.x, cur.y, size, capa?.tipo);
      return { ...prev, [id]: { ...cur, size, x, y } };
    });
    setTouched((prev) => ({ ...prev, [id]: true }));
  };

  // Re-acomoda TODO automáticamente (botón mágico) — limpia los "touched".
  const autoAcomodar = () => {
    setPlacements(autoLayout(capas));
    setTouched({});
  };

  const hasContent = capas.length > 0;
  const multiCapas = capas.length > 1;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-[#FAF7F2] border border-[#EBE3D6] select-none touch-none"
        onMouseMove={(e) => dragging && moveTo(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchMove={(e) => dragging && e.touches[0] && moveTo(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Producto"
            referrerPolicy="no-referrer"
            draggable={false}
            className="w-full h-full object-cover"
            onError={() => {
              // Si la imagen principal falla y existe un fallback distinto, úsalo.
              if (fallbackUrl && imgSrc !== fallbackUrl) setImgSrc(fallbackUrl);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F0EAE0] to-[#E7D8C6]" />
        )}

        {/* Marco del área técnica de grabado — guía sutil del láser (solo visible
            al arrastrar). Sin relleno: nunca crea un "cuadrado" sobre el producto. */}
        {dragging && (
          <div
            className="absolute pointer-events-none rounded-md border border-dashed border-[#0F8B6C]/40"
            style={{
              left: `${AREA.left}%`, top: `${AREA.top}%`,
              width: `${AREA_W}%`, height: `${AREA_H}%`,
            }}
          >
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-bold tracking-wider text-[#0F8B6C]/70 uppercase whitespace-nowrap">
              Área de grabado
            </span>
          </div>
        )}

        {/* Iluminación de estudio: highlight especular arriba-izq + viñeteado de
            sombra → da volumen real a la superficie para que el grabado se asiente
            con profundidad (no flote plano). Solo si hay capas. */}
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

        {capas.map((c) => {
          const pl = placements[c.id];
          if (!pl) return null;
          const isActive = activeId === c.id;
          const startDrag = (e) => { e.stopPropagation(); setActiveId(c.id); setDragging(true); };

          // Grabado (logo/diseño): resuelve el resultado del engraver con
          // anti-parpadeo (mantiene el último válido mientras procesa el nuevo).
          let eng = null;
          if (c.tipo !== 'frase') {
            const fresh = c.url ? engraved[`${c.url}::${tint}`] : null;
            if (fresh) lastEngRef.current[c.id] = fresh;
            eng = fresh || lastEngRef.current[c.id];
            if (!eng) return null;
          }

          // El ancho del wrapper define la escala; la frase no necesita width fijo.
          const wrapperW = c.tipo === 'frase' ? undefined : `${pl.size}%`;

          return (
            <div key={c.id} className="absolute cursor-move"
              style={{ left: `${pl.x}%`, top: `${pl.y}%`, width: wrapperW, transform: 'translate(-50%, -50%)', zIndex: isActive ? 20 : 10 }}
              onMouseDown={startDrag} onTouchStart={startDrag}>
              {isActive && <span className="absolute -inset-1.5 rounded-lg border border-dashed border-[#0F8B6C]/70 pointer-events-none" />}
              {/* Motor de montaje de alta calidad: alinea el grabado con la
                  textura real del material (tinta + textura + bisel del láser). */}
              <EngravedLayer
                eng={eng}
                tipo={c.tipo}
                texto={c.texto}
                sizePct={pl.size}
                tint={tint}
                productImg={imgSrc}
              />
            </div>
          );
        })}

        <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur text-[10px] font-bold px-2.5 py-1 rounded-full text-[#0F8B6C] shadow-sm">
          <Sparkles className="w-3 h-3" /> Vista previa
        </span>

        {processing && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
            <Loader2 className="w-3 h-3 text-[#0F8B6C] animate-spin" />
            <span className="text-[9px] text-[#4B4F54] font-semibold">procesando…</span>
          </div>
        )}
        <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[9px] text-[#A78B6F] font-semibold shadow-sm">
          PEYU · referencial
        </span>
      </div>

      {/* Controles por capa: selecciona, ajusta tamaño y centra cada una */}
      {hasContent && (
        <div className="space-y-2">
          {multiCapas && (
            <button
              type="button"
              onClick={autoAcomodar}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F8B6C]/8 border border-[#0F8B6C]/25 text-[#0F8B6C] hover:bg-[#0F8B6C]/12 text-[11px] font-bold transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" /> Acomodar automáticamente
            </button>
          )}
          {capas.map((c) => {
            const pl = placements[c.id];
            if (!pl) return null;
            const Icon = ICONO[c.tipo] || Palette;
            const isActive = activeId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl border px-2.5 sm:px-3 py-2 cursor-pointer transition-all ${
                  isActive ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-[#EBE3D6] bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`} />
                <span className="text-[11px] font-bold text-[#2A2420] w-14 sm:w-20 flex-shrink-0 truncate">{NOMBRE[c.tipo]}</span>
                <input
                  type="range" min="12" max={c.tipo === 'frase' ? 40 : 34} value={pl.size}
                  onChange={(e) => { setActiveId(c.id); setSize(c.id, Number(e.target.value)); }}
                  className="flex-1 min-w-0 accent-[#0F8B6C]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
          <p className="text-[10px] text-[#A78B6F] leading-relaxed flex items-start gap-1">
            <Move className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Arrastra cada capa dentro del <strong>área de grabado</strong>. El grabado láser UV real respeta exactamente esta zona.
          </p>
        </div>
      )}
    </div>
  );
}
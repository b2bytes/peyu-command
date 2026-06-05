import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2, Type, Palette, Upload, Wand2 } from 'lucide-react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';

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
const NOMBRE = { frase: 'Frase', peyu: 'Diseño PEYU', archivo: 'Tu logo' };

// ── ÁREA TÉCNICA DE GRABADO (en % del lienzo cuadrado) ───────────────────
// Es la zona oscura central de la carcasa donde el láser UV puede grabar.
// Todas las capas se restringen aquí dentro. Ajustada a la foto referencial.
const AREA = { left: 30, right: 70, top: 34, bottom: 68 };
const AREA_W = AREA.right - AREA.left; // 40
const AREA_H = AREA.bottom - AREA.top; // 34
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
  const halfH = tipo === 'frase' ? sizePct * 0.28 : sizePct / 2;
  const minX = AREA.left + halfW;
  const maxX = AREA.right - halfW;
  const minY = AREA.top + halfH;
  const maxY = AREA.bottom - halfH;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export default function MockupLivePreviewV2({ productImageUrl, capas = [], onPlacementChange }) {
  const containerRef = useRef(null);
  const [placements, setPlacements] = useState({}); // id -> {size,x,y}
  const [engraved, setEngraved] = useState({});       // "url::tint" -> {dataUrl, ok}
  const [processing, setProcessing] = useState(false);
  const [activeId, setActiveId] = useState(null);     // capa que se arrastra
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState({});         // id -> el usuario lo movió a mano
  const [tint, setTint] = useState('light');          // tono del grabado (contrario al producto)
  const lastEngRef = useRef({});                       // id -> último {dataUrl,ok} válido (anti-parpadeo)

  const capasKey = capas.map((c) => c.id).join('|');

  // Detecta el tono del producto → define la tinta del grabado:
  //   producto OSCURO  → grabado CLARO (light), intenso.
  //   producto CLARO   → grabado OSCURO (dark), intenso.
  useEffect(() => {
    let cancelled = false;
    if (!productImageUrl) return;
    detectImageTone(productImageUrl).then((t) => { if (!cancelled) setTint(t); });
    return () => { cancelled = true; };
  }, [productImageUrl]);

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
        {productImageUrl ? (
          <img src={productImageUrl} alt="Producto" referrerPolicy="no-referrer" draggable={false} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F0EAE0] to-[#E7D8C6]" />
        )}

        {/* Marco del área técnica de grabado — guía visual del láser */}
        <div
          className="absolute pointer-events-none rounded-md border border-dashed border-white/25"
          style={{
            left: `${AREA.left}%`, top: `${AREA.top}%`,
            width: `${AREA_W}%`, height: `${AREA_H}%`,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-wider text-white/45 uppercase whitespace-nowrap">
            Área de grabado
          </span>
        </div>

        {capas.map((c) => {
          const pl = placements[c.id];
          if (!pl) return null;
          const isActive = activeId === c.id;
          const startDrag = (e) => { e.stopPropagation(); setActiveId(c.id); setDragging(true); };

          // Capa de frase (texto grabado).
          if (c.tipo === 'frase') {
            if (!c.texto?.trim()) return null;
            return (
              <div key={c.id} className="absolute cursor-move" style={{ left: `${pl.x}%`, top: `${pl.y}%`, transform: 'translate(-50%, -50%)', zIndex: isActive ? 20 : 10 }}
                onMouseDown={startDrag} onTouchStart={startDrag}>
                {isActive && <span className="absolute -inset-2 rounded-lg border border-dashed border-[#0F8B6C]/70 pointer-events-none" />}
                <span style={{
                  fontSize: `${pl.size * 0.42}px`, fontFamily: 'monospace', fontWeight: 'bold',
                  color: tint === 'light' ? 'rgba(245,245,245,0.95)' : 'rgba(18,18,18,0.92)',
                  letterSpacing: '0.14em', whiteSpace: 'nowrap',
                  textShadow: tint === 'light'
                    ? '0 1px 0 rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.15)'
                    : '0 1px 0 rgba(255,255,255,0.5), 0 -1px 0 rgba(0,0,0,0.2)',
                  mixBlendMode: tint === 'light' ? 'screen' : 'multiply',
                }}>{c.texto.toUpperCase()}</span>
              </div>
            );
          }

          // Capa gráfica (diseño PEYU / logo) — grabado láser inteligente según el
          // tono del producto. Blend distinto si la tinta es clara u oscura.
          // Anti-parpadeo: si el nuevo aún procesa, mantenemos el último válido.
          const fresh = c.url ? engraved[`${c.url}::${tint}`] : null;
          if (fresh) lastEngRef.current[c.id] = fresh;
          const eng = fresh || lastEngRef.current[c.id];
          if (!eng) return null;
          // light = grabado claro sobre producto oscuro → 'screen' (intenso, luminoso).
          // dark  = grabado oscuro sobre producto claro → 'multiply' (intenso, sólido).
          const blend = tint === 'light' ? 'screen' : 'multiply';
          const fx = tint === 'light'
            ? 'brightness(1.7) contrast(1.05) drop-shadow(0 1px 0 rgba(0,0,0,0.45))'
            : 'contrast(1.15) drop-shadow(0 1px 1px rgba(255,255,255,0.35))';
          return (
            <div key={c.id} className="absolute cursor-move"
              style={{
                left: `${pl.x}%`, top: `${pl.y}%`, width: `${pl.size}%`, transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 20 : 10,
                mixBlendMode: blend,
                opacity: 0.9,
                filter: fx,
              }}
              onMouseDown={startDrag} onTouchStart={startDrag}>
              {isActive && <span className="absolute -inset-1.5 rounded-lg border border-dashed border-[#0F8B6C]/70 pointer-events-none" style={{ mixBlendMode: 'normal' }} />}
              <img src={eng.dataUrl} alt="Tu diseño" draggable={false} className="w-full h-auto pointer-events-none" />
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
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all ${
                  isActive ? 'border-[#0F8B6C] bg-[#0F8B6C]/5' : 'border-[#EBE3D6] bg-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#0F8B6C]' : 'text-[#A78B6F]'}`} />
                <span className="text-[11px] font-bold text-[#2A2420] w-20 flex-shrink-0 truncate">{NOMBRE[c.tipo]}</span>
                <input
                  type="range" min="12" max={c.tipo === 'frase' ? 40 : 34} value={pl.size}
                  onChange={(e) => { setActiveId(c.id); setSize(c.id, Number(e.target.value)); }}
                  className="flex-1 accent-[#0F8B6C]"
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
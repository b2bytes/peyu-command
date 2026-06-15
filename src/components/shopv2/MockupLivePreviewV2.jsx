import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Move, Sparkles, Loader2, Type, Palette, Upload, Wand2, Maximize2, X } from 'lucide-react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';
import EngravedLayer from '@/components/shopv2/EngravedLayer';
import html2canvas from 'html2canvas';

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

// ── ÁREAS TÉCNICAS DE GRABADO (en % del lienzo cuadrado) ────────────────
// CARCASAS: área contenida (la forma de la carcasa limita el láser).
// OTROS PRODUCTOS (posavasos, cachos, kits, etc.): área LIBRE que cubre casi
// toda la imagen — el cliente puede posicionar el logo donde quiera sobre
// cualquier pieza del producto (posavaso hexagonal, cacho individual, etc.).
const AREA_CARCASA    = { left: 26, right: 74, top: 18, bottom: 86 };
const AREA_LIBRE      = { left: 8,  right: 92, top: 8,  bottom: 92 };

function getArea(esCarcasa) {
  return esCarcasa ? AREA_CARCASA : AREA_LIBRE;
}

// Usamos AREA_LIBRE como default para los cálculos de constantes (se recalcula
// inline en los helpers que reciben el area como parámetro).
const AREA = AREA_CARCASA; // solo para retrocompatibilidad — no se usa directo
const AREA_W = AREA.right - AREA.left;
const AREA_H = AREA.bottom - AREA.top;
const AREA_CX = (AREA.left + AREA.right) / 2;
const AREA_CY = (AREA.top + AREA.bottom) / 2;

// Tamaño base por tipo de capa (en % del lienzo).
// Para productos NO-carcasa usamos tamaños más grandes porque el área es mayor.
const SIZE_BASE_CARCASA = { frase: 30, peyu: 26, archivo: 26 };
const SIZE_BASE_LIBRE   = { frase: 42, peyu: 38, archivo: 38 };

// Auto-layout: distribuye N capas en filas dentro del área técnica, centradas
// verticalmente y sin solaparse. Devuelve { [id]: {size,x,y} }.
// Estrategia mejorada: si hay un logo de cliente (tipo='archivo'), posiciónalo
// en el centro de la zona PEYU existente (arriba). Las otras capas se distribuyen
// debajo o en slots secundarios.
function autoLayout(capas, area, esCarcasa = true) {
  const A = area || AREA_CARCASA;
  const cx = (A.left + A.right) / 2;
  const cy = (A.top + A.bottom) / 2;
  const SIZE_BASE = esCarcasa ? SIZE_BASE_CARCASA : SIZE_BASE_LIBRE;
  const n = capas.length;
  if (n === 0) return {};
  // Para 1 sola capa, centrar exactamente en el centroide del área.
  if (n === 1) {
    const baseSize = SIZE_BASE[capas[0].tipo] || 38;
    return { [capas[0].id]: { size: baseSize, x: cx, y: cy } };
  }
  
  // Prioridad: logo del cliente primero (reemplaza PEYU), luego otras capas
  const clientLogos = capas.filter(c => c.tipo === 'archivo');
  const otherCapas = capas.filter(c => c.tipo !== 'archivo');
  const out = {};
  
  // Si hay logo cliente, lo centramos en zona PEYU (arriba-centro del área)
  if (clientLogos.length > 0) {
    const logoSize = SIZE_BASE['archivo'] || 38;
    const logoCy = A.top + (A.bottom - A.top) * 0.22; // 22% abajo del top = donde está el logo PEYU en fotos
    out[clientLogos[0].id] = { size: logoSize, x: cx, y: logoCy };
  }
  
  // Otras capas (frases, diseños PEYU) se distribuyen en zona baja
  const remainingCapas = clientLogos.length > 0 ? otherCapas : capas;
  if (remainingCapas.length > 0) {
    const usableTop = clientLogos.length > 0 ? A.top + (A.bottom - A.top) * 0.45 : A.top + 4;
    const usableBottom = A.bottom - 4;
    const slotH = (usableBottom - usableTop) / remainingCapas.length;
    remainingCapas.forEach((c, i) => {
      const baseSize = SIZE_BASE[c.tipo] || 26;
      const size = Math.max(14, Math.min(baseSize, slotH * 0.9));
      const y = usableTop + slotH * (i + 0.5);
      out[c.id] = { size, x: cx, y };
    });
  }
  return out;
}

// Restringe el centro de una capa para que su caja quede dentro del área.
function clampToArea(x, y, sizePct, tipo, area) {
  const A = area || AREA_CARCASA;
  const aw = A.right - A.left;
  const halfW = tipo === 'frase' ? Math.min(sizePct * 0.9, aw / 2) : sizePct / 2;
  const halfH = tipo === 'frase' ? sizePct * 0.18 : sizePct / 2;
  return {
    x: Math.max(A.left + halfW, Math.min(A.right - halfW, x)),
    y: Math.max(A.top + halfH, Math.min(A.bottom - halfH, y)),
  };
}

// captureSnapshot(): captura el canvas del preview en vivo como dataURL PNG.
// Se expone via forwardRef para que el padre (ProductoNuevo, LiveConfiguratorV2)
// lo llame al agregar al carrito y guarde el mockup REAL (foto base + grabado).
const MockupLivePreviewV2 = forwardRef(function MockupLivePreviewV2({ productImageUrl, capas = [], onPlacementChange, fallbackUrl, esCarcasa = false, customArea = null, baseFilter = '' }, ref) {
  // Usa customArea si está disponible (asignada por ProductoNuevo), sino deduce de esCarcasa.
  const area = customArea || getArea(esCarcasa);
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

  // Expone captureSnapshot() al padre via ref.
  useImperativeHandle(ref, () => ({
    captureSnapshot: async () => {
      if (!containerRef.current) return null;
      try {
        const canvas = await html2canvas(containerRef.current, {
          useCORS: true,
          allowTaint: true,
          scale: 1.5,
          logging: false,
        });
        return canvas.toDataURL('image/jpeg', 0.88);
      } catch (e) {
        console.warn('MockupLivePreviewV2 captureSnapshot falló:', e?.message);
        return null;
      }
    },
  }));

  // Mantiene la imagen base sincronizada con la prop (al cambiar color/modelo).
  useEffect(() => {
    setImgSrc(productImageUrl || fallbackUrl || null);
  }, [productImageUrl, fallbackUrl]);

  // Detecta el tono del producto → define la tinta del grabado:
  //   producto OSCURO  → grabado CLARO (light), intenso + mix-blend-mode darken.
  //   producto CLARO   → grabado OSCURO (dark), intenso + mix-blend-mode darken.
  // La tinta se elige para máximo contraste visual, y el blend mode asegura
  // que reemplace el logo PEYU existente en la foto.
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
      const auto = autoLayout(capas, area, esCarcasa);
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
      const { x, y } = clampToArea(rawX, rawY, cur.size, capa?.tipo, area);
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
      const { x, y } = clampToArea(cur.x, cur.y, size, capa?.tipo, area);
      return { ...prev, [id]: { ...cur, size, x, y } };
    });
    setTouched((prev) => ({ ...prev, [id]: true }));
  };

  // Re-acomoda TODO automáticamente (botón mágico) — limpia los "touched".
  const autoAcomodar = () => {
    setPlacements(autoLayout(capas, area, esCarcasa));
    setTouched({});
  };

  const hasContent = capas.length > 0;
  const multiCapas = capas.length > 1;

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-3">
      {/* Modal de preview grande (mobile) */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(44,24,16,.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: '#FAF7F2', border: '1.5px solid #D4C4B0' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(248,243,237,.9)', border: '1px solid #D4C4B0' }}
            >
              <X className="w-4 h-4" style={{ color: '#7A6050' }} />
            </button>
            <div className="aspect-square">
              {imgSrc && <img src={imgSrc} alt="Mockup" className="w-full h-full object-cover" style={{ filter: baseFilter || undefined }} />}
            </div>
            <div className="px-4 py-3">
              <p className="text-xs font-bold text-center" style={{ color: '#7A6050' }}>Vista previa referencial · El grabado láser real puede variar ligeramente</p>
            </div>
          </div>
        </div>
      )}

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
            fetchpriority="high"
            loading="eager"
            draggable={false}
            className="w-full h-full object-cover"
            style={{ filter: baseFilter || undefined, transition: 'filter .25s ease' }}
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
              left: `${area.left}%`, top: `${area.top}%`,
              width: `${area.right - area.left}%`, height: `${area.bottom - area.top}%`,
            }}
          >
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-bold tracking-wider text-[#0F8B6C]/70 uppercase whitespace-nowrap">
              {esCarcasa ? 'Área de grabado' : 'Arrastra libremente'}
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

        {/* Botón "Ver grande" en mobile */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="sm:hidden absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: 'rgba(255,255,255,.9)', border: '1px solid #D4C4B0' }}
        >
          <Maximize2 className="w-3.5 h-3.5" style={{ color: '#7A6050' }} />
        </button>

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

      {/* Controles por capa: compactos en mobile */}
      {hasContent && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #D4C4B0', background: 'white' }}>
          {multiCapas && (
            <button
              type="button"
              onClick={autoAcomodar}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold transition-all"
              style={{ borderBottom: '1px solid #EDE3D6', color: '#8BAD8A', background: 'rgba(139,173,138,.06)' }}
            >
              <Wand2 className="w-3.5 h-3.5" /> Acomodar automáticamente
            </button>
          )}
          <div className="divide-y" style={{ '--tw-divide-color': '#EDE3D6' }}>
            {capas.map((c) => {
              const pl = placements[c.id];
              if (!pl) return null;
              const Icon = ICONO[c.tipo] || Palette;
              const isActive = activeId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ background: isActive ? 'rgba(15,139,108,.04)' : 'white' }}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? '#0F8B6C' : '#A08070' }} />
                  <span className="text-[11px] font-bold w-12 flex-shrink-0" style={{ color: '#2C1810' }}>{NOMBRE[c.tipo]}</span>
                  <input
                    type="range" min="12"
                    max={c.tipo === 'frase' ? (esCarcasa ? 40 : 55) : (esCarcasa ? 34 : 52)}
                    value={pl.size}
                    onChange={(e) => { setActiveId(c.id); setSize(c.id, Number(e.target.value)); }}
                    className="flex-1 min-w-0 h-1.5 accent-[#0F8B6C]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-[9px] font-bold w-6 text-right flex-shrink-0" style={{ color: '#A08070' }}>{Math.round(pl.size)}</span>
                </div>
              );
            })}
          </div>
          <div className="px-3 py-2.5 flex items-center gap-1.5" style={{ borderTop: '1px solid #EDE3D6' }}>
            <Move className="w-3 h-3 flex-shrink-0" style={{ color: '#A08070' }} />
            <p className="text-[10px]" style={{ color: '#A08070' }}>
              Arrastra sobre la imagen para posicionar · Toca <strong style={{ color: '#2C1810' }}>Ver grande</strong> para zoom
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default MockupLivePreviewV2;
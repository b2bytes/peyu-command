import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2, Type, Palette, Upload } from 'lucide-react';
import { engraveLogo } from '@/lib/logo-engraver';

// ════════════════════════════════════════════════════════════════════════
// MockupLivePreviewV2 — Preview de grabado láser EN VIVO, piel Tema 6 (cream).
// Compone la foto real de la carcasa + MÚLTIPLES capas combinables: frase,
// diseño PEYU y/o logo propio. Cada capa se posiciona y dimensiona de forma
// independiente arrastrándola. Reporta el placement de cada capa al padre.
//
// Props:
//   productImageUrl : foto base (color elegido)
//   capas: [{ id, tipo:'frase'|'peyu'|'archivo', texto?, url? }]
//   onPlacementChange: (placements: { [id]: {size,x,y} }) => void
// ════════════════════════════════════════════════════════════════════════

const ICONO = { frase: Type, peyu: Palette, archivo: Upload };
const NOMBRE = { frase: 'Frase', peyu: 'Diseño PEYU', archivo: 'Tu logo' };

// Posiciones iniciales escalonadas para que no se apilen exactas.
const DEFAULTS = {
  frase:   { size: 34, x: 50, y: 38 },
  peyu:    { size: 30, x: 50, y: 56 },
  archivo: { size: 30, x: 50, y: 56 },
};

export default function MockupLivePreviewV2({ productImageUrl, capas = [], onPlacementChange }) {
  const containerRef = useRef(null);
  const [placements, setPlacements] = useState({}); // id -> {size,x,y}
  const [engraved, setEngraved] = useState({});       // url -> {dataUrl, ok}
  const [processing, setProcessing] = useState(false);
  const [activeId, setActiveId] = useState(null);     // capa que se arrastra
  const [dragging, setDragging] = useState(false);

  // Inicializa placement de capas nuevas, descarta las que ya no están.
  useEffect(() => {
    setPlacements((prev) => {
      const next = {};
      capas.forEach((c) => {
        next[c.id] = prev[c.id] || { ...(DEFAULTS[c.tipo] || DEFAULTS.peyu) };
      });
      return next;
    });
  }, [capas.map((c) => c.id).join('|')]); // eslint-disable-line

  // Reporta placements al padre.
  useEffect(() => { onPlacementChange?.(placements); }, [placements]); // eslint-disable-line

  // Procesa los logos/diseños (URLs) a grabado monocromo transparente.
  useEffect(() => {
    let cancelled = false;
    const urls = capas.filter((c) => c.url && !engraved[c.url]).map((c) => c.url);
    if (!urls.length) return;
    setProcessing(true);
    Promise.all(urls.map((u) => engraveLogo(u, 'dark').then(
      ({ dataUrl, processed }) => ({ u, dataUrl, ok: processed !== false }),
      () => ({ u, dataUrl: u, ok: false }),
    ))).then((results) => {
      if (cancelled) return;
      setEngraved((prev) => {
        const next = { ...prev };
        results.forEach(({ u, dataUrl, ok }) => { next[u] = { dataUrl, ok }; });
        return next;
      });
    }).finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; };
  }, [capas.map((c) => c.url || '').join('|')]); // eslint-disable-line

  const moveTo = useCallback((clientX, clientY) => {
    if (!containerRef.current || !activeId) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(14, Math.min(86, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(14, Math.min(86, ((clientY - rect.top) / rect.height) * 100));
    setPlacements((prev) => ({ ...prev, [activeId]: { ...prev[activeId], x, y } }));
  }, [activeId]);

  const endDrag = () => { setDragging(false); };

  const setSize = (id, size) => setPlacements((prev) => ({ ...prev, [id]: { ...prev[id], size } }));
  const centrar = (id, tipo) => setPlacements((prev) => ({ ...prev, [id]: { ...(DEFAULTS[tipo] || DEFAULTS.peyu) } }));

  const hasContent = capas.length > 0;

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

        {capas.map((c) => {
          const pl = placements[c.id];
          if (!pl) return null;
          const isActive = activeId === c.id;
          const startDrag = (e) => { e.stopPropagation(); setActiveId(c.id); setDragging(true); };

          // Capa de frase (texto).
          if (c.tipo === 'frase') {
            if (!c.texto?.trim()) return null;
            return (
              <div key={c.id} className="absolute cursor-move" style={{ left: `${pl.x}%`, top: `${pl.y}%`, transform: 'translate(-50%, -50%)' }}
                onMouseDown={startDrag} onTouchStart={startDrag}>
                {isActive && <span className="absolute -inset-2 rounded-lg border border-dashed border-[#0F8B6C]/50 pointer-events-none" />}
                <span style={{
                  fontSize: `${pl.size * 0.4}px`, fontFamily: 'monospace', fontWeight: 'bold',
                  color: '#1c1c1c', letterSpacing: '0.12em', opacity: 0.9,
                  mixBlendMode: 'multiply', textShadow: '0 1px 1px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
                }}>{c.texto.toUpperCase()}</span>
              </div>
            );
          }

          // Capa gráfica (diseño PEYU / logo).
          const eng = c.url ? engraved[c.url] : null;
          if (!eng) return null;
          return (
            <div key={c.id} className="absolute cursor-move"
              style={{
                left: `${pl.x}%`, top: `${pl.y}%`, width: `${pl.size}%`, transform: 'translate(-50%, -50%)',
                mixBlendMode: eng.ok ? 'multiply' : 'normal', opacity: eng.ok ? 0.9 : 0.95,
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
              }}
              onMouseDown={startDrag} onTouchStart={startDrag}>
              {isActive && <span className="absolute -inset-1.5 rounded-lg border border-dashed border-[#0F8B6C]/50 pointer-events-none" />}
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
                  type="range" min="12" max="50" value={pl.size}
                  onChange={(e) => { setActiveId(c.id); setSize(c.id, Number(e.target.value)); }}
                  className="flex-1 accent-[#0F8B6C]"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); centrar(c.id, c.tipo); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40 text-[10px] font-bold flex-shrink-0"
                >
                  <Move className="w-3 h-3" /> Centrar
                </button>
              </div>
            );
          })}
          <p className="text-[10px] text-[#A78B6F] leading-relaxed">
            Toca un diseño para seleccionarlo, arrástralo sobre el producto y ajusta su tamaño. El grabado láser UV real se ajusta al área técnica.
          </p>
        </div>
      )}
    </div>
  );
}
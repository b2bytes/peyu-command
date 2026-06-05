import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2 } from 'lucide-react';
import { engraveLogo } from '@/lib/logo-engraver';

// ════════════════════════════════════════════════════════════════════════
// MockupLivePreviewV2 — Preview de grabado láser EN VIVO, piel Tema 6 (cream).
// Compone la foto real de la carcasa (color elegido) + el diseño del cliente
// (logo/diseño PEYU procesado a monocromo transparente, o frase) en la zona de
// grabado. El cliente arrastra para posicionar y ajusta tamaño. Lo que ve es lo
// que recibe. Reporta posición/tamaño al padre para guardarlos en el pedido.
// ════════════════════════════════════════════════════════════════════════
export default function MockupLivePreviewV2({
  productImageUrl,
  logoUrl = '',          // logo del cliente o diseño PEYU (URL)
  texto = '',
  onPlacementChange,     // ({ size, x, y }) => void
}) {
  const [size, setSize] = useState(30);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(54);
  const [dragging, setDragging] = useState(false);
  const [engravedUrl, setEngravedUrl] = useState('');
  const [engravedOk, setEngravedOk] = useState(true);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef(null);

  // Procesa el logo/diseño a grabado monocromo transparente.
  useEffect(() => {
    let cancelled = false;
    if (!logoUrl) { setEngravedUrl(''); setEngravedOk(true); return; }
    setProcessing(true);
    engraveLogo(logoUrl, 'dark')
      .then(({ dataUrl, processed }) => {
        if (cancelled) return;
        setEngravedUrl(dataUrl);
        setEngravedOk(processed !== false);
      })
      .catch(() => { if (!cancelled) { setEngravedUrl(logoUrl); setEngravedOk(false); } })
      .finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; };
  }, [logoUrl]);

  useEffect(() => {
    onPlacementChange?.({ size, x: posX, y: posY });
  }, [size, posX, posY]); // eslint-disable-line

  const moveTo = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPosX(Math.max(14, Math.min(86, x)));
    setPosY(Math.max(14, Math.min(86, y)));
  }, []);

  const hasContent = !!logoUrl || !!texto;

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-[#FAF7F2] border border-[#EBE3D6] select-none touch-none"
        onMouseMove={(e) => dragging && moveTo(e.clientX, e.clientY)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchMove={(e) => dragging && e.touches[0] && moveTo(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={() => setDragging(false)}
      >
        {productImageUrl ? (
          <img src={productImageUrl} alt="Producto" referrerPolicy="no-referrer" draggable={false} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#F0EAE0] to-[#E7D8C6]" />
        )}

        {/* Área técnica guía */}
        {hasContent && (
          <div
            className="absolute pointer-events-none rounded-lg border border-dashed border-[#2A2420]/25"
            style={{ left: `${posX}%`, top: `${posY}%`, width: `${size * 1.25}%`, height: `${size * 0.85}%`, transform: 'translate(-50%, -50%)' }}
          />
        )}

        {/* Logo / diseño grabado */}
        {engravedUrl && (
          <div
            className="absolute cursor-move"
            style={{
              left: `${posX}%`, top: `${posY}%`, width: `${size}%`,
              transform: 'translate(-50%, -50%)',
              mixBlendMode: engravedOk ? 'multiply' : 'normal',
              opacity: engravedOk ? 0.9 : 0.95,
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDragging(true); }}
            onTouchStart={(e) => { e.stopPropagation(); setDragging(true); }}
          >
            <img src={engravedUrl} alt="Tu diseño" draggable={false} className="w-full h-auto pointer-events-none" />
          </div>
        )}

        {/* Frase grabada */}
        {!logoUrl && texto && (
          <div
            className="absolute text-center cursor-move"
            style={{
              left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -50%)',
              fontSize: `${size * 0.4}px`, fontFamily: 'monospace', fontWeight: 'bold',
              color: '#1c1c1c', letterSpacing: '0.12em', opacity: 0.9,
              mixBlendMode: 'multiply', textShadow: '0 1px 1px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
            }}
            onMouseDown={(e) => { e.stopPropagation(); setDragging(true); }}
            onTouchStart={(e) => { e.stopPropagation(); setDragging(true); }}
          >
            {texto.toUpperCase()}
          </div>
        )}

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

      {/* Controles cuando hay diseño */}
      {hasContent && (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between mb-1 text-[11px] font-semibold">
              <span className="text-[#4B4F54]">Tamaño</span>
              <span className="text-[#A78B6F]">{size}%</span>
            </div>
            <input
              type="range" min="12" max="50" value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-[#0F8B6C]"
            />
          </div>
          <button
            type="button"
            onClick={() => { setPosX(50); setPosY(54); setSize(30); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#EBE3D6] text-[#4B4F54] hover:border-[#0F8B6C]/40 text-[11px] font-bold mt-3"
          >
            <Move className="w-3 h-3" /> Centrar
          </button>
        </div>
      )}
      {hasContent && (
        <p className="text-[10px] text-[#A78B6F] leading-relaxed">
          Arrastra el diseño para posicionarlo. El grabado láser UV real se ajusta al área técnica del producto.
        </p>
      )}
    </div>
  );
}
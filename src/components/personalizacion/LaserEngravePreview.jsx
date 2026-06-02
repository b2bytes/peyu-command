import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2 } from 'lucide-react';
import { engraveLogo } from '@/lib/logo-engraver';

// ============================================================================
// LaserEngravePreview — Compositor de grabado láser SIN caja negra.
// ----------------------------------------------------------------------------
// Recibe un logo (File o URL) y/o texto, lo procesa con engraveLogo (quita
// fondo + monocromo) y lo compone sobre la foto del producto con transparencia
// y blend, simulando un grabado fundido en la superficie. Si el procesado
// falla, muestra el logo limpio centrado — NUNCA un rectángulo opaco.
//
// Reutilizable en los 3 embudos: ficha B2C, cotizador corporativo y chat /v2.
// ============================================================================

export default function LaserEngravePreview({
  productImageUrl,   // foto original (con logo PEYU) — se usa cuando NO hay logo del cliente
  cleanImageUrl,     // foto base limpia (sin logo PEYU) — lienzo cuando SÍ hay logo del cliente
  logoFile,          // File subido (opcional)
  logoUrl,           // URL ya subida (opcional)
  texto = '',
  areaLabel,         // ej: "≈ 40×25mm"
  defaultTint = 'dark',
}) {
  const [size, setSize] = useState(28);   // % del producto
  const [posX, setPosX] = useState(50);   // %
  const [posY, setPosY] = useState(55);   // %
  const [tint, setTint] = useState(defaultTint); // dark | light
  const [dragging, setDragging] = useState(false);
  const [engravedUrl, setEngravedUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef(null);

  const logoSource = logoFile || logoUrl || null;

  // Cuando el cliente aporta su propio diseño (logo o texto), componemos sobre
  // la base LIMPIA (sin el logo PEYU) para que no queden dos logos. Si aún no
  // hay base limpia, caemos a la original (mejor mostrar algo que romper).
  // Sin diseño del cliente → mostramos la foto original tal cual (con PEYU).
  const hasClientDesign = !!logoSource || !!texto;
  const canvasImage = hasClientDesign
    ? (cleanImageUrl || productImageUrl)
    : productImageUrl;

  // Reprocesa el logo cada vez que cambia el origen o la tinta.
  useEffect(() => {
    let cancelled = false;
    if (!logoSource) { setEngravedUrl(''); return; }
    setProcessing(true);
    engraveLogo(logoSource, tint)
      .then(({ dataUrl }) => { if (!cancelled) setEngravedUrl(dataUrl); })
      .finally(() => { if (!cancelled) setProcessing(false); });
    return () => { cancelled = true; };
  }, [logoSource, tint]);

  const moveTo = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPosX(Math.max(12, Math.min(88, x)));
    setPosY(Math.max(12, Math.min(88, y)));
  }, []);

  const handleMouseMove = (e) => { if (dragging) moveTo(e.clientX, e.clientY); };
  const handleTouchMove = (e) => { if (dragging && e.touches[0]) moveTo(e.touches[0].clientX, e.touches[0].clientY); };
  const recenter = () => { setPosX(50); setPosY(55); setSize(28); };

  const hasContent = !!logoSource || !!texto;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-teal-400/30 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-teal-300" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Mockup en vivo</p>
            <p className="text-[10px] text-white/50">Grabado láser simulado · fondo eliminado automáticamente</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 border border-teal-400/30 px-2 py-1 rounded-full">
          {processing ? 'Procesando logo…' : 'Tiempo real'}
        </span>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/10 select-none"
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setDragging(false)}
      >
        {canvasImage
          ? <img src={canvasImage} alt="Producto" className="w-full h-full object-cover" draggable={false} />
          : <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
        }

        {/* Área técnica guía (recuadro sutil) */}
        <div
          className="absolute pointer-events-none rounded-lg border border-dashed border-white/25"
          style={{
            left: `${posX}%`, top: `${posY}%`,
            width: `${size * 1.25}%`, height: `${size * 0.85}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Halo sutil de grabado (oscurecimiento leve, NO caja) */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${posX}%`, top: `${posY}%`,
            width: `${size * 1.3}%`, height: `${size * 1.3}%`,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,0,0,0.10) 0%, transparent 68%)',
          }}
        />

        {/* Logo grabado (transparente + monocromo + blend) */}
        {engravedUrl && (
          <div
            className="absolute cursor-move touch-none"
            style={{
              left: `${posX}%`, top: `${posY}%`,
              width: `${size}%`,
              transform: 'translate(-50%, -50%)',
              mixBlendMode: tint === 'light' ? 'screen' : 'multiply',
              opacity: 0.88,
              filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))',
            }}
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
          >
            <img src={engravedUrl} alt="Tu logo grabado" draggable={false} className="w-full h-auto pointer-events-none" />
          </div>
        )}

        {/* Texto grabado (cuando no hay logo) */}
        {!logoSource && texto && (
          <div
            className="absolute pointer-events-none text-center cursor-move"
            style={{
              left: `${posX}%`, top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${size * 0.42}px`,
              fontFamily: 'monospace', fontWeight: 'bold',
              color: tint === 'light' ? '#f5f5f5' : '#1c1c1c',
              letterSpacing: '0.15em',
              opacity: 0.88,
              mixBlendMode: tint === 'light' ? 'screen' : 'multiply',
              textShadow: '0 1px 1px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap',
            }}
            onMouseDown={() => setDragging(true)}
            onTouchStart={() => setDragging(true)}
          >
            {texto.toUpperCase()}
          </div>
        )}

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-teal-300 animate-spin" />
          </div>
        )}

        <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md border border-white/15">
          <p className="text-[9px] text-white/60 font-medium">PEYU · Preview referencial</p>
        </div>
      </div>

      {/* Controles */}
      {hasContent && (
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-white/60 font-semibold">Tamaño</label>
              <span className="text-white/40">{size}%</span>
            </div>
            <input
              type="range" min="10" max="50" value={size}
              onChange={e => setSize(Number(e.target.value))}
              className="w-full accent-teal-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTint(tint === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 text-[11px] font-semibold"
            >
              <span className={`w-3 h-3 rounded-full ${tint === 'light' ? 'bg-white' : 'bg-gray-900'} border border-white/30`} />
              Tinta {tint === 'light' ? 'clara' : 'oscura'}
            </button>
            <button
              type="button"
              onClick={recenter}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 text-[11px] font-semibold"
            >
              <Move className="w-3 h-3" /> Centrar
            </button>
          </div>
        </div>
      )}

      <div className="text-[10px] text-white/40 italic bg-white/5 border border-white/10 rounded-xl p-2.5 leading-relaxed">
        El grabado láser UV real se aplica a pedido y se ajusta al área técnica del producto{areaLabel ? ` (${areaLabel})` : ''}.
      </div>
    </div>
  );
}
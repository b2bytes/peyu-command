import { useState, useRef, useEffect, useCallback } from 'react';
import { Move, Sparkles, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { engraveLogo, detectImageTone } from '@/lib/logo-engraver';
// REGLA ÚNICA del grabado (compartida por todos los flujos de mockup).
import { inkBlend, biselFx, INK_CSS } from '@/lib/engraving-rule';
import { useMockupZoom } from '@/components/personalizacion/useMockupZoom.jsx';

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
  light = false,     // tema claro Warm Dusk (alto contraste sobre fondo crema)
}) {
  // Fuente de imagen efectiva con fallback robusto: si la base limpia falla a
  // cargar (404/red), caemos a la imagen normal del producto. NUNCA roto.
  const [imgFailed, setImgFailed] = useState(false);
  const [size, setSize] = useState(28);   // % del producto
  const [posX, setPosX] = useState(50);   // %
  const [posY, setPosY] = useState(55);   // %
  const [tint, setTint] = useState(defaultTint); // dark | light
  const [dragging, setDragging] = useState(false);
  const [engravedUrl, setEngravedUrl] = useState('');
  // ¿El logo se pudo procesar a monocromo-transparente? Si NO (CORS / canvas
  // tainted), lo mostramos limpio SIN blend multiply para evitar la caja negra.
  const [engravedOk, setEngravedOk] = useState(true);
  const [processing, setProcessing] = useState(false);
  const containerRef = useRef(null);

  // Zoom VISUAL del mockup (rueda/pinch/doble-tap/pan). No afecta posición real
  // del diseño, ni precio, ni estado del wizard. Es solo para inspeccionar.
  const zoom = useMockupZoom(containerRef);

  const logoSource = logoFile || logoUrl || null;

  // Resetear el zoom visual a 1x cuando cambia el diseño o el producto, para que
  // nunca quede "atascado" ampliado al volver al paso.
  useEffect(() => { zoom.reset(); }, [logoSource, texto, productImageUrl]); // eslint-disable-line

  // Cuando el cliente aporta su propio diseño (logo o texto), componemos sobre
  // la base LIMPIA (sin el logo PEYU) para que no queden dos logos. Si aún no
  // hay base limpia, caemos a la original (mejor mostrar algo que romper).
  // Sin diseño del cliente → mostramos la foto original tal cual (con PEYU).
  const hasClientDesign = !!logoSource || !!texto;
  // Si la base limpia falló a cargar, usamos directamente la imagen del producto.
  const preferClean = hasClientDesign && cleanImageUrl && !imgFailed;
  const canvasImage = preferClean ? cleanImageUrl : productImageUrl;

  // Reset del flag cuando cambia la imagen candidata.
  useEffect(() => { setImgFailed(false); }, [cleanImageUrl, productImageUrl]);

  // ⚡ TONO AUTOMÁTICO: detecta el color del producto y elige la tinta correcta
  // sola (producto oscuro → tinta clara, claro → oscura). El usuario igual
  // puede alternarla manualmente con el botón "Tinta".
  useEffect(() => {
    if (!canvasImage) return;
    let cancelled = false;
    detectImageTone(canvasImage).then((t) => { if (!cancelled) setTint(t); });
    return () => { cancelled = true; };
  }, [canvasImage]); // eslint-disable-line

  // Reprocesa el logo cada vez que cambia el origen o la tinta.
  useEffect(() => {
    let cancelled = false;
    if (!logoSource) { setEngravedUrl(''); setEngravedOk(true); return; }
    setProcessing(true);
    engraveLogo(logoSource, tint)
      .then(({ dataUrl, processed }) => {
        if (cancelled) return;
        setEngravedUrl(dataUrl);
        setEngravedOk(processed !== false);
      })
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
    <div className={light
      ? 'bg-white border-[1.5px] border-[#D4C4B0] rounded-2xl p-4 space-y-4 shadow-sm'
      : 'bg-white/5 backdrop-blur-md border border-teal-400/30 rounded-2xl p-5 space-y-4 shadow-xl'}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${light ? 'bg-[#C0785C]/12 border border-[#C0785C]/30' : 'bg-teal-500/20 border border-teal-400/30'}`}>
            <Sparkles className={`w-4 h-4 ${light ? 'text-[#C0785C]' : 'text-teal-300'}`} />
          </div>
          <div>
            <p className={`font-bold text-sm ${light ? 'text-[#2C1810]' : 'text-white'}`}>Mockup en vivo</p>
            <p className={`text-[10px] ${light ? 'text-[#7A6050]' : 'text-white/50'}`}>Grabado láser simulado · acerca con rueda o pinch para inspeccionar</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${light ? 'text-[#C0785C] bg-[#C0785C]/10 border border-[#C0785C]/30' : 'text-teal-300 bg-teal-500/20 border border-teal-400/30'}`}>
          {processing ? 'Procesando logo…' : 'Tiempo real'}
        </span>
      </div>

      {/* Canvas — el contenedor captura gestos de zoom y recorta (overflow-hidden).
          La capa interna .zoom-layer aplica el transform de zoom VISUAL. */}
      <div
        ref={containerRef}
        className={`relative aspect-square rounded-2xl overflow-hidden select-none touch-none ${light ? 'bg-[#F2EBE0] border-[1.5px] border-[#D4C4B0]' : 'bg-slate-900 border border-white/10'} ${zoom.zoomedIn ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseMove={(e) => { handleMouseMove(e); zoom.bind.onMouseMove(e); }}
        onMouseDown={(e) => { if (!dragging) zoom.bind.onMouseDown(e); }}
        onMouseUp={(e) => { setDragging(false); zoom.bind.onMouseUp(e); }}
        onMouseLeave={(e) => { setDragging(false); zoom.bind.onMouseLeave(e); }}
        onTouchMove={(e) => { if (dragging) handleTouchMove(e); else zoom.bind.onTouchMove(e); }}
        onTouchStart={(e) => { if (!dragging) zoom.bind.onTouchStart(e); }}
        onTouchEnd={(e) => { setDragging(false); zoom.bind.onTouchEnd(e); }}
        onWheel={zoom.bind.onWheel}
        onDoubleClick={zoom.bind.onDoubleClick}
      >
        {/* Capa de zoom visual — escala/traslada TODO el contenido del mockup */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`,
            transformOrigin: 'center center',
            transition: zoom.zoomedIn ? 'transform 60ms linear' : 'transform 180ms ease-out',
            willChange: 'transform',
          }}
        >
          {canvasImage
            ? <img
                src={canvasImage}
                alt="Producto"
                className="w-full h-full object-cover"
                draggable={false}
                onError={() => {
                  if (preferClean) setImgFailed(true);
                }}
              />
            : <div className={`w-full h-full bg-gradient-to-br ${light ? 'from-[#F2EBE0] to-[#E7D8C6]' : 'from-slate-800 to-slate-900'}`} />
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

          {/* Logo grabado (transparente + monocromo + blend).
              Si el procesado falló (engravedOk=false, p.ej. logo remoto sin CORS),
              NO aplicamos mixBlendMode multiply — eso convertiría el logo crudo en
              un bloque oscuro. Lo mostramos limpio con opacidad media. */}
          {engravedUrl && (
            <div
              className="absolute cursor-move"
              style={{
                left: `${posX}%`, top: `${posY}%`,
                width: `${size}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseDown={(e) => { if (!zoom.zoomedIn) { e.stopPropagation(); setDragging(true); } }}
              onTouchStart={(e) => { if (!zoom.zoomedIn) { e.stopPropagation(); setDragging(true); } }}
            >
              {/* Pasada 1 · TINTA con bisel 3D del láser (reflejo + surco) */}
              <img
                src={engravedUrl} alt="Tu logo grabado" draggable={false}
                className={`w-full h-auto pointer-events-none ${processing ? 'animate-pulse' : ''}`}
                style={{
                  mixBlendMode: engravedOk ? inkBlend(tint) : 'normal',
                  opacity: engravedOk ? 0.9 : 0.92,
                  filter: biselFx(tint),
                }}
              />
              {/* Pasada 2 · TEXTURA: la foto del producto recortada con la
                  silueta del logo (soft-light) → el grabado absorbe los granos
                  y reflejos reales del material, no queda como parche plano. */}
              {engravedOk && canvasImage && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    WebkitMaskImage: `url("${engravedUrl}")`, maskImage: `url("${engravedUrl}")`,
                    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center', maskPosition: 'center',
                    WebkitMaskSize: 'contain', maskSize: 'contain',
                    backgroundImage: `url("${canvasImage}")`,
                    backgroundSize: '320% 320%',
                    backgroundPosition: 'center',
                    mixBlendMode: 'soft-light',
                    opacity: 0.55,
                    filter: tint === 'light' ? 'brightness(1.15) contrast(1.1)' : 'brightness(0.9) contrast(1.15)',
                  }}
                />
              )}
            </div>
          )}

          {/* Texto grabado (cuando no hay logo) */}
          {!logoSource && texto && (
            <div
              className="absolute text-center cursor-move"
              style={{
                left: `${posX}%`, top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${size * 0.42}px`,
                fontFamily: 'monospace', fontWeight: 'bold',
                color: INK_CSS[tint],
                letterSpacing: '0.15em',
                opacity: 0.88,
                mixBlendMode: inkBlend(tint),
                textShadow: '0 1px 1px rgba(0,0,0,0.25)',
                whiteSpace: 'nowrap',
              }}
              onMouseDown={(e) => { if (!zoom.zoomedIn) { e.stopPropagation(); setDragging(true); } }}
              onTouchStart={(e) => { if (!zoom.zoomedIn) { e.stopPropagation(); setDragging(true); } }}
            >
              {texto.toUpperCase()}
            </div>
          )}
        </div>

        {/* ── Controles de zoom (fuera de la capa que escala) ── */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={zoom.zoomIn}
            disabled={!zoom.canZoomIn}
            className="w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur border border-white/15 flex items-center justify-center text-white/80 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoom.zoomOut}
            disabled={!zoom.canZoomOut}
            className="w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur border border-white/15 flex items-center justify-center text-white/80 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          {zoom.zoomedIn && (
            <button
              type="button"
              onClick={zoom.reset}
              className="w-8 h-8 rounded-lg bg-teal-500/80 backdrop-blur border border-teal-400/40 flex items-center justify-center text-white hover:bg-teal-500 transition-all"
              aria-label="Centrar y restablecer zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Indicador de zoom (solo cuando hay zoom) */}
        {zoom.zoomedIn && (
          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md border border-white/15">
            <p className="text-[9px] text-teal-300 font-bold tabular-nums">{zoom.scale.toFixed(1)}×</p>
          </div>
        )}

        {processing && (
          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 text-teal-300 animate-spin" />
            <span className="text-[9px] text-white/70 font-medium">procesando…</span>
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
              <label className={`font-bold ${light ? 'text-[#2C1810]' : 'text-white/60 font-semibold'}`}>Tamaño</label>
              <span className={light ? 'text-[#7A6050] font-semibold' : 'text-white/40'}>{size}%</span>
            </div>
            <input
              type="range" min="10" max="50" value={size}
              onChange={e => setSize(Number(e.target.value))}
              className={`w-full ${light ? 'accent-[#C0785C]' : 'accent-teal-400'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTint(tint === 'dark' ? 'light' : 'dark')}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold ${light ? 'bg-white border-[1.5px] border-[#D4C4B0] text-[#2C1810] hover:bg-[#F8F3ED]' : 'bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 font-semibold'}`}
            >
              <span className={`w-3 h-3 rounded-full ${tint === 'light' ? 'bg-white' : 'bg-gray-900'} ${light ? 'border border-black/25' : 'border border-white/30'}`} />
              Tinta {tint === 'light' ? 'clara' : 'oscura'}
            </button>
            <button
              type="button"
              onClick={recenter}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold ${light ? 'bg-white border-[1.5px] border-[#D4C4B0] text-[#2C1810] hover:bg-[#F8F3ED]' : 'bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 font-semibold'}`}
            >
              <Move className="w-3 h-3" /> Centrar
            </button>
          </div>
        </div>
      )}

      <div className={`text-[10px] italic rounded-xl p-2.5 leading-relaxed ${light ? 'text-[#7A6050] bg-[#F8F3ED] border border-[#D4C4B0]' : 'text-white/40 bg-white/5 border border-white/10'}`}>
        El grabado láser UV real se aplica a pedido y se ajusta al área técnica del producto{areaLabel ? ` (${areaLabel})` : ''}.
      </div>
    </div>
  );
}
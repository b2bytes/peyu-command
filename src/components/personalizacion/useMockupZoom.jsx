import { useState, useRef, useCallback } from 'react';

// ============================================================================
// useMockupZoom(containerRef) — Zoom + pan VISUAL para el preview del mockup.
// Solo afecta la visualización (inspeccionar el grabado de cerca); NO cambia
// la posición real del diseño, ni el precio, ni el estado del wizard.
//
// API consumida por LaserEngravePreview:
//   { scale, tx, ty, zoomIn, zoomOut, reset, canZoomIn, canZoomOut, zoomedIn,
//     bind: { onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
//             onTouchStart, onTouchMove, onTouchEnd, onDoubleClick } }
// ============================================================================
const MIN = 1;
const MAX = 3;
const STEP = 0.5;

export function useMockupZoom(containerRef) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const pan = useRef(null);
  const pinch = useRef(null); // { startDist, startScale } durante gesto de 2 dedos

  const clamp = useCallback((s) => Math.max(MIN, Math.min(MAX, s)), []);

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  const setScaleSafe = useCallback((next) => {
    const s = clamp(next);
    if (s <= 1) { setScale(1); setTx(0); setTy(0); }
    else setScale(s);
  }, [clamp]);

  const zoomIn = useCallback(() => setScaleSafe(scale + STEP), [scale, setScaleSafe]);
  const zoomOut = useCallback(() => setScaleSafe(scale - STEP), [scale, setScaleSafe]);

  const zoomedIn = scale > 1;

  // ── Gestos ────────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setScaleSafe(scale + (e.deltaY < 0 ? STEP / 2 : -STEP / 2));
  }, [scale, setScaleSafe]);

  const onDoubleClick = useCallback(() => {
    if (zoomedIn) reset(); else setScaleSafe(2);
  }, [zoomedIn, reset, setScaleSafe]);

  const startPan = useCallback((x, y) => {
    if (scale <= 1) return;
    pan.current = { x, y, baseTx: tx, baseTy: ty };
  }, [scale, tx, ty]);

  const movePan = useCallback((x, y) => {
    if (!pan.current || scale <= 1) return;
    setTx(pan.current.baseTx + (x - pan.current.x));
    setTy(pan.current.baseTy + (y - pan.current.y));
  }, [scale]);

  const endPan = useCallback(() => { pan.current = null; }, []);

  // ── Pinch (2 dedos) → zoom real en táctil ──────────────────────────────
  const touchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length >= 2) {
      pinch.current = { startDist: touchDist(e.touches), startScale: scale };
      pan.current = null;
    } else if (e.touches[0]) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [scale, startPan]);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length >= 2 && pinch.current) {
      e.preventDefault();
      const ratio = touchDist(e.touches) / (pinch.current.startDist || 1);
      setScaleSafe(pinch.current.startScale * ratio);
    } else if (e.touches[0]) {
      movePan(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [movePan, setScaleSafe]);

  const onTouchEnd = useCallback((e) => {
    if (!e.touches || e.touches.length < 2) pinch.current = null;
    endPan();
  }, [endPan]);

  const bind = {
    onWheel,
    onDoubleClick,
    onMouseDown: (e) => startPan(e.clientX, e.clientY),
    onMouseMove: (e) => movePan(e.clientX, e.clientY),
    onMouseUp: endPan,
    onMouseLeave: endPan,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return {
    scale, tx, ty,
    zoomIn, zoomOut, reset,
    canZoomIn: scale < MAX,
    canZoomOut: scale > MIN,
    zoomedIn,
    bind,
  };
}

export default useMockupZoom;
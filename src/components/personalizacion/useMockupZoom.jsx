import { useState, useCallback, useRef } from 'react';

// ============================================================================
// useMockupZoom — Hook de zoom + pan para el preview del mockup.
// Maneja escala (zoom) y desplazamiento (translate x/y) con límites seguros.
// ============================================================================
export default function useMockupZoom({ min = 1, max = 3, step = 0.25 } = {}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const dragRef = useRef(null);

  const clampScale = useCallback((s) => Math.max(min, Math.min(max, s)), [min, max]);

  const zoomIn = useCallback(() => setScale(s => clampScale(s + step)), [clampScale, step]);
  const zoomOut = useCallback(() => {
    setScale(s => {
      const next = clampScale(s - step);
      if (next <= 1) { setTx(0); setTy(0); }
      return next;
    });
  }, [clampScale, step]);

  const reset = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  const startDrag = useCallback((clientX, clientY) => {
    dragRef.current = { startX: clientX, startY: clientY, baseTx: tx, baseTy: ty };
  }, [tx, ty]);

  const onDrag = useCallback((clientX, clientY) => {
    if (!dragRef.current || scale <= 1) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setTx(dragRef.current.baseTx + dx);
    setTy(dragRef.current.baseTy + dy);
  }, [scale]);

  const endDrag = useCallback(() => { dragRef.current = null; }, []);

  return {
    scale, tx, ty,
    zoomIn, zoomOut, reset,
    startDrag, onDrag, endDrag,
    canPan: scale > 1,
    transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
  };
}
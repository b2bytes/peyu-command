import { useEffect, useState } from 'react';
import { getLiquidMode, subscribeLiquidMode } from '@/lib/liquid-dual';

// Logo oficial PEYU — auto-adaptativo Liquid Dual.
// El PNG original es oscuro/negro: en modo NIGHT lo invertimos para que se vea
// blanco contra el canvas oscuro; en modo DAY lo dejamos tal cual.
export default function PEYULogo({ size = 'md', forceInvert = null }) {
  const [mode, setMode] = useState(() => {
    if (typeof document === 'undefined') return 'day';
    try { return getLiquidMode(); }
    catch { return document.documentElement.getAttribute('data-liquid-mode') || 'day'; }
  });

  useEffect(() => {
    return subscribeLiquidMode(({ mode: next }) => setMode(next));
  }, []);

  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };
  const heightClass = sizeMap[size] || sizeMap.md;
  const shouldInvert = forceInvert === null ? mode === 'night' : forceInvert;

  return (
    <div className="flex items-center flex-shrink-0">
      <img
        src="https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png"
        alt="PEYU"
        className={`${heightClass} w-auto object-contain select-none transition-[filter] duration-500`}
        style={shouldInvert ? { filter: 'invert(1) brightness(1.15)' } : undefined}
        draggable={false}
        loading="eager"
      />
    </div>
  );
}
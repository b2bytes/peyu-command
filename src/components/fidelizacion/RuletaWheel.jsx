import { useEffect, useState } from 'react';

// ════════════════════════════════════════════════════════════════════════
// RuletaWheel — Rueda SVG de 6 segmentos con animación de giro.
// El orden de SEGMENTOS debe calzar con PREMIOS del backend ruletaGirar.
// Props: spinning (bool), targetIndex (int|null) → gira 5 vueltas y aterriza
// en el segmento ganador (puntero arriba). onSpinEnd() al terminar.
// ════════════════════════════════════════════════════════════════════════
export const SEGMENTOS = [
  { label: '5%', color: '#0F8B6C' },
  { label: '10%', color: '#C0785C' },
  { label: '$2.000', color: '#5B7D5A' },
  { label: 'Envío gratis', color: '#D96B4D' },
  { label: '15%', color: '#2C1810' },
  { label: '$3.000', color: '#A86440' },
];

const SEG = 360 / SEGMENTOS.length;

function segPath(i, r = 100) {
  const a0 = ((i * SEG - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SEG - 90) * Math.PI) / 180;
  return `M100,100 L${100 + r * Math.cos(a0)},${100 + r * Math.sin(a0)} A${r},${r} 0 0 1 ${100 + r * Math.cos(a1)},${100 + r * Math.sin(a1)} Z`;
}

export default function RuletaWheel({ spinning, targetIndex, onSpinEnd }) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning && targetIndex != null) {
      // 5 vueltas completas + aterrizar con el centro del segmento bajo el puntero (arriba)
      const target = 360 * 5 + (360 - (targetIndex * SEG + SEG / 2));
      setRotation(target);
      const t = setTimeout(() => onSpinEnd?.(), 4200);
      return () => clearTimeout(t);
    }
  }, [spinning, targetIndex, onSpinEnd]);

  return (
    <div className="relative w-64 h-64 mx-auto select-none">
      {/* Puntero */}
      <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10"
        style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid #2C1810' }} />
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xl"
        style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.28, 1)' : 'none' }}
      >
        {SEGMENTOS.map((s, i) => (
          <g key={i}>
            <path d={segPath(i)} fill={s.color} stroke="#F8F3ED" strokeWidth="2" />
            <text
              x="100" y="100"
              fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle"
              transform={`rotate(${i * SEG + SEG / 2} 100 100) translate(0 -68)`}
            >
              {s.label}
            </text>
          </g>
        ))}
        <circle cx="100" cy="100" r="18" fill="#F8F3ED" stroke="#D4C4B0" strokeWidth="2" />
        <text x="100" y="105" fontSize="14" textAnchor="middle">🐢</text>
      </svg>
    </div>
  );
}
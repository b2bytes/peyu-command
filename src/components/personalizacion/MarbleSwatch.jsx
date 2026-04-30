/**
 * MarbleSwatch · Marmolado SVG procedural realista
 * --------------------------------------------------
 * Cada swatch es único: usa filtros SVG (turbulence + displacement) sobre
 * gradientes de 3 tonos derivados del color base, simulando el efecto del
 * plástico reciclado inyectado artesanalmente. Las vetas blancas/oscuras
 * añaden el toque "marble" final.
 */

// Aclarar / oscurecer un hex en N% (sin libs externas)
function shadeHex(hex, percent) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default function MarbleSwatch({ hex, seed = 1, className = '' }) {
  // Tonos derivados para el marmolado
  const lighter = shadeHex(hex, 28);
  const lightest = shadeHex(hex, 50);
  const darker = shadeHex(hex, -22);
  const darkest = shadeHex(hex, -42);

  // El seed asegura que cada swatch tenga un patrón distinto pero estable
  const id = `marble-${seed}`;
  const baseFreq = 0.012 + (seed % 5) * 0.003;
  const veinFreq = 0.04 + (seed % 3) * 0.01;
  const rotation = (seed * 37) % 180;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Filtro principal: turbulencia + displacement = vetas orgánicas */}
        <filter id={`${id}-marble`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFreq}
            numOctaves="3"
            seed={seed}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" />
        </filter>

        {/* Filtro de vetas finas */}
        <filter id={`${id}-veins`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="turbulence"
            baseFrequency={veinFreq}
            numOctaves="2"
            seed={seed + 7}
          />
          <feColorMatrix
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 2 -1"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>

        {/* Gradiente base (3 tonos) */}
        <linearGradient id={`${id}-base`} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${rotation} 50 50)`}>
          <stop offset="0%" stopColor={lighter} />
          <stop offset="50%" stopColor={hex} />
          <stop offset="100%" stopColor={darker} />
        </linearGradient>

        {/* Gradiente de "manchas" (zonas más claras y oscuras) */}
        <radialGradient id={`${id}-spots-light`} cx="35%" cy="30%" r="45%">
          <stop offset="0%" stopColor={lightest} stopOpacity="0.85" />
          <stop offset="100%" stopColor={lightest} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-spots-dark`} cx="70%" cy="75%" r="40%">
          <stop offset="0%" stopColor={darkest} stopOpacity="0.7" />
          <stop offset="100%" stopColor={darkest} stopOpacity="0" />
        </radialGradient>

        {/* Brillo superior tipo "highlight" del plástico */}
        <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Capa 1 — fondo gradiente */}
      <rect width="100" height="100" fill={`url(#${id}-base)`} />

      {/* Capa 2 — manchas claras y oscuras (vetas grandes) */}
      <g filter={`url(#${id}-marble)`}>
        <rect width="100" height="100" fill={`url(#${id}-spots-light)`} />
        <rect width="100" height="100" fill={`url(#${id}-spots-dark)`} />
      </g>

      {/* Capa 3 — vetas finas blancas (simulan el "marble") */}
      <rect
        width="100"
        height="100"
        fill={lightest}
        filter={`url(#${id}-veins)`}
        opacity="0.55"
      />

      {/* Capa 4 — brillo superior */}
      <rect width="100" height="100" fill={`url(#${id}-shine)`} />
    </svg>
  );
}
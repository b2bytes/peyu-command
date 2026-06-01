import React from 'react';
import { Mic, ArrowUp, Recycle, Star, ShieldCheck, Droplets, Sun, Moon } from 'lucide-react';

const PEYU_LOGO = 'https://media.base44.com/images/public/6a1a158951bc398e16add415/86a2b4b89_image.png';

const NAV_ITEMS = [
  { label: 'Conversación', dot: 'accent' },
  { label: 'Tienda', dot: 'text' },
  { label: 'Categorías', dot: 'text' },
  { label: 'B2B', dot: 'accent2' },
  { label: 'Gift Card', dot: 'accent2' },
  { label: 'Mi Pedido', dot: 'text' },
];

// Mockup REALISTA de la home conversacional completa estilo Agent OS,
// renderizado con los tokens de cada dirección y su thema (light/dark).
export default function BrandHomeMockup({ palette, tipografia, radios, sombras, mode }) {
  if (!palette) return null;

  const titular = tipografia?.titular || 'inherit';
  const cuerpo = tipografia?.cuerpo || 'inherit';
  const rMd = radios?.md || '16px';
  const rLg = radios?.lg || '26px';
  const isDark = mode === 'dark';

  const glow = isDark
    ? `0 0 0 1px ${palette.accent}22, 0 0 40px -8px ${palette.accent}55`
    : `0 0 0 1px ${palette.accent}1a, 0 14px 36px -18px ${palette.accent}66`;

  const dotColor = (k) => (k === 'accent' ? palette.accent : k === 'accent2' ? palette.accent2 : palette.muted);

  const stats = [
    { icon: Droplets, num: '12.000', label: 'botellas rescatadas' },
    { icon: Recycle, num: '500.000 kg', label: 'reciclados' },
    { icon: Star, num: '4.9', label: '500+ reseñas' },
    { icon: ShieldCheck, num: '10 años', label: 'garantía' },
  ];

  return (
    <div
      className="w-full overflow-hidden relative transition-colors duration-300"
      style={{
        background: isDark
          ? `radial-gradient(130% 90% at 50% 0%, ${palette.surface} 0%, ${palette.bg} 55%)`
          : palette.bg,
        borderRadius: rLg,
        color: palette.text,
      }}
    >
      {/* Glows ambientales (Warm Dusk vibe) */}
      {isDark && (
        <>
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: `${palette.accent}33` }} />
          <div className="absolute top-20 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: `${palette.accent2}26` }} />
        </>
      )}

      {/* 1. BARRA SUPERIOR */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: `${palette.muted}26`, background: isDark ? `${palette.surface}99` : `${palette.surface}cc` }}
      >
        <div className="flex items-center gap-1 flex-shrink-0">
          <img src={PEYU_LOGO} alt="PEYU" className="h-4 w-auto object-contain" style={isDark ? { filter: 'brightness(0) invert(1)' } : undefined} />
        </div>
        <div className="flex items-center gap-2 overflow-hidden flex-1 px-1">
          {NAV_ITEMS.map((it) => (
            <span key={it.label} className="flex items-center gap-1 text-[7px] font-medium whitespace-nowrap" style={{ color: palette.muted, fontFamily: cuerpo }}>
              <span className="w-1 h-1 rounded-full" style={{ background: dotColor(it.dot) }} />
              {it.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: palette.accent, color: palette.bg }}>La Nave</span>
          <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${palette.muted}26` }}>
            {isDark ? <Moon className="w-2 h-2" style={{ color: palette.text }} /> : <Sun className="w-2 h-2" style={{ color: palette.text }} />}
          </span>
          <span className="w-4 h-4 rounded-full" style={{ background: palette.accent2 }} />
        </div>
      </div>

      <div className="relative flex">
        {/* 2. COLUMNA IZQUIERDA — anfitrión Peyu */}
        <div className="flex flex-col items-center gap-2 py-3 px-1.5 border-r flex-shrink-0" style={{ borderColor: `${palette.muted}1f` }}>
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] ring-2" style={{ background: palette.surface, ringColor: palette.accent, boxShadow: `0 0 0 1.5px ${palette.accent}` }}>🐢</span>
          <span className="text-[6px] font-bold tracking-wider" style={{ color: palette.accent }}>LISTO</span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
        </div>

        {/* 3. CENTRO protagonista */}
        <div className="flex-1 flex flex-col items-center text-center px-3 py-4 min-w-0">
          {/* Orb Peyu */}
          <div className="relative mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: isDark ? palette.surface : palette.bg, boxShadow: glow }}
            >🐢</div>
          </div>

          {/* Badge PEYU · LISTO */}
          <span className="text-[7px] font-bold tracking-[0.18em] px-2 py-0.5 rounded-full mb-2" style={{ background: `${palette.accent}1f`, color: palette.accent, fontFamily: cuerpo }}>
            PEYU · LISTO
          </span>

          {/* Título gigante */}
          <h2 className="text-2xl leading-none font-bold" style={{ fontFamily: titular, color: palette.text }}>
            PEYU
          </h2>
          <p className="text-base leading-tight font-bold mt-0.5" style={{ fontFamily: titular, color: palette.text }}>
            Regalos que cuentan una historia
          </p>

          {/* Subtítulo mayúsculas espaciadas */}
          <p className="text-[7px] font-semibold tracking-[0.2em] mt-1.5" style={{ color: palette.muted, fontFamily: cuerpo }}>
            REGALOS SOSTENIBLES, CONVERSANDO
          </p>

          {/* Pill acento */}
          <span className="inline-flex items-center gap-1 text-[7px] font-bold tracking-wide px-2 py-0.5 rounded-full mt-2" style={{ background: palette.accent2, color: palette.bg, fontFamily: cuerpo }}>
            ♻️ 100% RECICLADO · HECHO EN CHILE
          </span>

          {/* Línea descriptiva */}
          <p className="text-[8px] leading-snug mt-2 max-w-[200px]" style={{ color: palette.muted, fontFamily: cuerpo }}>
            Conversa con Peyu y encuentra el regalo perfecto — productos reales aparecen en el chat.
          </p>

          {/* INPUT conversacional protagonista */}
          <div
            className="w-full max-w-[230px] mt-3 flex items-center gap-1.5 px-2 py-1.5"
            style={{ background: isDark ? palette.surface : palette.bg, borderRadius: 999, boxShadow: glow }}
          >
            <Mic className="w-3 h-3 flex-shrink-0" style={{ color: palette.muted }} />
            <span className="flex-1 text-[7px] text-left truncate" style={{ color: palette.muted, fontFamily: cuerpo }}>
              Pídeme un regalo… (ej: para mi mamá, hasta $20.000)
            </span>
            <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: palette.accent }}>
              <ArrowUp className="w-3 h-3" style={{ color: palette.bg }} />
            </span>
          </div>

          {/* 4. CARDS VIVAS */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 px-1 py-2"
                  style={{ background: isDark ? `${palette.surface}cc` : palette.surface, borderRadius: rMd, border: `1px solid ${palette.muted}1f` }}
                >
                  <Icon className="w-3 h-3" style={{ color: palette.accent }} />
                  <span className="text-[8px] font-bold leading-none" style={{ fontFamily: titular, color: palette.text }}>{s.num}</span>
                  <span className="text-[6px] leading-tight text-center" style={{ color: palette.muted, fontFamily: cuerpo }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PEYU_LOGO };
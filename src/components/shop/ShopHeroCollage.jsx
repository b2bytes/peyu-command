import { useMemo, useState } from 'react';
import { Recycle } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

// Fallback editorial: imagen real de producto PEYU en el CDN base44, siempre
// disponible. Garantiza que el hero NUNCA se vea vacío aunque la BD esté
// cargando o un CDN legacy esté caído.
const HERO_FALLBACK_IMG = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/5d536f7a4_generated_image.png';

/**
 * ShopHeroCollage — Hero editorial Liquid Dual del Shop (v2 · premium).
 *
 * Mejoras v2 (mayo 2026):
 * • Cards del carrusel lateral con tratamiento uniforme y aire premium.
 * • Thumbs de productos más grandes (56px) con bordes refinados.
 * • Hover lift sutil en cada card secundaria.
 * • Card "Plástico recuperado" y "Catálogo 61" rediseñadas para que pertenezcan
 *   al mismo sistema de las cards de productos (consistencia visual).
 * • Badge "Hecho en Santiago" con marker verde más editorial.
 * • Foto destacada: ratio refinado + sombra direccional + mejor breathing.
 */
export default function ShopHeroCollage({ productos = [] }) {
  // Si la imagen del producto seleccionado falla (CDN caído / 404), cambiamos
  // a la imagen fallback editorial. Evita el contenedor blanco del bug visual.
  const [imgFailed, setImgFailed] = useState(false);

  // Selección curada: representantes de distintas categorías para máxima diversidad.
  const seleccion = useMemo(() => {
    const conImagen = productos.filter(p => !!getProductImage(p));
    const ordenCategorias = ['Escritorio', 'Hogar', 'Corporativo', 'Entretenimiento', 'Carcasas B2C'];
    const elegidos = [];
    const usados = new Set();

    for (const cat of ordenCategorias) {
      const candidato = conImagen.find(p => p.categoria === cat && !usados.has(p.id));
      if (candidato) {
        elegidos.push(candidato);
        usados.add(candidato.id);
      }
      if (elegidos.length === 4) break;
    }

    if (elegidos.length < 4) {
      for (const p of conImagen) {
        if (usados.has(p.id)) continue;
        elegidos.push(p);
        usados.add(p.id);
        if (elegidos.length === 4) break;
      }
    }

    return elegidos;
  }, [productos]);

  const [hero, ...secundarios] = seleccion;
  const totalActivos = productos.length;

  return (
    <div className="relative h-[340px] sm:h-[440px] lg:h-[540px]">
      {/* Glows ambient — refinados, menos saturados */}
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'var(--ld-action-soft)', opacity: 0.45 }}
      />
      <div
        aria-hidden
        className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'var(--ld-highlight-soft)', opacity: 0.35 }}
      />

      {/* ═════════ PIEZA HERO — producto principal ═════════
          Capas: blur ambient + gradiente firma + imagen nítida + viñetas
          editoriales. Ratio refinado: el contenedor crece hacia la derecha
          dejando aire a la izquierda para las cards secundarias. */}
      <div className="absolute inset-y-0 right-0 w-[92%] sm:w-[80%] rounded-[28px] overflow-hidden ld-card shadow-[0_30px_80px_-30px_rgba(2,6,23,0.45)]">
        {(() => {
          const heroSrc = hero && !imgFailed ? getProductImage(hero) : HERO_FALLBACK_IMG;
          return (
            <>
              {/* Capa 1 — imagen ampliada y difuminada de fondo (ambient) */}
              <img
                src={heroSrc}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-75"
                loading="eager"
                onError={() => setImgFailed(true)}
              />
              {/* Capa 2 — gradiente firma sobre el blur */}
              <div
                aria-hidden
                className="absolute inset-0 mix-blend-soft-light"
                style={{
                  background:
                    'linear-gradient(135deg, var(--ld-action-soft) 0%, transparent 50%, var(--ld-highlight-soft) 100%)',
                }}
              />
              {/* Capa 3 — viñeta editorial para enfocar al centro y dar legibilidad
                  a las etiquetas. Top y bottom oscurecidos sutilmente. */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(2,6,23,0.18) 0%, transparent 22%, transparent 70%, rgba(2,6,23,0.42) 100%)',
                }}
              />
              {/* Capa 4 — imagen real del producto, nítida y centrada con drop-shadow */}
              <img
                src={heroSrc}
                alt={hero ? `${hero.nombre} · PEYU Chile` : 'Catálogo PEYU Chile'}
                className="relative w-full h-full object-contain p-8 sm:p-12 lg:p-14"
                loading="eager"
                fetchpriority="high"
                style={{ filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.35))' }}
              />
            </>
          );
        })()}

        {/* Badge "Hecho en Santiago" — marker editorial refinado */}
        <div className="absolute top-5 right-5 z-10">
          <div className="ld-glass-strong rounded-full pl-2 pr-3.5 py-1.5 flex items-center gap-2 shadow-lg">
            <span className="relative flex items-center justify-center w-2 h-2">
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ background: 'var(--ld-action)' }}
              />
              <span
                className="relative w-2 h-2 rounded-full"
                style={{ background: 'var(--ld-action)' }}
              />
            </span>
            <span className="text-[10px] font-bold text-ld-fg tracking-[0.16em] uppercase">
              Hecho en Santiago
            </span>
          </div>
        </div>

        {/* Pieza editorial inferior — nombre del hero product */}
        {hero && (
          <div className="absolute bottom-5 left-5 right-5 z-10 text-white drop-shadow-lg">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-95 mb-1.5">
              Destacado · {hero.categoria}
            </p>
            <p className="ld-display text-xl sm:text-2xl leading-[1.05] line-clamp-2 max-w-[88%]">
              {hero.nombre}
            </p>
          </div>
        )}
      </div>

      {/* ═════════ COLLAGE SECUNDARIO LATERAL ═════════
          Pila de cards uniforme — cada una un mini-producto destacado.
          Hover lift sutil para sensación interactiva premium. */}
      <div className="absolute top-4 lg:-left-3 left-0 hidden md:flex flex-col gap-2.5 z-10 max-w-[230px]">
        {/* Card "Plástico recuperado" — abre la pila con el value-prop */}
        <SidecardValueProp />

        {/* Cards de producto */}
        {secundarios.slice(0, 3).map((p) => (
          <SidecardProduct key={p.id} producto={p} />
        ))}
      </div>

      {/* ═════════ Card catálogo (bottom-left) — mismo lenguaje ═════════ */}
      <div className="absolute bottom-5 left-0 lg:-left-3 hidden sm:block z-10">
        <div className="ld-glass-strong rounded-2xl p-3.5 w-44 shadow-lg">
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.22em] mb-1.5"
            style={{ color: 'var(--ld-action)' }}
          >
            Catálogo
          </p>
          <p className="ld-display text-[34px] text-ld-fg leading-none">
            {totalActivos || '50+'}
          </p>
          <p className="text-[11px] text-ld-fg-muted mt-1.5 leading-snug">
            productos sostenibles activos
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

/** Card "Plástico recuperado" — value-prop con el mismo formato que las
 *  cards de producto: icono cuadrado verde + título + sub. Uniformidad total. */
function SidecardValueProp() {
  return (
    <div className="ld-glass-strong rounded-2xl p-2 pr-3 flex items-center gap-2.5 shadow-lg">
      <div
        className="w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--ld-grad-action)' }}
      >
        <Recycle className="w-5 h-5 text-white" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 py-0.5">
        <p className="text-[12.5px] font-bold text-ld-fg leading-tight">
          Plástico recuperado
        </p>
        <p className="text-[10.5px] text-ld-fg-muted leading-snug mt-0.5">
          de océanos y rellenos
        </p>
      </div>
    </div>
  );
}

/** Card de producto secundario — thumb + categoría + nombre limpio.
 *  Hover lift suave para sensación premium e invitar a la interacción. */
function SidecardProduct({ producto: p }) {
  return (
    <div className="ld-glass-strong rounded-2xl p-2 pr-3 flex items-center gap-2.5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl group">
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-white/95 ring-1 ring-ld-border">
        <img
          src={getProductImage(p)}
          alt={p.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 py-0.5">
        <p
          className="text-[9.5px] font-bold uppercase tracking-[0.18em] leading-none"
          style={{ color: 'var(--ld-action)' }}
        >
          {p.categoria}
        </p>
        <p className="text-[12.5px] font-bold text-ld-fg leading-tight mt-1 line-clamp-2">
          {p.nombre.split('|')[0].trim()}
        </p>
      </div>
    </div>
  );
}
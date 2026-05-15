import { useEffect, useMemo, useState } from 'react';
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
  const [imgFailed, setImgFailed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  // Selección curada: una rotación más larga (8) para que el carrusel tenga
  // recorrido visual. Diversificada por categoría para que se sienta amplio.
  const pool = useMemo(() => {
    const conImagen = productos.filter(p => !!getProductImage(p));
    const ordenCategorias = ['Escritorio', 'Hogar', 'Corporativo', 'Entretenimiento', 'Carcasas B2C'];
    const elegidos = [];
    const usados = new Set();

    // Round-robin por categoría para máxima diversidad
    let safetyPass = 0;
    while (elegidos.length < 8 && safetyPass < 4) {
      for (const cat of ordenCategorias) {
        const candidato = conImagen.find(
          p => p.categoria === cat && !usados.has(p.id)
        );
        if (candidato) {
          elegidos.push(candidato);
          usados.add(candidato.id);
          if (elegidos.length >= 8) break;
        }
      }
      safetyPass++;
    }
    if (elegidos.length < 8) {
      for (const p of conImagen) {
        if (usados.has(p.id)) continue;
        elegidos.push(p);
        usados.add(p.id);
        if (elegidos.length >= 8) break;
      }
    }
    return elegidos;
  }, [productos]);

  // Auto-rotación cada 3s. Solo si hay 2+ items.
  useEffect(() => {
    if (pool.length < 2) return;
    const id = setInterval(() => {
      setActiveIdx(i => (i + 1) % pool.length);
      setImgFailed(false);
    }, 3000);
    return () => clearInterval(id);
  }, [pool.length]);

  // Hero rota; las 3 cards laterales son los próximos 3 productos.
  const hero = pool[activeIdx];
  const secundarios = useMemo(() => {
    if (pool.length < 2) return [];
    return [1, 2, 3].map(o => pool[(activeIdx + o) % pool.length]).filter(Boolean);
  }, [pool, activeIdx]);
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

      {/* ═════════ PIEZA HERO — producto principal (editorial, sin padding feo) ═════════
          Pasamos de object-contain con padding-gigante (que dejaba al producto
          flotando aislado y ridículo) a un layout editorial:
          • La imagen ocupa el contenedor con object-cover, crop centrado.
          • Encima, gradientes oscuros top→bottom para legibilidad del título.
          • El título queda en la parte inferior izquierda con safe-area que
            evita choque con la card de catálogo (que está en bottom -left). */}
      <div className="absolute inset-y-0 right-0 w-[92%] sm:w-[80%] rounded-[28px] overflow-hidden ld-card shadow-[0_30px_80px_-30px_rgba(2,6,23,0.45)]">
        {(() => {
          const heroSrc = hero && !imgFailed ? getProductImage(hero) : HERO_FALLBACK_IMG;
          return (
            <>
              {/* Capa única — imagen real cubriendo todo el contenedor.
                  Transición suave al cambiar de producto cada 3s. */}
              <img
                key={hero?.id || 'fallback'}
                src={heroSrc}
                alt={hero ? `${hero.nombre} · PEYU Chile` : 'Catálogo PEYU Chile'}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out"
                loading="eager"
                fetchpriority="high"
                onError={() => setImgFailed(true)}
                style={{ animation: 'peyuHeroFadeIn 700ms ease-out' }}
              />
              {/* Gradiente editorial — oscurece bordes para enmarcar el producto
                  y dar legibilidad al título inferior. Más oscuro abajo. */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(2,6,23,0.25) 0%, transparent 28%, transparent 55%, rgba(2,6,23,0.78) 100%)',
                }}
              />
              {/* Highlight verde sutil arriba para dar firma de marca */}
              <div
                aria-hidden
                className="absolute inset-0 mix-blend-soft-light pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, var(--ld-action-soft) 0%, transparent 35%)',
                }}
              />
              {/* Keyframes locales para el fade-in al rotar producto */}
              <style>{`
                @keyframes peyuHeroFadeIn {
                  from { opacity: 0; transform: scale(1.04); }
                  to   { opacity: 1; transform: scale(1); }
                }
              `}</style>
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

        {/* Pieza editorial inferior — título del hero product.
            Lo movemos a la DERECHA dentro del contenedor para que la card
            "Catálogo 61" (que vive en bottom-left, fuera de este contenedor
            pero se superpone visualmente) NO tape el título. */}
        {hero && (
          <div className="absolute bottom-5 right-5 left-[40%] sm:left-[38%] z-10 text-white drop-shadow-lg">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-95 mb-1.5">
              Destacado · {hero.categoria}
            </p>
            <p className="ld-display text-lg sm:text-xl lg:text-2xl leading-[1.05] line-clamp-2">
              {hero.nombre}
            </p>
          </div>
        )}

        {/* Dots indicator del carrusel — abajo a la izquierda dentro del
            contenedor hero, en el espacio que dejó libre el título. */}
        {pool.length > 1 && (
          <div className="absolute bottom-6 left-5 z-10 flex items-center gap-1.5">
            {pool.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => { setActiveIdx(i); setImgFailed(false); }}
                className="transition-all duration-300"
                aria-label={`Producto ${i + 1}`}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    i === activeIdx ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
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
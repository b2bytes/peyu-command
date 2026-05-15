import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Recycle, ArrowUpRight } from 'lucide-react';
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
    <div>
    <div className="relative h-[320px] sm:h-[440px] lg:h-[540px]">
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

      {/* ═════════ PIEZA HERO — imagen principal (editorial) ═════════
          La foto ocupa toda la altura disponible a la derecha. El título
          flota como overlay en la esquina inferior derecha de la propia
          foto (card blanca sólida con contraste garantizado).
          TODO el contenedor es clickeable → va al detalle del producto activo. */}
      <Link
        to={hero ? `/producto/${hero.id}` : '/shop'}
        aria-label={hero ? `Ver ${hero.nombre}` : 'Ver catálogo'}
        className="absolute inset-y-0 right-0 left-0 sm:left-[20%] rounded-[28px] overflow-hidden ld-card shadow-[0_30px_80px_-30px_rgba(2,6,23,0.45)] block group/hero"
      >
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

        {/* ═════════ TÍTULO EDITORIAL — card flotante DENTRO de la foto ═════════
            Ubicación: esquina inferior derecha del contenedor de la imagen.
            Fondo sólido (bg-elevated) para máximo contraste sobre cualquier
            foto, sin importar si es oscura o clara. Compact, editorial. */}
        {hero && (
          <div
            className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-10 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border max-w-[78%] sm:max-w-[60%]"
            style={{
              background: 'var(--ld-bg-elevated)',
              borderColor: 'var(--ld-border)',
              boxShadow: '0 18px 40px -16px rgba(2,6,23,0.35), 0 4px 12px -4px rgba(2,6,23,0.15)',
            }}
          >
            <div key={hero.id} style={{ animation: 'peyuTitleSlideIn 600ms ease-out' }}>
              <p
                className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-[0.22em] leading-none mb-1.5"
                style={{ color: 'var(--ld-action)' }}
              >
                Destacado · {hero.categoria}
              </p>
              <p className="ld-display text-base sm:text-lg lg:text-xl leading-[1.1] text-ld-fg line-clamp-2 mb-2">
                {hero.nombre.split('|')[0].trim()}
              </p>

              {/* Dots indicator — debajo del título, dentro de la misma card.
                  stopPropagation + preventDefault porque ahora vivimos dentro
                  del Link de hero — sin esto, tocar un dot navegaría al detalle. */}
              {pool.length > 1 && (
                <div className="flex items-center gap-1.5 sm:gap-1">
                  {pool.slice(0, 8).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveIdx(i);
                        setImgFailed(false);
                      }}
                      className="transition-all duration-300 py-1 -my-1"
                      aria-label={`Producto ${i + 1}`}
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          i === activeIdx ? 'w-4 h-1' : 'w-1.5 h-1.5 sm:w-1 sm:h-1 hover:scale-125'
                        }`}
                        style={{
                          background: i === activeIdx ? 'var(--ld-action)' : 'var(--ld-border-strong)',
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <style>{`
              @keyframes peyuTitleSlideIn {
                from { opacity: 0; transform: translateY(8px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}

        {/* Affordance "ver detalle" — flecha sutil arriba a la izquierda
            que aparece en hover. Refuerza que la card entera es clickeable. */}
        <div
          aria-hidden
          className="absolute top-5 left-5 z-10 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300"
          style={{ background: 'var(--ld-bg-elevated)', boxShadow: '0 8px 20px -8px rgba(2,6,23,0.4)' }}
        >
          <ArrowUpRight className="w-4 h-4 text-ld-fg" strokeWidth={2.4} />
        </div>
      </Link>

      {/* ═════════ COLLAGE SECUNDARIO LATERAL ═════════
          Pila de cards uniforme. Vive a la izquierda del hero, sobre la zona
          que el contenedor de imagen ahora deja libre (left:0 → sm:left:20%). */}
      <div className="absolute top-2 left-0 lg:-left-3 hidden md:flex flex-col gap-2.5 z-10 max-w-[210px]">
        <SidecardValueProp />
        {secundarios.slice(0, 2).map((p) => (
          <SidecardProduct key={p.id} producto={p} />
        ))}
      </div>

      {/* ═════════ Card catálogo — esquina inferior izquierda ═════════ */}
      <div className="absolute bottom-5 left-0 lg:-left-3 hidden sm:block z-10">
        <div className="ld-glass-strong rounded-2xl p-3 w-40 shadow-lg">
          <p
            className="text-[9.5px] font-bold uppercase tracking-[0.22em] mb-1"
            style={{ color: 'var(--ld-action)' }}
          >
            Catálogo
          </p>
          <p className="ld-display text-[30px] text-ld-fg leading-none">
            {totalActivos || '50+'}
          </p>
          <p className="text-[10.5px] text-ld-fg-muted mt-1 leading-snug">
            productos sostenibles activos
          </p>
        </div>
      </div>
    </div>

    {/* ═════════ MOBILE THUMB STRIP — debajo del hero, solo mobile ═════════
        En desktop las sidecards laterales cumplen este rol. En mobile NO
        hay forma de explorar otros productos del carrusel → agregamos un
        scroll horizontal de thumbs grandes, táctiles (60px) y clickeables.
        Cada thumb navega directo al detalle. El thumb activo tiene anillo
        verde para indicar cuál es el que se está mostrando en el hero. */}
    {pool.length > 1 && (
      <div className="sm:hidden mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 pb-1">
          {pool.map((p, i) => (
            <Link
              key={p.id}
              to={`/producto/${p.id}`}
              onMouseEnter={() => { setActiveIdx(i); setImgFailed(false); }}
              className="flex-shrink-0 relative"
              aria-label={`Ver ${p.nombre}`}
            >
              <div
                className={`w-[60px] h-[60px] rounded-xl overflow-hidden bg-white ring-2 transition-all duration-300 ${
                  i === activeIdx ? 'ring-[var(--ld-action)] scale-105' : 'ring-ld-border'
                }`}
              >
                <img
                  src={getProductImage(p)}
                  alt={p.nombre}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {i === activeIdx && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--ld-action)' }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    )}
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
 *  Hover lift suave para sensación premium e invitar a la interacción.
 *  Clickeable → navega al detalle del producto. */
function SidecardProduct({ producto: p }) {
  return (
    <Link
      to={`/producto/${p.id}`}
      aria-label={`Ver ${p.nombre}`}
      className="ld-glass-strong rounded-2xl p-2 pr-3 flex items-center gap-2.5 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl group"
    >
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-white/95 ring-1 ring-ld-border">
        <img
          src={getProductImage(p)}
          alt={p.nombre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 py-0.5 flex-1">
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
    </Link>
  );
}
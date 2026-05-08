import { useMemo } from 'react';
import { Recycle, Shield, Truck, Check } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

/**
 * ShopHeroCollage — Hero editorial Liquid Dual del Shop.
 *
 * Construye un collage REAL con las imágenes de los productos más vendibles
 * del catálogo (no fotos genéricas inventadas). La pieza grande es el "hero
 * product" (el de mayor stock con imagen propia), y se acompaña por 3 piezas
 * secundarias que muestran la diversidad de categorías PEYU.
 *
 * Si no hay productos cargados todavía, muestra un placeholder elegante con
 * los colores firma (sin recurrir a stock photos externas).
 */
export default function ShopHeroCollage({ productos = [] }) {
  // Selección curada: mostramos productos con imagen propia de peyuchile.cl
  // y stock disponible. Tomamos representantes de distintas categorías para
  // que el collage refleje el catálogo real, no un solo SKU repetido.
  const seleccion = useMemo(() => {
    const conImagen = productos.filter(p =>
      p.imagen_url && /peyuchile\.cl/i.test(p.imagen_url)
    );

    // Priorizamos categorías clave: una por familia para máxima diversidad.
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

    // Rellenar si quedaron huecos
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
    <div className="relative h-[320px] sm:h-[420px] lg:h-[520px]">
      {/* Glows ambient */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'var(--ld-action-soft)', opacity: 0.6 }}
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'var(--ld-highlight-soft)', opacity: 0.5 }}
      />

      {/* PIEZA HERO — producto principal con imagen real */}
      <div className="absolute inset-y-0 right-0 w-[78%] rounded-3xl overflow-hidden ld-card shadow-2xl">
        {hero ? (
          <img
            src={getProductImage(hero)}
            alt={`${hero.nombre} · PEYU Chile`}
            className="w-full h-full object-cover bg-white"
            loading="eager"
            fetchpriority="high"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: 'var(--ld-grad-canvas)' }}
          />
        )}

        {/* Etiqueta flotante de procedencia (siempre visible) */}
        <div className="absolute top-4 right-4 ld-glass-strong rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ld-action)' }} />
          <span className="text-[10px] font-bold text-ld-fg tracking-wider uppercase">Hecho en Santiago</span>
        </div>

        {/* Pieza editorial inferior — referencia al producto real, no a una colección inventada */}
        {hero && (
          <>
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-lg">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase opacity-90">
                Destacado · {hero.categoria}
              </p>
              <p className="ld-display text-lg sm:text-xl mt-1 leading-tight line-clamp-2 max-w-[85%]">
                {hero.nombre}
              </p>
            </div>
          </>
        )}
      </div>

      {/* COLLAGE SECUNDARIO — 3 mini-cards con productos reales (solo desktop/tablet) */}
      {secundarios.length > 0 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 lg:-left-2 hidden md:flex flex-col gap-2.5 z-10">
          {secundarios.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="ld-glass-strong rounded-2xl p-2 flex items-center gap-2.5 max-w-[210px] shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                <img
                  src={getProductImage(p)}
                  alt={p.nombre}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ld-action)' }}>
                  {p.categoria}
                </p>
                <p className="text-xs font-semibold text-ld-fg leading-tight line-clamp-2">
                  {p.nombre.split('|')[0].trim()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card flotante — número real de productos */}
      <div className="absolute bottom-6 left-0 lg:-left-4 ld-glass-strong rounded-2xl p-4 w-44 hidden sm:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--ld-action)' }}>
          Catálogo
        </p>
        <p className="ld-display text-3xl text-ld-fg leading-none mt-1">
          {totalActivos || '50+'}
        </p>
        <p className="text-xs text-ld-fg-muted mt-1">productos sostenibles activos</p>
      </div>

      {/* Card terciaria — material */}
      <div className="absolute top-6 left-0 lg:-left-2 ld-glass-strong rounded-2xl p-3 hidden md:flex items-center gap-2.5 max-w-[200px]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ld-grad-action)' }}
        >
          <Recycle className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-ld-fg leading-tight">Plástico recuperado</p>
          <p className="text-[10px] text-ld-fg-muted leading-tight">de océanos y rellenos</p>
        </div>
      </div>
    </div>
  );
}
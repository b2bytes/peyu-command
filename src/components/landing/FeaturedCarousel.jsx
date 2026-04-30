import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Loader2, Leaf, Recycle, Award, ShoppingCart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';

/**
 * Carrusel de productos destacados — full-bleed, productos REALES únicos.
 *
 * Diseño:
 * - Imagen ocupa todo el alto disponible (object-cover, sin aspect-square fijo)
 * - Info como overlay glass flotante en la parte inferior
 * - Sin productos repetidos (deduplica por id, máx 1 por categoría hasta agotar)
 * - Mini-thumbnails de los próximos 4 productos
 * - Auto-rotación 5s con barra de progreso
 * - Tap en thumbnail salta directo
 */
export default function FeaturedCarousel() {
  const [productos, setProductos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.list('-precio_b2c', 80).then(data => {
      if (!alive) return;
      // Filtrar válidos para el carrusel
      const validos = data.filter(p =>
        p.activo !== false &&
        p.canal !== 'B2B Exclusivo' &&
        p.precio_b2c > 0 &&
        p.imagen_url &&
        !String(p.sku || '').toUpperCase().startsWith('GC-PEYU')
      );

      // Diversificar: round-robin por categoría → garantiza variedad real
      // Ej: con 5 categorías, los primeros 5 productos son de 5 categorías distintas
      const porCategoria = new Map();
      validos.forEach(p => {
        const cat = p.categoria || 'Otros';
        if (!porCategoria.has(cat)) porCategoria.set(cat, []);
        porCategoria.get(cat).push(p);
      });
      const round = [];
      const cats = Array.from(porCategoria.keys());
      let pos = 0;
      while (round.length < 12) {
        let agregado = false;
        for (const cat of cats) {
          const lista = porCategoria.get(cat);
          if (lista[pos]) {
            round.push(lista[pos]);
            agregado = true;
            if (round.length >= 12) break;
          }
        }
        if (!agregado) break;
        pos++;
      }

      // Dedup defensivo por id
      const seen = new Set();
      const unicos = round.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setProductos(unicos);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  // Auto-rotar con barra de progreso (50ms tick → 5s = 100 ticks)
  useEffect(() => {
    if (productos.length < 2) return;
    setProgress(0);
    const tick = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIdx(i => (i + 1) % productos.length);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(tick);
  }, [productos.length, idx]);

  const goTo = (newIdx) => { setIdx(newIdx); setProgress(0); };
  const next = () => goTo((idx + 1) % productos.length);
  const prev = () => goTo((idx - 1 + productos.length) % productos.length);

  // Próximos 4 productos para thumbnails (saltando el actual)
  const upcoming = useMemo(() => {
    if (productos.length < 2) return [];
    return Array.from({ length: Math.min(4, productos.length - 1) }, (_, i) =>
      productos[(idx + i + 1) % productos.length]
    );
  }, [productos, idx]);

  if (loading) {
    return (
      <div className="peyu-liquid-glass w-full rounded-2xl p-4 flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <Link to="/shop" className="peyu-liquid-glass w-full rounded-2xl p-6 flex flex-col items-center justify-center h-full text-white/70 text-center text-sm">
        Explorar la tienda completa →
      </Link>
    );
  }

  const p = productos[idx];
  const imagen = getProductImage(p);
  const isCompostable = p.material === 'Fibra de Trigo (Compostable)';
  const productoUrl = `/producto/${p.id}`;

  return (
    <div className="peyu-liquid-glass w-full rounded-2xl flex flex-col h-full overflow-hidden relative group">
      {/* Barra de progreso (top) */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 z-30">
        <div
          className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header mini — destaca que son productos reales */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between flex-shrink-0 relative z-20">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white/85 tracking-widest uppercase">Destacados</span>
        </div>
        <span className="text-[10px] text-white/45 tabular-nums font-mono">
          {String(idx + 1).padStart(2, '0')} / {String(productos.length).padStart(2, '0')}
        </span>
      </div>

      {/* IMAGEN HERO — ocupa todo el alto disponible, full-bleed */}
      <Link to={productoUrl} className="relative flex-1 min-h-0 mx-2 mb-2 rounded-xl overflow-hidden block group/img">
        {/* Imagen */}
        <img
          key={p.id}
          src={imagen}
          alt={p.nombre}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover/img:scale-110"
          loading="lazy"
          onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
        />

        {/* Gradient inferior para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
        {/* Brillo superior sutil tipo glass */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-transparent pointer-events-none" />

        {/* Tags superiores */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2 z-10">
          <div className="flex flex-col gap-1.5">
            {isCompostable ? (
              <span className="bg-emerald-500/95 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1">
                <Leaf className="w-2.5 h-2.5" /> Compostable
              </span>
            ) : (
              <span className="bg-cyan-500/95 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1">
                <Recycle className="w-2.5 h-2.5" /> 100% Reciclado
              </span>
            )}
            <span className="bg-amber-500/95 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1 self-start">
              <Award className="w-2.5 h-2.5" /> Garantía 10 años
            </span>
          </div>
          {p.categoria && (
            <span className="bg-black/60 text-white text-[9px] font-semibold px-2 py-1 rounded-full backdrop-blur-md shadow-lg">
              {p.categoria}
            </span>
          )}
        </div>

        {/* Info overlay inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400 drop-shadow" />
              ))}
            </div>
            <span className="text-yellow-300 font-bold text-[11px] drop-shadow">5.0</span>
            <span className="text-white/70 text-[9px]">· peyuchile.cl</span>
          </div>

          {/* Nombre */}
          <h3 className="text-white font-poppins font-bold text-sm leading-tight line-clamp-2 mb-2 drop-shadow-lg">
            {p.nombre}
          </h3>

          {/* Precio + CTA */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-white/65 text-[9px] uppercase tracking-wider font-semibold">Desde</p>
              <p className="text-white font-black text-2xl leading-none drop-shadow-lg">
                ${p.precio_b2c.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-full px-3 py-2 text-[10px] font-bold shadow-xl flex items-center gap-1.5 transition-all group-hover/img:scale-105">
              <ShoppingCart className="w-3 h-3" />
              Ver
            </div>
          </div>
        </div>

        {/* Flechas laterales — solo visibles en hover */}
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-teal-500/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-teal-500/80 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </Link>

      {/* Thumbnails de próximos productos — preview "lo que viene" */}
      {upcoming.length > 0 && (
        <div className="px-2 pb-2 flex gap-1.5 flex-shrink-0">
          {upcoming.map((u, i) => (
            <button
              key={u.id}
              onClick={() => goTo(productos.findIndex(x => x.id === u.id))}
              className="flex-1 aspect-square rounded-lg overflow-hidden border border-white/15 hover:border-teal-400/60 hover:scale-105 transition-all relative group/thumb"
              title={u.nombre}
              aria-label={`Ver ${u.nombre}`}
            >
              <img
                src={getProductImage(u)}
                alt={u.nombre}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => { e.target.style.opacity = '0.3'; }}
              />
              <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/0 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* CTA tienda completa */}
      <Link
        to="/shop"
        className="mx-2 mb-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-teal-500/25 border border-white/15 hover:border-teal-400/40 text-white text-[11px] font-semibold text-center transition-all flex-shrink-0 backdrop-blur-sm"
      >
        Ver tienda completa →
      </Link>
    </div>
  );
}
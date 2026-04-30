import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getProductImage } from '@/utils/productImages';

/**
 * Carrusel de productos destacados — usa productos REALES desde la BD
 * (sincronizados con peyuchile.cl). Auto-rota cada 4s y permite navegación manual.
 *
 * Se conecta a la entidad Producto y selecciona destacados:
 *   - activos
 *   - canal B2B + B2C o B2C Exclusivo
 *   - con imagen
 *   - prioriza productos de mayor precio (suelen ser packs/kits estrella)
 */
export default function FeaturedCarousel() {
  const [productos, setProductos] = useState([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    base44.entities.Producto.list('-precio_b2c', 50).then(data => {
      if (!alive) return;
      const destacados = data
        .filter(p =>
          p.activo !== false &&
          p.canal !== 'B2B Exclusivo' &&
          p.precio_b2c > 0 &&
          p.imagen_url &&
          // Excluir Gift Cards del carrusel — son producto digital, no físico
          !String(p.sku || '').toUpperCase().startsWith('GC-PEYU')
        )
        // Diversificar: mezclar categorías para que el carrusel no muestre 4 carcasas seguidas
        .reduce((acc, p) => {
          const yaTengoDeCategoria = acc.filter(x => x.categoria === p.categoria).length;
          if (yaTengoDeCategoria < 2) acc.push(p);
          return acc;
        }, [])
        .slice(0, 8);
      setProductos(destacados);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  // Auto-rotar
  useEffect(() => {
    if (productos.length < 2) return;
    const t = setInterval(() => {
      setIdx(prev => (prev + 1) % productos.length);
    }, 4000);
    return () => clearInterval(t);
  }, [productos.length]);

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
  // Compostable / fibra de trigo → tag distintivo
  const isCompostable = p.material === 'Fibra de Trigo (Compostable)';
  const productoUrl = `/producto/${p.id}`;

  return (
    <Link to={productoUrl} className="peyu-liquid-glass w-full rounded-2xl p-4 flex flex-col gap-3 hover:-translate-y-1 transition-all cursor-pointer group h-full">
      {/* Imagen */}
      <div className="w-full aspect-square bg-gradient-to-br from-yellow-300/40 via-orange-400/30 to-red-500/20 rounded-xl flex items-center justify-center shadow-xl overflow-hidden group-hover:shadow-2xl transition-all flex-shrink-0 relative">
        <img
          src={imagen}
          alt={p.nombre}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={e => { e.target.src = 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2025/04/carcasas-500x500-1.webp?fit=600%2C600&ssl=1'; }}
        />
        {isCompostable && (
          <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] font-bold px-2 py-1 rounded-full backdrop-blur-sm shadow-lg">
            🌱 Compostable
          </div>
        )}
        {p.categoria && (
          <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] font-semibold px-2 py-1 rounded-full backdrop-blur-sm">
            {p.categoria}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2.5 space-y-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-yellow-300 font-bold text-xs">5.0</span>
          <span className="text-white/50 text-[10px]">· Producto real</span>
        </div>
        <p className="text-white font-poppins font-bold text-sm leading-tight line-clamp-1 group-hover:text-cyan-300 transition-colors">
          {p.nombre}
        </p>
        <p className="text-white/60 text-[10px] leading-relaxed line-clamp-2">
          {isCompostable ? 'Fibra de trigo · Compostable' : 'Plástico 100% reciclado'} · Hecho en Chile · Garantía 10 años
        </p>
        <div className="flex items-baseline gap-1.5 pt-0.5 border-t border-white/15">
          <span className="text-white/60 text-[10px]">Desde</span>
          <span className="text-white font-black text-xl group-hover:text-teal-300 transition-colors">
            ${p.precio_b2c.toLocaleString('es-CL')}
          </span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-2 justify-between items-center flex-shrink-0">
        <button
          onClick={(e) => { e.preventDefault(); setIdx(prev => (prev - 1 + productos.length) % productos.length); }}
          className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1 items-center">
          {productos.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setIdx(i); }}
              className={`rounded-full transition-all ${
                i === idx ? 'w-2.5 h-2.5 bg-teal-400 shadow-lg' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Producto ${i + 1}`}
            />
          ))}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); setIdx(prev => (prev + 1) % productos.length); }}
          className="bg-white/20 hover:bg-teal-500/40 active:bg-teal-600/50 text-white p-1.5 rounded-lg transition-all hover:scale-110"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </Link>
  );
}
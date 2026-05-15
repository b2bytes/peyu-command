import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Check, Leaf, Recycle, Zap, ArrowRight } from 'lucide-react';
import { getProductImage } from '@/utils/productImages';

/**
 * Tarjeta de producto del Shop — diseño 2026 editorial Liquid Dual.
 *
 * Memoizada para evitar re-renders en scroll. Animación de entrada con
 * skeleton hasta que la imagen carga (evita layout shift y "flash").
 *
 * Features:
 * • Hover lift con sombra direccional verde PEYU.
 * • Ring verde sutil al hover (firma visual).
 * • Pill flotante de info técnica (material · personalización · lead time)
 *   visible solo en desktop al hover.
 * • Barra de acción contextual que emerge desde abajo con CTA "Ver →" + FAB quick-add.
 * • Indicador de stock bajo (urgencia editorial sutil).
 * • Precio B2B "desde" como hint sutil bajo el precio principal.
 */
function ProductCard({ producto, onAddToCart, agregandoId, index = 0 }) {
  const p = producto;
  const precio = p.precio_b2c || 9990;
  const isAdding = agregandoId === p.id;
  const [imgLoaded, setImgLoaded] = useState(false);

  // Stagger animation — primeros 12 productos animan en cascada
  const animDelay = index < 12 ? `${index * 40}ms` : '0ms';

  // Señales técnicas para la pill flotante
  const esCompostable = p.material?.includes('Trigo');
  const personalizable = (p.personalizacion_gratis_desde || 0) > 0;
  const leadTime = p.lead_time_sin_personal || 7;
  const stockBajo = p.stock_actual > 0 && p.stock_actual < 15;

  return (
    <Link
      to={`/producto/${p.id}`}
      style={{ animationDelay: animDelay }}
      className="peyu-card-enter ld-card group relative overflow-hidden transition-all duration-300 will-change-transform hover:-translate-y-1.5 active:scale-[0.98] hover:shadow-[0_24px_50px_-20px_rgba(15,139,108,0.28),0_8px_20px_-10px_rgba(2,6,23,0.18)] hover:border-[color:var(--ld-action)]/30"
    >
      {/* ═════════ IMAGEN ═════════ */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--ld-bg-soft)' }}>
        {!imgLoaded && (
          <div className="absolute inset-0 peyu-shimmer" aria-hidden="true" />
        )}
        <img
          src={getProductImage(p)}
          alt={`${p.nombre} · ${p.categoria || 'PEYU'} · ${esCompostable ? 'Fibra de trigo compostable' : 'Plástico 100% reciclado'} · Hecho en Chile`}
          width="600"
          height="600"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          style={{
            opacity: imgLoaded ? 1 : 0,
            color: 'transparent',
          }}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchpriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            // Guard anti-loop: si el fallback también falla, NO seguimos cambiando src
            if (e.target.dataset.fallbackTried === '1') {
              setImgLoaded(true);
              return;
            }
            e.target.dataset.fallbackTried = '1';
            e.target.src = 'https://images.unsplash.com/photo-1578432291840-8d3a3a016e4d?w=600&h=600&fit=crop';
            setImgLoaded(true);
          }}
        />

        {/* Gradiente sutil al hover — enmarca la barra de acción inferior */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(2,6,23,0.45) 100%)',
          }}
        />

        {/* ─── Badges esquina superior izquierda ─── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="ld-glass-strong text-ld-fg text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {p.categoria}
          </span>
          {esCompostable && (
            <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1" style={{ background: 'var(--ld-action)' }}>
              <Leaf className="w-2.5 h-2.5" /> Compostable
            </span>
          )}
        </div>

        {/* ─── Stock bajo: indicador editorial urgencia (esquina sup. derecha) ─── */}
        {stockBajo && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1"
              style={{ background: 'var(--ld-highlight)' }}
            >
              <Zap className="w-2.5 h-2.5" /> Últimas {p.stock_actual}
            </span>
          </div>
        )}

        {/* ─── INFO TÉCNICA DESPLEGABLE (hover-only, desktop) ─── */}
        <div
          className="hidden md:flex absolute left-3 right-12 bottom-14 z-10 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none"
          style={{ transitionDelay: '60ms' }}
        >
          <div className="ld-glass-strong rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 shadow-lg max-w-full overflow-hidden">
            <InfoChip
              icon={esCompostable ? Leaf : Recycle}
              label={esCompostable ? 'Trigo' : '100% reciclado'}
            />
            {personalizable && (
              <>
                <span className="w-px h-3" style={{ background: 'var(--ld-border-strong)' }} />
                <InfoChip icon={Zap} label={`Láser desde ${p.personalizacion_gratis_desde || 10}u`} />
              </>
            )}
            <span className="w-px h-3" style={{ background: 'var(--ld-border-strong)' }} />
            <InfoChip label={`${leadTime}d`} />
          </div>
        </div>

        {/* ─── BARRA DE ACCIÓN CONTEXTUAL ─── */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span
            className="hidden md:inline-flex ld-glass-strong rounded-full pl-3 pr-2 py-1.5 items-center gap-1 text-[11px] font-bold text-ld-fg shadow-md group-hover:gap-2 transition-all duration-300"
          >
            Ver
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.4} />
          </span>

          {/* Quick-add FAB */}
          <button
            onClick={(e) => onAddToCart(e, p)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg active:scale-90 ${
              isAdding ? 'scale-110' : 'ld-btn-primary'
            }`}
            style={isAdding ? { background: 'var(--ld-action)' } : undefined}
            aria-label="Agregar al carrito"
          >
            {isAdding ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ═════════ INFO ═════════ */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-[10px] text-ld-fg-muted font-medium hidden sm:inline">(4.9)</span>
        </div>
        <h3 className="font-semibold text-sm text-ld-fg line-clamp-2 leading-snug transition-colors min-h-[40px] group-hover:text-[color:var(--ld-action)]">
          {p.nombre}
        </h3>
        <div className="flex items-baseline justify-between mt-3">
          <p className="font-jakarta font-bold text-lg text-ld-fg leading-none">
            ${precio.toLocaleString('es-CL')}
          </p>
          {p.precio_500_mas && (
            <p className="text-[10px] text-ld-fg-muted font-medium">
              desde <span className="font-bold" style={{ color: 'var(--ld-action)' }}>${p.precio_500_mas.toLocaleString('es-CL')}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Chip mini de info técnica para la pill flotante (hover-only). */
function InfoChip({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-ld-fg whitespace-nowrap">
      {Icon && <Icon className="w-2.5 h-2.5" style={{ color: 'var(--ld-action)' }} />}
      {label}
    </span>
  );
}

export default memo(ProductCard, (prev, next) => {
  return (
    prev.producto.id === next.producto.id &&
    prev.index === next.index &&
    (prev.agregandoId === prev.producto.id) === (next.agregandoId === next.producto.id)
  );
});
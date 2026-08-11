import { Star } from 'lucide-react';

// Estrellas de calificación real de clientes (rating_promedio / rating_count
// del Producto, agregados por syncRatingProducto). No renderiza nada sin reseñas.
export default function ProductRatingStars({ promedio, count, size = 'sm' }) {
  if (!count || !promedio) return null;
  const px = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-1.5" title={`${promedio} de 5 · ${count} reseña${count > 1 ? 's' : ''}`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={px}
            strokeWidth={1.8}
            style={{ color: '#E8A33D', fill: s <= Math.round(promedio) ? '#E8A33D' : 'transparent' }}
          />
        ))}
      </div>
      <span className={size === 'lg' ? 'text-xs font-bold' : 'text-[10px] font-bold'} style={{ color: '#7A6050' }}>
        {promedio} ({count})
      </span>
    </div>
  );
}
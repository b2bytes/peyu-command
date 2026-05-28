// ============================================================================
// AnchorProductBanner · Recordatorio fijo del producto con el que el cliente
// llegó desde "Cotizar B2B". Se muestra en TODOS los pasos del embudo para que
// nunca pierda el contexto de lo que está cotizando. Onboarding premium 360°.
// ============================================================================
import { CheckCircle } from 'lucide-react';
import { getProductImage } from '@/utils/productImages.js';

export default function AnchorProductBanner({ producto, cantidadTotal, itemsCount = 1 }) {
  if (!producto) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.06] border border-teal-400/30 backdrop-blur-md">
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-white/15">
        <img
          src={getProductImage(producto)}
          alt={producto.nombre}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center shadow-lg ring-2 ring-slate-900">
          <CheckCircle className="w-3 h-3 text-slate-900" strokeWidth={3} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-teal-300 leading-none">
          Estás cotizando
        </p>
        <p className="text-sm font-bold text-white truncate mt-1 leading-tight">{producto.nombre}</p>
        <p className="text-[11px] text-white/55 mt-0.5">
          {producto.categoria}
          {itemsCount > 1 && <span className="text-teal-300 font-semibold"> · +{itemsCount - 1} más</span>}
          {cantidadTotal ? ` · ${cantidadTotal} u` : ''}
        </p>
      </div>
    </div>
  );
}
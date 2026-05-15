import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';

/**
 * CartBubble — Pill flotante con contador del carrito y CTA "Ir a pagar".
 *
 * UX 2026: cuando el usuario agrega productos pero el header del shop no
 * tiene un indicador visible del carrito, se siente como "voz en el vacío".
 * Esta bubble aparece bottom-right en mobile y bottom-center en desktop,
 * mostrando el total acumulado y un link directo a /cart.
 *
 * Se "anima" cada vez que el contador crece (pulse + scale) para confirmar
 * la acción de "agregar al carrito" de forma muy visible.
 *
 * No reemplaza al carrito del header — es complementario y solo visible
 * cuando hay items, evitando ruido cuando el carrito está vacío.
 */
export default function CartBubble({ cantidad, total }) {
  const [pulse, setPulse] = useState(false);
  const [prevCantidad, setPrevCantidad] = useState(cantidad);

  // Detecta crecimiento del carrito → dispara pulse animation
  useEffect(() => {
    if (cantidad > prevCantidad) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
    setPrevCantidad(cantidad);
  }, [cantidad, prevCantidad]);

  if (!cantidad || cantidad === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 pb-safe pointer-events-none">
      <Link
        to="/cart"
        className={`pointer-events-auto ld-btn-primary inline-flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-full shadow-2xl hover:shadow-[0_20px_50px_-15px_rgba(15,139,108,0.55)] transition-all duration-300 active:scale-95 ${
          pulse ? 'scale-110 animate-pulse' : 'scale-100'
        }`}
        style={{ boxShadow: '0 18px 40px -10px rgba(15,139,108,0.45), 0 4px 12px -4px rgba(2,6,23,0.25)' }}
        aria-label={`Ir al carrito · ${cantidad} producto${cantidad > 1 ? 's' : ''}`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 text-white" strokeWidth={2.2} />
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-[10px] font-black flex items-center justify-center tabular-nums" style={{ color: 'var(--ld-action)' }}>
            {cantidad > 99 ? '99+' : cantidad}
          </span>
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] text-white/85 font-semibold uppercase tracking-wider">Ir a pagar</span>
          <span className="text-sm font-bold text-white tabular-nums">
            ${(total || 0).toLocaleString('es-CL')}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/90 ml-0.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// CheckoutStepperV2 — Barra de progreso del flujo de compra B2C (Shop v2).
// Muestra los 4 pasos (Tienda · Producto · Carrito · Pago), resalta el actual,
// marca los completados con ✓ y permite volver a pasos previos haciendo clic.
// Diseño Warm Dusk, compacto, optimizado para escritorio (oculto en mobile).
// ════════════════════════════════════════════════════════════════════════
const PASOS = [
  { id: 'tienda',   label: 'Tienda',   to: '/CatalogoNuevo' },
  { id: 'producto', label: 'Producto', to: null },          // se navega vía ?id
  { id: 'carrito',  label: 'Carrito',  to: '/CarritoNuevo' },
  { id: 'pago',     label: 'Pago',     to: '/CheckoutNuevo' },
];

export default function CheckoutStepperV2({ current = 'tienda' }) {
  const idx = PASOS.findIndex((p) => p.id === current);

  return (
    <nav className="hidden md:flex items-center justify-center gap-1.5 mb-7" aria-label="Progreso de compra">
      {PASOS.map((p, i) => {
        const done = i < idx;
        const active = i === idx;
        const clickable = (done || active) && p.to;

        const inner = (
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
            active
              ? 'bg-[#0F8B6C] text-white shadow-sm'
              : done
                ? 'bg-[#0F8B6C]/10 text-[#0F8B6C]'
                : 'bg-white border border-[#EBE3D6] text-[#A78B6F]'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${
              active ? 'bg-white/20' : done ? 'bg-[#0F8B6C] text-white' : 'bg-[#FAF7F2] border border-[#EBE3D6]'
            }`}>
              {done ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            {p.label}
          </div>
        );

        return (
          <div key={p.id} className="flex items-center gap-1.5">
            {clickable ? <Link to={p.to}>{inner}</Link> : inner}
            {i < PASOS.length - 1 && (
              <span className={`w-6 h-px ${done ? 'bg-[#0F8B6C]/40' : 'bg-[#EBE3D6]'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
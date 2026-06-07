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
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all"
            style={{
              background: active ? '#C0785C' : done ? 'rgba(192,120,92,.1)' : 'white',
              color: active ? 'white' : done ? '#C0785C' : '#A08070',
              border: active ? 'none' : done ? '1.5px solid rgba(192,120,92,.25)' : '1.5px solid #D4C4B0',
              boxShadow: active ? '0 4px 16px rgba(192,120,92,.25)' : 'none',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px]"
              style={{
                background: active ? 'rgba(255,255,255,.2)' : done ? '#C0785C' : '#F2EBE1',
                color: done && !active ? 'white' : undefined,
                border: !active && !done ? '1px solid #D4C4B0' : 'none',
              }}
            >
              {done ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            {p.label}
          </div>
        );

        return (
          <div key={p.id} className="flex items-center gap-1.5">
            {clickable ? <Link to={p.to}>{inner}</Link> : inner}
            {i < PASOS.length - 1 && (
              <span className="w-6 h-px" style={{ background: done ? 'rgba(192,120,92,.4)' : '#D4C4B0' }} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// ════════════════════════════════════════════════════════════════════════
// useCuponActivo — Lee el cupón aplicado en el carrito (peyu_cupon_active)
// y lo RE-VALIDA contra el backend, para que el descuento prometido en el
// carrito llegue intacto al pago. Antes el cupón se perdía en el checkout
// y el cliente terminaba pagando más de lo que vio.
// ════════════════════════════════════════════════════════════════════════
export default function useCuponActivo() {
  const [cupon, setCupon] = useState(null);

  useEffect(() => {
    let alive = true;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('peyu_cupon_active') || 'null'); } catch { /* noop */ }
    if (!saved?.codigo) return undefined;

    base44.entities.Cupon.filter({ codigo: saved.codigo })
      .then((list) => {
        const c = list?.[0];
        if (!alive || !c || !c.activo) return;
        const hoy = new Date().toISOString().slice(0, 10);
        if (c.fecha_inicio && hoy < c.fecha_inicio) return;
        if (c.fecha_expiracion && hoy > c.fecha_expiracion) return;
        if (c.usos_max && c.usos_actuales >= c.usos_max) return;
        setCupon(c);
      })
      .catch(() => { /* sin cupón, el checkout sigue normal */ });

    return () => { alive = false; };
  }, []);

  return cupon;
}

// Calcula el descuento del cupón sobre la base (subtotal + personalización −
// ahorro por volumen). Respeta mínimo de compra, tope máximo y envío gratis.
export function calcularDescuentoCupon(cupon, base) {
  if (!cupon) return { descuento: 0, liberaEnvio: false };
  if (cupon.minimo_compra_clp && base < cupon.minimo_compra_clp) return { descuento: 0, liberaEnvio: false };
  if (cupon.tipo === 'envio_gratis') return { descuento: 0, liberaEnvio: true };
  if (cupon.tipo === 'porcentaje') {
    let d = Math.floor(base * ((cupon.valor || 0) / 100));
    if (cupon.max_descuento_clp) d = Math.min(d, cupon.max_descuento_clp);
    return { descuento: d, liberaEnvio: false };
  }
  if (cupon.tipo === 'monto_fijo') return { descuento: Math.min(cupon.valor || 0, base), liberaEnvio: false };
  return { descuento: 0, liberaEnvio: false };
}
/**
 * Helper único para determinar si un PedidoWeb está PAGADO o POR PAGAR.
 *
 * Lógica:
 *  - MercadoPago → solo PAGADO cuando MP webhook confirmó (estado pasó a
 *    "Confirmado" o posterior). Si está "Nuevo" significa que iniciaron
 *    el checkout pero NO pagaron.
 *  - Transferencia / Efectivo → pago manual. Por defecto va a POR PAGAR
 *    hasta que un humano confirme cambiando el estado a "Confirmado".
 *  - WebPay / Débito / Crédito → si está creado el pedido en esos medios,
 *    asumimos que el cobro ocurrió al checkout (no tenemos webhook); por
 *    eso desde "Confirmado" en adelante = PAGADO.
 *  - GiftCard → se canjea en el mismo flujo → PAGADO desde el inicio.
 *  - "Cancelado" / "Reembolsado" → POR PAGAR / cancelado.
 */

const ESTADOS_POST_PAGO = new Set([
  'Confirmado',
  'En Producción',
  'Listo para Despacho',
  'Despachado',
  'Entregado',
]);

const ESTADOS_FALLIDOS = new Set(['Cancelado', 'Reembolsado']);

export function getPagoStatus(pedido) {
  if (!pedido) return { pagado: false, label: '—', tone: 'gray' };

  const medio = String(pedido.medio_pago || '').trim();
  const estado = String(pedido.estado || '').trim();

  // Cancelado / Reembolsado
  if (ESTADOS_FALLIDOS.has(estado)) {
    return {
      pagado: false,
      label: estado === 'Reembolsado' ? 'Reembolsado' : 'Cancelado',
      tone: 'red',
    };
  }

  // GiftCard cubre todo: pagado desde el inicio
  if (medio === 'GiftCard') {
    return { pagado: true, label: 'Pagado · GiftCard', tone: 'green' };
  }

  // MercadoPago: depende de webhook → "Confirmado" = pagado
  if (medio === 'MercadoPago' || medio === 'MercadoPago') {
    if (ESTADOS_POST_PAGO.has(estado)) {
      return { pagado: true, label: 'Pagado · Mercado Pago', tone: 'green' };
    }
    return { pagado: false, label: 'Esperando pago · Mercado Pago', tone: 'amber' };
  }

  // Transferencia: humano debe confirmar
  if (medio === 'Transferencia') {
    if (ESTADOS_POST_PAGO.has(estado)) {
      return { pagado: true, label: 'Pagado · Transferencia', tone: 'green' };
    }
    return { pagado: false, label: 'Por confirmar transferencia', tone: 'amber' };
  }

  // WebPay / Débito / Crédito / Efectivo / MercadoPago legado
  if (ESTADOS_POST_PAGO.has(estado)) {
    return { pagado: true, label: `Pagado${medio ? ' · ' + medio : ''}`, tone: 'green' };
  }

  // Fallback: Nuevo sin método claro = por pagar
  return { pagado: false, label: medio ? `Por pagar · ${medio}` : 'Por pagar', tone: 'amber' };
}
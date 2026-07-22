// ============================================================================
// Shared · WebPay Plus (Transbank REST v1.2)
// Lógica común de tbkCreateTransaction, tbkCommitTransaction y
// tbkReconcilePending: config/headers, GET status, PUT commit y el marcado
// del pedido como pagado/fallido (con comprobante y guards anti-regresión).
// ============================================================================

export function tbkConfig() {
  const keyId = Deno.env.get('TBK_API_KEY_ID') || '';
  const keySecret = Deno.env.get('TBK_API_KEY_SECRET') || '';
  const esIntegracion = keyId.startsWith('59705555');
  const host = esIntegracion ? 'https://webpay3gint.transbank.cl' : 'https://webpay3g.transbank.cl';
  return {
    keyId,
    keySecret,
    esIntegracion,
    host,
    headers: {
      'Tbk-Api-Key-Id': keyId,
      'Tbk-Api-Key-Secret': keySecret,
      'Content-Type': 'application/json',
    },
  };
}

// PUT /transactions/{token} — confirma (captura) el pago. Solo válido UNA vez.
export async function tbkCommit(token) {
  const { host, headers } = tbkConfig();
  const res = await fetch(`${host}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
    method: 'PUT',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// GET /transactions/{token} — estado actual sin efectos secundarios.
// Sirve para: refresh de /gracias (commit ya hecho) y reconciliación CRON.
export async function tbkGetStatus(token) {
  const { host, headers } = tbkConfig();
  const res = await fetch(`${host}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function esAprobado(data) {
  return data?.status === 'AUTHORIZED' && data?.response_code === 0;
}

export function esFallido(data) {
  const st = String(data?.status || '');
  return ['FAILED', 'REVERSED', 'NULLIFIED'].includes(st) ||
    (st === 'AUTHORIZED' && Number(data?.response_code) !== 0);
}

// Recupera el token WebPay del pedido: primero el campo dedicado tbk_token
// (a prueba de colisiones); como fallback, el historial de tbkCreateTransaction
// (meta.token, pedidos antiguos). El más reciente gana.
export function tokenDePedido(pedido) {
  if (pedido?.tbk_token) return pedido.tbk_token;
  const hist = Array.isArray(pedido?.historial) ? pedido.historial : [];
  for (let i = hist.length - 1; i >= 0; i--) {
    const h = hist[i];
    if (h?.actor === 'webpay' && h?.meta?.token) return h.meta.token;
  }
  return null;
}

const ESTADOS_AVANZADOS = ['En Producción', 'Listo para Despacho', 'Despachado', 'Entregado'];

// Marca el pedido como pagado por WebPay + comprobante. Idempotente.
export async function marcarPagadoWebPay(base44, pedido, data, actor) {
  if (pedido.payment_status === 'paid') return false;
  await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
    estado: ESTADOS_AVANZADOS.includes(pedido.estado) ? pedido.estado : 'Confirmado',
    payment_status: 'paid',
    medio_pago: 'WebPay',
    historial: [
      ...(Array.isArray(pedido.historial) ? pedido.historial : []),
      {
        at: new Date().toISOString(),
        type: 'paid',
        actor,
        channel: 'system',
        detail: `Pago WebPay aprobado · auth ${data?.authorization_code || ''} · ${data?.payment_type_code || ''} ${data?.card_detail?.card_number ? '**** ' + data.card_detail.card_number : ''}`.trim(),
        meta: { authorization_code: data?.authorization_code, amount: data?.amount, transaction_date: data?.transaction_date },
      },
    ],
  });
  if (!pedido.comprobante_enviado) {
    try {
      await base44.asServiceRole.functions.invoke('enviarComprobantePedido', { pedido_id: pedido.id });
    } catch (e) {
      console.warn('No se pudo enviar comprobante:', e.message);
    }
  }
  return true;
}

// Marca el pago como fallido/reversado. Idempotente (no toca pedidos pagados).
export async function marcarFallidoWebPay(base44, pedido, data, actor) {
  if (pedido.payment_status === 'paid' || pedido.payment_status === 'failed') return false;
  await base44.asServiceRole.entities.PedidoWeb.update(pedido.id, {
    payment_status: 'failed',
    historial: [
      ...(Array.isArray(pedido.historial) ? pedido.historial : []),
      {
        at: new Date().toISOString(),
        type: 'note',
        actor,
        channel: 'system',
        detail: `Pago WebPay no completado · status ${data?.status || 'desconocido'} · response_code ${data?.response_code ?? '—'}`,
      },
    ],
  });
  return true;
}
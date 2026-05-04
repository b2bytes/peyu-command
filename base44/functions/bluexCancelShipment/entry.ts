// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Anular OT (Orden de Transporte)
// ─────────────────────────────────────────────────────────────────────────────
// Solo se puede anular si el envío NO ha sido retirado por el courier.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const BLUEX_API_BASE = 'https://services.bluex.cl/api/v1';
const CANCEL_ENDPOINT = '/admision/anular';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { envio_id, motivo } = await req.json();
    if (!envio_id) return Response.json({ error: 'envio_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const envio = await sr.entities.Envio.get(envio_id);
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    if (['Retirado por Courier', 'En Tránsito', 'En Reparto', 'Entregado'].includes(envio.estado)) {
      return Response.json({
        error: `No se puede anular. El envío está en estado "${envio.estado}". Para anulaciones avanzadas usa el portal: https://portal2.bluex.cl/`,
      }, { status: 400 });
    }

    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');

    const response = await fetch(`${BLUEX_API_BASE}${CANCEL_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': apiKey, 'token': token,
        'clientAccount': clientAccount, 'userCode': userCode,
      },
      body: JSON.stringify({
        orderTransportNumber: envio.tracking_number,
        clientAccount, userCode,
        reason: motivo || 'Solicitud cliente',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({
        error: 'Error anulando en Bluex',
        detail: data,
        portal_fallback: 'https://portal2.bluex.cl/',
      }, { status: response.status });
    }

    await sr.entities.Envio.update(envio_id, {
      estado: 'Anulado',
      anulacion_motivo: motivo || 'Anulado por admin',
      anulada_at: new Date().toISOString(),
    });

    // Actualizar pedido relacionado
    if (envio.pedido_id) {
      await sr.entities.PedidoWeb.update(envio.pedido_id, {
        courier: 'Pendiente',
        tracking: '',
      });
    }

    return Response.json({ ok: true, envio_id, anulada: true });
  } catch (error) {
    console.error('[bluexCancelShipment]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
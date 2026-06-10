// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Anular OT (Orden de Transporte)
// ─────────────────────────────────────────────────────────────────────────────
// La API corporativa de producción NO expone endpoint de anulación: la anulación
// se hace en el portal B2B de Bluex. Esta función anula INTERNAMENTE (libera el
// pedido para re-emitir) y deja el recordatorio de anular en el portal.
// Solo se puede anular si el envío NO ha sido retirado por el courier.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { envio_id, motivo } = await req.json();
    if (!envio_id) return Response.json({ error: 'envio_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const envio = await sr.entities.Envio.get(envio_id);
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    if (['Retirado por Courier', 'En Tránsito', 'En Reparto', 'Entregado'].includes(envio.estado)) {
      return Response.json({
        error: `No se puede anular. El envío está en estado "${envio.estado}". Para anulaciones avanzadas usa el portal: https://b2b.bluex.cl/`,
      }, { status: 400 });
    }

    await sr.entities.Envio.update(envio_id, {
      estado: 'Anulado',
      anulacion_motivo: motivo || 'Anulado por admin',
      anulada_at: new Date().toISOString(),
    });

    // Liberar el pedido relacionado para poder re-emitir etiqueta
    if (envio.pedido_id) {
      await sr.entities.PedidoWeb.update(envio.pedido_id, {
        courier: 'Pendiente',
        tracking: '',
      });
    }

    return Response.json({
      ok: true,
      envio_id,
      anulada: true,
      hint: `Recuerda anular la OT ${envio.tracking_number || ''} también en el portal Bluex: https://b2b.bluex.cl/`,
    });
  } catch (error) {
    console.error('[bluexCancelShipment]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
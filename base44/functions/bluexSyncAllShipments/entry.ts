import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Sincronización completa de todos los envíos con BlueExpress Tracking Pull Corp
 * - Valida envíos activos (no entregados)
 * - Consulta tracking en tiempo real
 * - Actualiza BD local con estados y eventos
 * - Detecta excepciones y atrasos
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Solo admins pueden sincronizar envíos' },
        { status: 403 }
      );
    }

    // Cargar envíos activos (no entregados ni anulados)
    const envios = await base44.asServiceRole.entities.Envio.filter({
      estado: {
        $nin: ['Entregado', 'Anulado', 'Devuelto']
      }
    }, '-fecha_emision', 500);

    if (!envios || envios.length === 0) {
      return Response.json({
        ok: true,
        message: 'No hay envíos activos para sincronizar',
        synced: 0,
        total: 0,
      });
    }

    let synced = 0;
    let errors = [];

    // Sincronizar cada envío
    for (const envio of envios) {
      if (!envio.tracking_number) {
        errors.push(`${envio.numero_pedido}: sin tracking_number`);
        continue;
      }

      try {
        // Invocar función de tracking pull corp
        const res = await base44.asServiceRole.functions.invoke('bluexTrackingPullCorp', {
          tracking_number: envio.tracking_number,
          envio_id: envio.id,
        });

        if (res?.data?.ok) {
          synced++;
          console.log(`[bluexSyncAll] ✓ ${envio.tracking_number} sincronizado`);
        } else {
          errors.push(`${envio.tracking_number}: ${res?.data?.error || 'Error desconocido'}`);
        }
      } catch (e) {
        // Envíos que fallan se saltan sin detener el proceso
        errors.push(`${envio.tracking_number}: ${e.message}`);
        console.warn(`[bluexSyncAll] ✗ Error en ${envio.tracking_number}:`, e.message);
      }

      // Pequeña pausa entre requests para no sobrecargar API
      await new Promise(r => setTimeout(r, 100));
    }

    return Response.json({
      ok: true,
      message: `Sincronización completada`,
      synced,
      total: envios.length,
      errors: errors.length > 0 ? errors : null,
      error_count: errors.length,
    });
  } catch (error) {
    console.error('[bluexSyncAllShipments]', error);
    return Response.json({
      ok: false,
      error: error.message || 'Error sincronizando envíos',
    }, { status: 500 });
  }
});
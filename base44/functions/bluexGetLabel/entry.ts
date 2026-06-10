// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Obtener / re-imprimir etiqueta PDF (PRODUCCIÓN)
// ─────────────────────────────────────────────────────────────────────────────
// La API corporativa de emisión OS devuelve la etiqueta UNA sola vez al emitir;
// bluexCreateShipment la cachea en Envio.label_base64 / label_url. Esta función
// sirve esa cache. Si por algún motivo no existe, entrega el tracking público y
// el portal B2B para reimprimir (no hay endpoint de re-print en la API corp).
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { envio_id } = await req.json();
    if (!envio_id) return Response.json({ error: 'envio_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const envio = await sr.entities.Envio.get(envio_id);
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    // 1) Cache local (poblada al emitir la OT)
    if (envio.label_base64 || envio.label_url) {
      return Response.json({
        ok: true,
        label_base64: envio.label_base64 || null,
        label_url: envio.label_url || null,
        label_format: envio.label_format || 'PDF',
        from_cache: true,
      });
    }

    // 2) Buscar en la respuesta cruda de emisión (envíos antiguos sin cache normalizada)
    const rawLabel = envio.raw_response_emision?.labels?.contenido;
    if (rawLabel) {
      const labelUrl = `data:application/pdf;base64,${rawLabel}`;
      await sr.entities.Envio.update(envio_id, { label_base64: rawLabel, label_url: labelUrl, label_format: 'PDF' });
      return Response.json({ ok: true, label_base64: rawLabel, label_url: labelUrl, label_format: 'PDF', from_cache: false });
    }

    // 3) Sin etiqueta disponible → portal B2B (la API corp no permite re-print)
    if (!envio.tracking_number) {
      return Response.json({ error: 'Envío sin tracking_number ni etiqueta' }, { status: 400 });
    }
    return Response.json({
      ok: true,
      modo: 'portal',
      tracking_url: `https://www.bluex.cl/seguimiento?n=${envio.tracking_number}`,
      portal_url: 'https://b2b.bluex.cl/',
      hint: 'La etiqueta no quedó cacheada. Reimprímela desde el portal B2B de Bluex.',
    });
  } catch (error) {
    console.error('[bluexGetLabel]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Obtener / re-imprimir etiqueta PDF
// ─────────────────────────────────────────────────────────────────────────────
// Devuelve la etiqueta en base64 o URL para mostrar/imprimir desde la app.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const BLUEX_API_BASE = 'https://services.bluex.cl/api/v1';
const LABEL_ENDPOINT = '/admision/etiqueta';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { envio_id } = await req.json();
    if (!envio_id) return Response.json({ error: 'envio_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const envio = await sr.entities.Envio.get(envio_id);
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    // Si ya tenemos cache local, devolverlo
    if (envio.label_base64 || envio.label_url) {
      return Response.json({
        ok: true,
        label_base64: envio.label_base64,
        label_url: envio.label_url,
        from_cache: true,
      });
    }

    if (!envio.tracking_number) {
      return Response.json({ error: 'Envío sin tracking_number' }, { status: 400 });
    }

    const apiKey = Deno.env.get('BLUEX_API_KEY');
    const token = Deno.env.get('BLUEX_TOKEN');
    const clientAccount = Deno.env.get('BLUEX_CLIENT_ACCOUNT');
    const userCode = Deno.env.get('BLUEX_USER_CODE');

    const response = await fetch(`${BLUEX_API_BASE}${LABEL_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': apiKey, 'token': token,
        'clientAccount': clientAccount, 'userCode': userCode,
      },
      body: JSON.stringify({
        orderTransportNumber: envio.tracking_number,
        clientAccount, userCode,
        format: 'PDF',
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({
        error: 'Error obteniendo etiqueta',
        detail: data,
        portal_fallback: `https://ecommerce.blue.cl/etiquetas/${envio.tracking_number}`,
      }, { status: response.status });
    }

    const labelB64 = data?.label || data?.pdf || data?.labelBase64 || null;
    const labelUrl = data?.labelUrl || data?.url || null;

    // Cachear
    await sr.entities.Envio.update(envio_id, {
      label_base64: labelB64,
      label_url: labelUrl || `https://ecommerce.blue.cl/etiquetas/${envio.tracking_number}`,
    });

    return Response.json({
      ok: true,
      label_base64: labelB64,
      label_url: labelUrl,
    });
  } catch (error) {
    console.error('[bluexGetLabel]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
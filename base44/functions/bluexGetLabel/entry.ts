// ─────────────────────────────────────────────────────────────────────────────
// BlueExpress · Obtener / re-imprimir etiqueta PDF (PRODUCCIÓN)
// ─────────────────────────────────────────────────────────────────────────────
// 1) Sirve la cache local (Envio.label_base64, poblada al emitir la OT).
// 2) Si no existe, REIMPRIME en vivo vía la API oficial Label Reimpresión
//    (cmkin/labels-corp/v1/labels) usando el N° de OT como orderId, en PDF
//    estándar o 10x15 (A6, ideal impresora térmica) según template_version.
// 3) Último recurso: tracking público + portal B2B.
// ─────────────────────────────────────────────────────────────────────────────

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const LABELS_URL = 'https://cmkin.api.blue.cl/cmkin/labels-corp/v1/labels';

// Bearer OAuth corporativo PROD (mismo flujo que pricing/emisión)
let _bearerCache = { token: null, exp: 0 };
async function getBearerToken() {
  if (_bearerCache.token && Date.now() < _bearerCache.exp) return _bearerCache.token;
  const cid = Deno.env.get('BLUEX_CLIENT_ID') || '';
  const csec = Deno.env.get('BLUEX_CLIENT_SECRET') || '';
  const r = await fetch('https://sso.blue.cl/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${btoa(`${cid}:${csec}`)}` },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error(`Token Bluex falló (${r.status})`);
  const j = await r.json();
  _bearerCache = { token: j.access_token, exp: Date.now() + 50 * 60 * 1000 };
  return j.access_token;
}

// Reimprime la etiqueta vía API oficial. templateVersion: '1.0' | '10x15'
async function reprintLabel(orderId, templateVersion = '1.0') {
  const bearer = await getBearerToken();
  const res = await fetch(LABELS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bearer}`,
      'x-api-key': Deno.env.get('BLUEX_API_KEY') || '',
    },
    body: JSON.stringify({ orderId: String(orderId), templateName: 'PDF', templateVersion }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.content) {
    console.warn(`[bluexGetLabel reprint] HTTP ${res.status}:`, JSON.stringify(data).slice(0, 300));
    return null;
  }
  return data.content; // PDF en base64
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { envio_id, template_version, force_reprint = false } = await req.json();
    if (!envio_id) return Response.json({ error: 'envio_id requerido' }, { status: 400 });

    const sr = base44.asServiceRole;
    const envio = await sr.entities.Envio.get(envio_id);
    if (!envio) return Response.json({ error: 'Envío no encontrado' }, { status: 404 });

    // 1) Cache local (poblada al emitir la OT) — salvo que se fuerce reimpresión
    if (!force_reprint && (envio.label_base64 || envio.label_url)) {
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

    if (!envio.tracking_number) {
      return Response.json({ error: 'Envío sin tracking_number ni etiqueta' }, { status: 400 });
    }

    // 3) Reimpresión EN VIVO vía API oficial Label Reimpresión (PDF 1.0 o 10x15)
    const reprinted = await reprintLabel(envio.tracking_number, template_version || '1.0');
    if (reprinted) {
      const labelUrl = `data:application/pdf;base64,${reprinted}`;
      await sr.entities.Envio.update(envio_id, { label_base64: reprinted, label_url: labelUrl, label_format: 'PDF' });
      return Response.json({ ok: true, label_base64: reprinted, label_url: labelUrl, label_format: 'PDF', from_cache: false, reprinted: true });
    }

    // 4) Último recurso → portal B2B
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
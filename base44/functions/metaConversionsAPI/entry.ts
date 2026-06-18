import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaConversionsAPI · Envía eventos de conversión REALES al píxel de Meta vía
// la Conversions API (server-side). Permite registrar compras, leads, etc.
// que ocurren en el sitio/backend de PEYU para que Meta mida conversiones y
// optimice campañas, incluso sin depender solo del pixel del navegador.
//
// Payload:
// {
//   event_name: 'Purchase' | 'Lead' | 'AddToCart' | 'InitiateCheckout' | 'CompleteRegistration' | 'ViewContent',
//   value?: number,                 // monto (CLP) para Purchase
//   currency?: string,              // default 'CLP'
//   email?: string,                 // se hashea SHA-256 (Advanced Matching)
//   phone?: string,                 // se hashea SHA-256
//   event_source_url?: string,      // URL donde ocurrió
//   event_id?: string,              // para deduplicar con el pixel del navegador
//   test_event_code?: string,       // para probar en Test Events de Meta
//   contents?: [{ id, quantity, item_price }],  // productos (opcional)
//   pixel_id?: string,              // si no se pasa, se detecta el primero de la cuenta
// }
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

// SHA-256 hash en minúsculas/sin espacios — requerido por Meta para PII.
async function sha256(value) {
  if (!value) return undefined;
  const norm = String(value).trim().toLowerCase();
  const data = new TextEncoder().encode(norm);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ') || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para enviar eventos a este pixel.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido en el evento.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Auth: las llamadas internas server-side (mpWebhook, onNewB2BLead) pasan
    // internal:true y vienen vía asServiceRole — se confían. Las llamadas desde
    // el agente/UI exigen un admin autenticado.
    if (!body.internal) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const eventName = body.event_name;
    const validEvents = ['Purchase', 'Lead', 'AddToCart', 'InitiateCheckout', 'CompleteRegistration', 'ViewContent', 'Search', 'Contact'];
    if (!eventName || !validEvents.includes(eventName)) {
      return Response.json({ ok: false, error: `event_name inválido. Usa uno de: ${validEvents.join(', ')}.` });
    }

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // Detectar el pixel si no se pasó uno
    let pixelId = body.pixel_id;
    if (!pixelId) {
      const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id,name&access_token=${t}`);
      const pix = await pixRes.json();
      if (pix.error) return Response.json({ ok: false, ...diagnoseMetaError(pix.error) });
      pixelId = (pix.data || [])[0]?.id;
      if (!pixelId) return Response.json({ ok: false, error: 'No se encontró ningún pixel en la cuenta para enviar el evento.' });
    }

    // Datos de usuario hasheados (Advanced Matching)
    const user_data = {};
    if (body.email) user_data.em = [await sha256(body.email)];
    if (body.phone) user_data.ph = [await sha256(String(body.phone).replace(/\D/g, ''))];
    // client_user_agent + IP ayudan al match aunque sea server-side. Meta exige
    // al menos un parámetro de cliente válido; si no hay email/teléfono, la IP
    // del request cumple ese mínimo para que el evento sea aceptado.
    user_data.client_user_agent = req.headers.get('user-agent') || 'PEYU-Server';
    const fwd = req.headers.get('x-forwarded-for');
    const clientIp = fwd ? fwd.split(',')[0].trim() : null;
    if (clientIp) user_data.client_ip_address = clientIp;
    // Fallback de match estable cuando no llega email/teléfono ni IP utilizable.
    if (!body.email && !body.phone && !clientIp) {
      user_data.external_id = [await sha256(body.event_id || `peyu-${Date.now()}`)];
    }

    const custom_data = {};
    if (body.value != null) custom_data.value = Number(body.value);
    custom_data.currency = body.currency || 'CLP';
    if (body.content_name) custom_data.content_name = String(body.content_name);
    if (Array.isArray(body.contents) && body.contents.length) {
      custom_data.contents = body.contents.map(c => ({
        id: String(c.id), quantity: Number(c.quantity || 1), item_price: c.item_price != null ? Number(c.item_price) : undefined,
      }));
      custom_data.content_type = 'product';
    }

    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_source_url: body.event_source_url || 'https://peyuchile.cl',
      user_data,
      custom_data,
    };
    if (body.event_id) eventData.event_id = body.event_id;

    const payload = { data: [eventData] };
    if (body.test_event_code) payload.test_event_code = body.test_event_code;

    const res = await fetch(`${base}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, access_token: token }),
    });
    const data = await res.json();
    if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });

    return Response.json({
      ok: true,
      pixel_id: pixelId,
      event_name: eventName,
      events_received: data.events_received ?? 1,
      fbtrace_id: data.fbtrace_id,
      message: `Evento "${eventName}" enviado a Meta correctamente${body.test_event_code ? ' (modo prueba)' : ''}.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
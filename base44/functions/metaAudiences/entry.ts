import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAudiences · Públicos (Custom Audiences) de Meta para el agente.
// Permite al agente LISTAR las audiencias de la cuenta y CREAR audiencias de
// clientes (Customer Match) — clave para EXCLUIR compradores recientes.
//
// Payload:
//   { action: 'list' }
//     → todas las custom audiences con id, nombre, tamaño aproximado, tipo.
//   { action: 'create_buyers', days?: 180, name?: 'Compradores 180d' }
//     → crea una Customer Audience con los emails/teléfonos de los clientes
//       que COMPRARON en PEYU en los últimos N días (pedidos pagados).
//       Devuelve el audience_id para usarlo como exclusión en un ad set.
//   { action: 'create_from_pixel', event?: 'Purchase', days?: 180, name? }
//     → crea una Website Custom Audience desde el pixel (quien disparó el evento).
//
// Para crear una Customer Audience hay que subir los datos hasheados (SHA-256)
// con el endpoint /usersreplace. Meta hace el match contra su base.
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = err?.message || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para gestionar audiencias. Asigna ads_management + tarea MANAGE.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido al gestionar la audiencia.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

// Normaliza + hashea SHA-256 (requisito de Customer Match).
async function sha256(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hashEmail(email) {
  if (!email) return null;
  return await sha256(String(email).trim().toLowerCase());
}
async function hashPhone(phone) {
  if (!phone) return null;
  // E.164 sin símbolos; asume Chile si viene sin prefijo.
  let p = String(phone).replace(/\D/g, '');
  if (!p) return null;
  if (p.length === 9 && p.startsWith('9')) p = '56' + p; // móvil chileno
  return await sha256(p);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) return Response.json({ ok: false, error: 'Faltan credenciales de Meta.' });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // ── Listar custom audiences ────────────────────────────────────────────
    if (action === 'list') {
      const fields = 'id,name,description,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status,time_updated';
      const res = await fetch(`${base}/${accountId}/customaudiences?fields=${fields}&limit=200&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const audiences = (data.data || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        subtype: a.subtype,
        size_aprox: a.approximate_count_lower_bound != null
          ? `${a.approximate_count_lower_bound}–${a.approximate_count_upper_bound}`
          : null,
        status: a.operation_status?.description || null,
      }));
      return Response.json({ ok: true, action, count: audiences.length, audiences });
    }

    // ── Crear Customer Audience de COMPRADORES (para excluirlos) ────────────
    if (action === 'create_buyers') {
      const days = Math.max(1, Math.min(3650, Number(body.days || 180)));
      const name = body.name || `PEYU · Compradores ${days}d`;
      const since = new Date(Date.now() - days * 86400 * 1000).toISOString();

      // Pedidos pagados/entregados de PEYU en la ventana → emails + teléfonos.
      const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter(
        { payment_status: 'paid' }, '-created_date', 5000
      ).catch(() => []);
      const recientes = (pedidos || []).filter(p => p.created_date && p.created_date >= since);

      const hashes = [];
      const seen = new Set();
      for (const p of recientes) {
        const email = await hashEmail(p.cliente_email);
        const phone = await hashPhone(p.cliente_telefono);
        if (email && !seen.has('e' + email)) { hashes.push([email]); seen.add('e' + email); }
        if (phone && !seen.has('p' + phone)) { hashes.push([phone]); seen.add('p' + phone); }
      }

      if (hashes.length === 0) {
        return Response.json({ ok: false, reason: 'sin_compradores', error: `No hay compradores con email/teléfono en los últimos ${days} días para construir la audiencia.` });
      }

      // 1) Crear la custom audience vacía (subtype CUSTOM, customer_file_source).
      const createRes = await fetch(`${base}/${accountId}/customaudiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subtype: 'CUSTOM',
          description: `Compradores PEYU últimos ${days} días (generada por el agente).`,
          customer_file_source: 'USER_PROVIDED_ONLY',
          access_token: token,
        }),
      });
      const created = await createRes.json();
      if (created.error) return Response.json({ ok: false, ...diagnoseMetaError(created.error) });
      const audienceId = created.id;

      // 2) Subir los hashes con /users (schema mixto EMAIL_SHA256 / PHONE_SHA256).
      //    Cada fila es un solo valor; el schema declara ambos tipos pero como
      //    cada row trae un único dato, subimos por separado. Simplificamos:
      //    emails primero, luego teléfonos, en dos llamadas.
      const emails = recientes.map(p => p.cliente_email).filter(Boolean);
      const phones = recientes.map(p => p.cliente_telefono).filter(Boolean);
      const emailHashes = [];
      for (const e of [...new Set(emails)]) { const h = await hashEmail(e); if (h) emailHashes.push([h]); }
      const phoneHashes = [];
      for (const ph of [...new Set(phones)]) { const h = await hashPhone(ph); if (h) phoneHashes.push([h]); }

      let added = 0;
      if (emailHashes.length) {
        const r = await fetch(`${base}/${audienceId}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: { schema: ['EMAIL_SHA256'], data: emailHashes }, access_token: token }),
        });
        const j = await r.json();
        if (j.error) return Response.json({ ok: false, audience_id: audienceId, ...diagnoseMetaError(j.error) });
        added += Number(j.num_received || emailHashes.length);
      }
      if (phoneHashes.length) {
        const r = await fetch(`${base}/${audienceId}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: { schema: ['PHONE_SHA256'], data: phoneHashes }, access_token: token }),
        });
        const j = await r.json();
        if (j.error) return Response.json({ ok: false, audience_id: audienceId, ...diagnoseMetaError(j.error) });
        added += Number(j.num_received || phoneHashes.length);
      }

      return Response.json({
        ok: true, action, audience_id: audienceId, name,
        days, compradores_subidos: added,
        message: `Audiencia "${name}" creada con ~${added} registros de compradores. Úsala como EXCLUSIÓN (excluded_audience_ids) al crear/editar un ad set.`,
      });
    }

    // ── Crear Website Custom Audience desde el pixel ────────────────────────
    if (action === 'create_from_pixel') {
      const event = body.event || 'Purchase';
      const days = Math.max(1, Math.min(180, Number(body.days || 180)));
      const name = body.name || `PEYU · ${event} ${days}d (pixel)`;

      // Pixel activo de la cuenta.
      const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id,name&access_token=${t}`);
      const pix = await pixRes.json();
      if (pix.error) return Response.json({ ok: false, ...diagnoseMetaError(pix.error) });
      const pixel = (pix.data || [])[0];
      if (!pixel) return Response.json({ ok: false, reason: 'sin_pixel', error: 'No hay pixel en la cuenta para crear una audiencia de sitio web.' });

      const rule = JSON.stringify({
        inclusions: { operator: 'or', rules: [{ event_sources: [{ id: pixel.id, type: 'pixel' }], retention_seconds: days * 86400, filter: { operator: 'and', filters: [{ field: 'event', operator: 'eq', value: event }] } }] },
      });

      const res = await fetch(`${base}/${accountId}/customaudiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subtype: 'WEBSITE', rule, prefill: true, access_token: token }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({
        ok: true, action, audience_id: data.id, name, event, days,
        message: `Audiencia de sitio web "${name}" creada (quienes dispararon ${event} en ${days} días). Úsala para retargeting o como exclusión.`,
      });
    }

    return Response.json({ ok: false, error: `Acción no soportada: ${action}. Usa 'list', 'create_buyers' o 'create_from_pixel'.` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
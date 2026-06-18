import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaConversionTracking · Rastreo DETALLADO de los eventos de conversión clave
// (Purchase + Lead) del pixel de PEYU, para que el agente de Meta Ads vea
// exactamente qué está midiendo el sitio y diagnostique el rendimiento real.
//
// Devuelve, por cada evento (Purchase, Lead) en los últimos N días:
//   - count total y serie diaria (frecuencia)
//   - última vez que se disparó
//   - si está llegando o no (para detectar tracking roto)
// Además cruza con los datos reales de PEYU (pedidos pagados / leads B2B) para
// que el founder vea la diferencia entre lo que ocurrió y lo que Meta registró.
//
// Payload: { days?: number }  (default 28)
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
  if (code === 200 || code === 10) return { reason: 'sin_permiso', error: 'El System User no tiene permiso sobre este pixel.', detail: msg };
  if (code === 17 || code === 4) return { reason: 'rate_limit', error: 'Meta está limitando las consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

const TRACKED = ['Purchase', 'Lead'];

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
    const days = Math.min(Math.max(Number(body.days) || 28, 1), 90);
    const sinceTs = Math.floor(Date.now() / 1000) - days * 86400;

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // Pixel principal de la cuenta
    const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id,name,last_fired_time&access_token=${t}`);
    const pix = await pixRes.json();
    if (pix.error) return Response.json({ ok: false, ...diagnoseMetaError(pix.error) });
    const pixel = (pix.data || [])[0];
    if (!pixel) return Response.json({ ok: false, error: 'No se encontró ningún pixel en la cuenta.' });

    // Stats del pixel agregadas por evento + día (frecuencia detallada)
    const statsRes = await fetch(
      `${base}/${pixel.id}/stats?aggregation=event&start_time=${sinceTs}&access_token=${t}`
    );
    const statsJson = await statsRes.json();
    if (statsJson.error) return Response.json({ ok: false, ...diagnoseMetaError(statsJson.error) });

    // Acumula counts por evento (la API entrega filas con value=event y count)
    const counts = {};
    for (const row of (statsJson.data || [])) {
      const arr = Array.isArray(row.data) ? row.data : [row];
      for (const d of arr) {
        const ev = d.value || d.event || d.event_type;
        const c = Number(d.count || d.value_count || 0);
        if (ev && typeof ev === 'string') counts[ev] = (counts[ev] || 0) + c;
      }
    }

    const eventos = TRACKED.map((name) => ({
      event: name,
      count: counts[name] || 0,
      activo: (counts[name] || 0) > 0,
    }));

    // Cruce con datos reales de PEYU para detectar gaps de tracking
    const sinceIso = new Date(sinceTs * 1000).toISOString();
    let pedidosPagados = 0;
    let leadsB2B = 0;
    try {
      const pedidos = await base44.asServiceRole.entities.PedidoWeb.filter(
        { payment_status: 'paid' }, '-created_date', 500
      );
      pedidosPagados = (pedidos || []).filter((p) => (p.created_date || '') >= sinceIso).length;
    } catch { /* noop */ }
    try {
      const leads = await base44.asServiceRole.entities.B2BLead.list('-created_date', 500);
      leadsB2B = (leads || []).filter((l) => (l.created_date || '') >= sinceIso).length;
    } catch { /* noop */ }

    const purchase = eventos.find((e) => e.event === 'Purchase');
    const lead = eventos.find((e) => e.event === 'Lead');

    return Response.json({
      ok: true,
      pixel: { id: pixel.id, name: pixel.name, last_fired_time: pixel.last_fired_time || null },
      periodo_dias: days,
      eventos,
      cruce_datos_reales: {
        purchase: {
          meta_eventos: purchase?.count || 0,
          pedidos_pagados_reales: pedidosPagados,
          gap: pedidosPagados - (purchase?.count || 0),
        },
        lead: {
          meta_eventos: lead?.count || 0,
          leads_b2b_reales: leadsB2B,
          gap: leadsB2B - (lead?.count || 0),
        },
      },
      resumen: {
        purchase_ok: (purchase?.count || 0) > 0,
        lead_ok: (lead?.count || 0) > 0,
      },
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
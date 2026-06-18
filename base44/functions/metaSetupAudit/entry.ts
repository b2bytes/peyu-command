import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaSetupAudit · Auditoría PROFUNDA del setup completo de Meta para PEYU.
// Devuelve, en una sola llamada, todo lo que el agente necesita para entender
// y diagnosticar la configuración:
//   • Cuenta publicitaria (estado, moneda, gasto histórico)
//   • Píxel(es) / datasets: nombre, última actividad, EVENTOS por tipo con su
//     frecuencia (Purchase, AddToCart, Lead, ViewContent, etc.) últimos 28 días
//   • Audiencias personalizadas (custom audiences) con tamaño aproximado
//   • Dominios verificados del negocio
//   • Página de Facebook + Instagram business conectados
//
// Payload: {}  (no requiere parámetros)
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
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado. Regenera el token del System User con ads_read + ads_management + business_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso suficiente. Para ver eventos del pixel y audiencias necesitas ads_read + business_management asignados a la cuenta y al negocio.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'Recurso no encontrado. Revisa META_AD_ACCOUNT_ID.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

async function gget(url) {
  const res = await fetch(url);
  return await res.json();
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

    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);
    const out = { ok: true, account_id: accountId };

    // 1 · Cuenta publicitaria
    const acct = await gget(`${base}/${accountId}?fields=name,currency,account_status,amount_spent,business&access_token=${t}`);
    if (acct.error) return Response.json({ ok: false, ...diagnoseMetaError(acct.error) });
    out.account = {
      name: acct.name,
      currency: acct.currency,
      status: acct.account_status,
      status_ok: acct.account_status === 1,
      amount_spent: acct.amount_spent ? Number(acct.amount_spent) : 0,
      business_id: acct.business?.id || null,
    };

    // 2 · Píxeles / datasets + eventos por tipo (stats últimos 28 días)
    const pix = await gget(`${base}/${accountId}/adspixels?fields=id,name,last_fired_time,is_unavailable&access_token=${t}`);
    out.pixels = [];
    for (const p of (pix.data || [])) {
      const pixel = {
        id: p.id,
        name: p.name,
        last_fired_time: p.last_fired_time || null,
        active: !p.is_unavailable && !!p.last_fired_time,
        events: [],
      };
      // Estadísticas de eventos por tipo (event_type) — qué dispara y cuánto
      const stats = await gget(`${base}/${p.id}/stats?aggregation=event&start_time=${Math.floor(Date.now()/1000) - 28*86400}&access_token=${t}`);
      if (Array.isArray(stats.data)) {
        // Cada item suele traer { value: 'Purchase', count } o estructura por día.
        const counts = {};
        for (const row of stats.data) {
          const dataArr = Array.isArray(row.data) ? row.data : [row];
          for (const d of dataArr) {
            const ev = d.value || d.event || d.event_type;
            const c = Number(d.count || d.value_count || 0);
            if (ev && typeof ev === 'string') counts[ev] = (counts[ev] || 0) + c;
          }
        }
        pixel.events = Object.entries(counts)
          .map(([event, count]) => ({ event, count }))
          .sort((a, b) => b.count - a.count);
      }
      out.pixels.push(pixel);
    }
    out.pixel_ok = out.pixels.some(p => p.active);
    // Resumen de eventos clave detectados en cualquier pixel
    const allEvents = {};
    for (const p of out.pixels) for (const e of p.events) allEvents[e.event] = (allEvents[e.event] || 0) + e.count;
    out.eventos_resumen = Object.entries(allEvents).map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count);
    out.tiene_purchase = !!allEvents['Purchase'];
    out.tiene_lead = !!allEvents['Lead'];
    out.tiene_addtocart = !!allEvents['AddToCart'];

    // 3 · Audiencias personalizadas
    const aud = await gget(`${base}/${accountId}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,delivery_status&limit=50&access_token=${t}`);
    out.audiencias = (aud.data || []).map(a => ({
      id: a.id,
      name: a.name,
      subtype: a.subtype,
      size: a.approximate_count_lower_bound ?? null,
      status: a.delivery_status?.description || null,
    }));
    out.audiencias_count = out.audiencias.length;

    // 4 · Dominios verificados del negocio
    out.dominios = [];
    if (out.account.business_id) {
      const dom = await gget(`${base}/${out.account.business_id}/owned_domains?fields=domain_name&limit=50&access_token=${t}`);
      out.dominios = (dom.data || []).map(d => d.domain_name);
    }

    // 5 · Página de Facebook + Instagram business
    const pg = await gget(`${base}/me/accounts?fields=id,name,fan_count,instagram_business_account{id,username,followers_count}&limit=10&access_token=${t}`);
    out.pages = (pg.data || []).map(p => ({
      id: p.id,
      name: p.name,
      fans: p.fan_count ?? null,
      instagram: p.instagram_business_account
        ? { id: p.instagram_business_account.id, username: p.instagram_business_account.username, followers: p.instagram_business_account.followers_count ?? null }
        : null,
    }));
    out.page_ok = out.pages.length > 0;
    out.instagram_ok = out.pages.some(p => p.instagram);

    out.todo_ok = out.account.status_ok && out.pixel_ok && out.page_ok;
    return Response.json(out);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
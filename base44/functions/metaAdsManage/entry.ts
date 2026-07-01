import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsManage · Acciones de ESCRITURA sobre Meta Ads (Graph API).
// Permite al agente ejecutar cambios reales: pausar/activar campañas, ad sets
// y ads; cambiar presupuesto diario; y listar campañas con estado + presupuesto.
// Requiere System User token con ads_management sobre la cuenta publicitaria.
//
// Payload:
//   { action: 'list_campaigns' }
//   { action: 'pause' | 'activate', entity_type: 'campaign'|'adset'|'ad', id: '123' }
//   { action: 'set_daily_budget', entity_type: 'campaign'|'adset', id: '123', daily_budget_clp: 25000 }
//
// Nota presupuesto: la Graph API recibe el monto en la unidad mínima de la
// moneda. CLP no tiene decimales, por lo que daily_budget = monto * 1 (sin x100).
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
  if (code === 190) return { reason: 'token_invalido', error: 'El token de Meta es inválido o expiró. Regenera el token del Usuario del Sistema con ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El Usuario del Sistema no tiene permiso ads_management para modificar esta campaña. Asigna "Administrar campañas" en Meta Business Settings.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'No se encuentra la campaña/ad set/anuncio indicado. Verifica el ID.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando las consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('META_SYSTEM_USER_TOKEN');
    const accountId = fmtAccountId(Deno.env.get('META_AD_ACCOUNT_ID'));
    if (!token || !accountId) {
      return Response.json({ ok: false, error: 'Faltan credenciales de Meta (token o Ad Account ID).' });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    // ── Diagnóstico PROFUNDO de permisos del token (¿quién es y qué puede?) ──
    // Responde la duda real: el token lee la cuenta pero NO puede escribir.
    // Revela: identidad del token, permisos del token, businesses, y las
    // tareas (tasks) que el System User tiene asignadas sobre el ad account.
    if (action === 'diagnostico_permisos') {
      const out = { ok: true, account_id: accountId };

      // 1) ¿A nombre de quién es el token? (System User / usuario)
      const meRes = await fetch(`${base}/me?fields=id,name&access_token=${t}`);
      const me = await meRes.json();
      if (me.error) return Response.json({ ok: false, ...diagnoseMetaError(me.error) });
      out.token_identity = { id: me.id, name: me.name };

      // 2) Permisos (scopes) del token — debe incluir ads_management para escribir
      const permRes = await fetch(`${base}/me/permissions?access_token=${t}`);
      const perm = await permRes.json();
      const granted = (perm.data || []).filter(p => p.status === 'granted').map(p => p.permission);
      out.token_scopes = granted;
      out.tiene_ads_management = granted.includes('ads_management');
      out.tiene_ads_read = granted.includes('ads_read');

      const suId = me.id;

      // 3a) ¿De qué Business es dueño este ad account? y ¿a qué businesses
      //     pertenece el token? Si difieren, es un ad account COMPARTIDO entre
      //     businesses y la escritura del System User requiere asignación extra.
      const acctBizRes = await fetch(`${base}/${accountId}?fields=name,business{id,name},owner{id,name}&access_token=${t}`);
      const acctBiz = await acctBizRes.json();
      out.ad_account_business = acctBiz.business || acctBiz.owner || null;

      const myBizRes = await fetch(`${base}/me/businesses?fields=id,name&access_token=${t}`);
      const myBiz = await myBizRes.json();
      out.token_businesses = (myBiz.data || []).map(b => ({ id: b.id, name: b.name }));

      const bizId = out.ad_account_business?.id;

      // 3b) Tareas del token sobre ESTE ad account (lo que de verdad bloquea la
      //     escritura). assigned_users requiere el business id del dueño.
      if (bizId) {
        const auRes = await fetch(`${base}/${accountId}/assigned_users?business=${bizId}&fields=id,name,tasks&access_token=${t}`);
        const au = await auRes.json();
        if (au.error) {
          out.assigned_users_error = au.error.message;
        } else {
          const mine = (au.data || []).find(u => String(u.id) === String(suId));
          out.assigned_users = (au.data || []).map(u => ({ id: u.id, name: u.name, tasks: u.tasks || [] }));
          out.mis_tasks = mine?.tasks || [];
          // Para modificar campañas se requiere la task MANAGE sobre el ad account.
          out.puede_administrar_campanas = (mine?.tasks || []).includes('MANAGE');
        }
      } else {
        out.assigned_users_error = 'No se pudo determinar el Business dueño del ad account.';
      }

      // 4) Veredicto claro y accionable
      if (!out.tiene_ads_management) {
        out.veredicto = 'El TOKEN no tiene el permiso ads_management. Regenera el token del System User incluyendo ads_management.';
      } else if (out.puede_administrar_campanas === false) {
        out.veredicto = `El token (System User "${me.name}", id ${me.id}) NO tiene la tarea "Administrar campañas" (MANAGE) sobre el ad account ${accountId}. Sus tareas actuales son: [${(out.mis_tasks || []).join(', ') || 'ninguna'}]. Ve a Meta Business Settings → Cuentas publicitarias → ${accountId} → Personas/Usuarios del sistema → asigna a "${me.name}" el control total / "Administrar campañas".`;
      } else {
        out.veredicto = 'El token tiene ads_management y la tarea MANAGE sobre el ad account. La escritura debería funcionar.';
      }
      return Response.json(out);
    }

    // ── Diagnóstico de integración (pixel + página + cuenta) ────────────────
    if (action === 'diagnostico') {
      const out = { ok: true, account_id: accountId };

      // Cuenta publicitaria
      const acctRes = await fetch(`${base}/${accountId}?fields=name,currency,account_status&access_token=${t}`);
      const acct = await acctRes.json();
      if (acct.error) return Response.json({ ok: false, ...diagnoseMetaError(acct.error) });
      out.account = { name: acct.name, currency: acct.currency, status: acct.account_status, status_ok: acct.account_status === 1 };

      // Píxeles (datasets) de la cuenta + su última actividad
      const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id,name,last_fired_time,is_unavailable&access_token=${t}`);
      const pix = await pixRes.json();
      out.pixels = (pix.data || []).map(p => ({
        id: p.id,
        name: p.name,
        last_fired_time: p.last_fired_time || null,
        active: !p.is_unavailable && !!p.last_fired_time,
      }));
      out.pixel_ok = out.pixels.some(p => p.active);

      // Página de Facebook asignada al System User
      const pgRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
      const pg = await pgRes.json();
      out.pages = (pg.data || []).map(p => ({ id: p.id, name: p.name }));
      out.page_ok = out.pages.length > 0;

      // Conjunto Instagram conectado (vía página)
      out.instagram_ok = false;
      if (out.pages[0]) {
        const igRes = await fetch(`${base}/${out.pages[0].id}?fields=instagram_business_account{id,username}&access_token=${t}`);
        const ig = await igRes.json();
        if (ig.instagram_business_account) {
          out.instagram = { id: ig.instagram_business_account.id, username: ig.instagram_business_account.username };
          out.instagram_ok = true;
        }
      }

      out.todo_ok = out.account.status_ok && out.pixel_ok && out.page_ok;
      return Response.json(out);
    }

    // ── Eventos del pixel por tipo + frecuencia (últimos 28 días) ───────────
    if (action === 'pixel_events') {
      const pixRes = await fetch(`${base}/${accountId}/adspixels?fields=id,name,last_fired_time&access_token=${t}`);
      const pix = await pixRes.json();
      if (pix.error) return Response.json({ ok: false, ...diagnoseMetaError(pix.error) });
      const out = { ok: true, pixels: [] };
      for (const p of (pix.data || [])) {
        const stats = await fetch(`${base}/${p.id}/stats?aggregation=event&start_time=${Math.floor(Date.now()/1000) - 28*86400}&access_token=${t}`);
        const sj = await stats.json();
        const counts = {};
        for (const row of (sj.data || [])) {
          const arr = Array.isArray(row.data) ? row.data : [row];
          for (const d of arr) {
            const ev = d.value || d.event || d.event_type;
            const c = Number(d.count || d.value_count || 0);
            if (ev && typeof ev === 'string') counts[ev] = (counts[ev] || 0) + c;
          }
        }
        out.pixels.push({
          id: p.id, name: p.name, last_fired_time: p.last_fired_time || null,
          events: Object.entries(counts).map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count),
        });
      }
      return Response.json(out);
    }

    // ── Posts recientes de la Página (Facebook) ─────────────────────────────
    if (action === 'fb_posts') {
      const pgRes = await fetch(`${base}/me/accounts?fields=id,name,access_token&limit=5&access_token=${t}`);
      const pg = await pgRes.json();
      if (pg.error) return Response.json({ ok: false, ...diagnoseMetaError(pg.error) });
      const page = (pg.data || [])[0];
      if (!page) return Response.json({ ok: false, error: 'No hay Página de Facebook conectada al System User.' });
      const pageToken = page.access_token || token;
      const postsRes = await fetch(`${base}/${page.id}/posts?fields=id,message,created_time,permalink_url,shares,likes.summary(true),comments.summary(true)&limit=15&access_token=${encodeURIComponent(pageToken)}`);
      const posts = await postsRes.json();
      if (posts.error) return Response.json({ ok: false, ...diagnoseMetaError(posts.error) });
      return Response.json({
        ok: true, page: { id: page.id, name: page.name },
        posts: (posts.data || []).map(p => ({
          id: p.id, message: p.message || '', created_time: p.created_time, url: p.permalink_url,
          likes: p.likes?.summary?.total_count ?? 0, comments: p.comments?.summary?.total_count ?? 0, shares: p.shares?.count ?? 0,
        })),
      });
    }

    // ── Posts recientes de Instagram business + insights de cuenta ──────────
    if (action === 'ig_posts') {
      const pgRes = await fetch(`${base}/me/accounts?fields=id,instagram_business_account{id,username,followers_count,media_count}&limit=5&access_token=${t}`);
      const pg = await pgRes.json();
      if (pg.error) return Response.json({ ok: false, ...diagnoseMetaError(pg.error) });
      const igAcct = (pg.data || []).map(p => p.instagram_business_account).find(Boolean);
      if (!igAcct) return Response.json({ ok: false, error: 'No hay cuenta de Instagram business conectada.' });
      const mediaRes = await fetch(`${base}/${igAcct.id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=15&access_token=${t}`);
      const media = await mediaRes.json();
      if (media.error) return Response.json({ ok: false, ...diagnoseMetaError(media.error) });
      return Response.json({
        ok: true,
        instagram: { id: igAcct.id, username: igAcct.username, followers: igAcct.followers_count ?? null, media_count: igAcct.media_count ?? null },
        posts: (media.data || []).map(m => ({
          id: m.id, caption: m.caption || '', type: m.media_type, url: m.permalink, image: m.media_url,
          timestamp: m.timestamp, likes: m.like_count ?? 0, comments: m.comments_count ?? 0,
        })),
      });
    }

    // ── Listar campañas con su estado y presupuesto ─────────────────────────
    if (action === 'list_campaigns') {
      const fields = 'id,name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time';
      const res = await fetch(`${base}/${accountId}/campaigns?fields=${fields}&limit=200&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const campaigns = (data.data || []).map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,                    // ACTIVE | PAUSED
        effective_status: c.effective_status,
        objective: c.objective,
        daily_budget_clp: c.daily_budget ? Number(c.daily_budget) : null,
        lifetime_budget_clp: c.lifetime_budget ? Number(c.lifetime_budget) : null,
      }));
      return Response.json({ ok: true, count: campaigns.length, campaigns });
    }

    // ── Listar TODOS los ad sets de la cuenta o de una campaña ──────────────
    // A diferencia de metaAdsDeepDive(scope:'adsets') que usa Insights (solo ad
    // sets con gasto > $0), esta acción lista los OBJETOS ad set directamente,
    // incluyendo los que están vacíos o sin entregar. Es lo que el agente usa
    // para encontrar ad sets por nombre sin pedirle IDs al founder.
    if (action === 'list_adsets') {
      const parent = body.campaign_id || accountId;
      const fields = 'id,name,status,effective_status,daily_budget,lifetime_budget,campaign_id,optimization_goal,billing_event,configured_status';
      const res = await fetch(`${base}/${parent}/adsets?fields=${fields}&limit=300&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const adsets = (data.data || []).map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        effective_status: a.effective_status,
        daily_budget_clp: a.daily_budget ? Number(a.daily_budget) : null,
        lifetime_budget_clp: a.lifetime_budget ? Number(a.lifetime_budget) : null,
        campaign_id: a.campaign_id || null,
        optimization_goal: a.optimization_goal || null,
        billing_event: a.billing_event || null,
      }));
      return Response.json({ ok: true, count: adsets.length, adsets, campaign_id: body.campaign_id || null });
    }

    // ── Listar TODOS los anuncios de la cuenta, una campaña o un ad set ─────
    // Lista los objetos ad directamente (incluye anuncios sin gasto / en revisión).
    if (action === 'list_ads') {
      const parent = body.campaign_id || body.adset_id || accountId;
      const fields = 'id,name,status,effective_status,adset_id,campaign_id,creative_id,configured_status';
      const res = await fetch(`${base}/${parent}/ads?fields=${fields}&limit=300&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const ads = (data.data || []).map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        effective_status: a.effective_status,
        adset_id: a.adset_id || null,
        campaign_id: a.campaign_id || null,
        creative_id: a.creative_id || null,
      }));
      return Response.json({ ok: true, count: ads.length, ads, scope: body.campaign_id ? 'campaign' : (body.adset_id ? 'adset' : 'account') });
    }

    // Las demás acciones operan sobre un objeto concreto
    const entityType = body.entity_type;   // campaign | adset | ad
    const id = body.id;
    if (!id) return Response.json({ ok: false, error: 'Falta el ID del objeto a modificar.' });
    if (!['campaign', 'adset', 'ad'].includes(entityType)) {
      return Response.json({ ok: false, error: "entity_type debe ser 'campaign', 'adset' o 'ad'." });
    }

    // ── Pausar / Activar ────────────────────────────────────────────────────
    if (action === 'pause' || action === 'activate') {
      const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';
      const res = await fetch(`${base}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, access_token: token }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, entity_type: entityType, id, new_status: newStatus });
    }

    // ── Cambiar presupuesto diario (solo campaign o adset) ──────────────────
    if (action === 'set_daily_budget') {
      if (entityType === 'ad') {
        return Response.json({ ok: false, error: 'El presupuesto se ajusta a nivel de campaña o ad set, no de anuncio individual.' });
      }
      const clp = Math.round(Number(body.daily_budget_clp || 0));
      if (!clp || clp < 1000) {
        return Response.json({ ok: false, error: 'daily_budget_clp inválido. Indica un monto en CLP (mínimo ~$1.000).' });
      }
      // CLP no tiene decimales → la unidad mínima es el peso entero.
      const res = await fetch(`${base}/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget: String(clp), access_token: token }),
      });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, entity_type: entityType, id, daily_budget_clp: clp });
    }

    // ── Eliminar (solo campaign / adset / ad) ───────────────────────────────
    if (action === 'delete') {
      const res = await fetch(`${base}/${id}?access_token=${t}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, entity_type: entityType, id, deleted: data.success !== false });
    }

    return Response.json({ ok: false, error: `Acción no soportada: ${action}` });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
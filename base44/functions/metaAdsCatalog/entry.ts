import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCatalog · Gestiona el CATÁLOGO de productos y los anuncios dinámicos
// de catálogo (DPA / Advantage+ Catalog Ads).
// ----------------------------------------------------------------------------
// Esto es venta automática pura: Meta muestra a cada persona el producto
// correcto del catálogo según su intención/comportamiento, sin crear anuncios
// manualmente uno por uno. Era el gran faltante para reemplazar a una agencia.
//
// Acciones (action):
//   - 'list_catalogs'      : lista los catálogos del Business asociado.
//   - 'catalog_products'   : { catalog_id } lista productos de un catálogo.
//   - 'create_dpa'         : crea una campaña Advantage+ Catalog (DPA) que
//                            recorre TODO el catálogo (o un product_set) y
//                            arma anuncios dinámicos. PAUSED.
//   - 'delete_product'     : { catalog_id, product_id } elimina un producto.
//   - 'delete_all_products': { catalog_id } elimina TODOS los productos del catálogo.
//   - 'add_feed'           : { catalog_id, feed_url, name } conecta un feed RSS
//                            (scheduled fetch) al catálogo para auto-sincronizar.
//   - 'list_feeds'         : { catalog_id } lista los feeds configurados.
//   - 'delete_catalog'     : { catalog_id } elimina el catálogo completo.
//
// Payload create_dpa:
// {
//   action: 'create_dpa',
//   catalog_id: string,              // catálogo a promocionar (obligatorio)
//   product_set_id?: string,         // subconjunto; si falta, usa todo el catálogo
//   campaign_name?: string,
//   daily_budget_clp: number,        // mín ~$1.000
//   countries?: string[],            // default ['CL']
//   primary_text?: string,           // copy con {{product.name}} permitido
//   retargeting?: boolean,           // true = solo a quienes vieron productos (DPA retargeting)
//   retargeting_days?: number,       // ventana de retargeting, default 14
// }
// ============================================================================

const GRAPH_VERSION = 'v21.0';
const PEYU_PIXEL_ID = '769018551017679';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ') || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso sobre el catálogo o la cuenta. Asigna el catálogo de productos al System User en Business Settings.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido: ' + msg, detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

async function graphPost(path, params, token) {
  const t = encodeURIComponent(token);
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}?access_token=${t}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
  return res.json();
}

async function graphDelete(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}?access_token=${encodeURIComponent(token)}`, { method: 'DELETE' });
  return res.json();
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
    const action = body.action || 'list_catalogs';

    // Resolver el Business dueño de la cuenta (los catálogos cuelgan del Business).
    const acc = await graphGet(`${accountId}?fields=business`, token);
    if (acc.error) return Response.json({ ok: false, ...diagnoseMetaError(acc.error) });
    const businessId = acc?.business?.id || null;

    // ── LISTAR CATÁLOGOS ──────────────────────────────────────────────────
    if (action === 'list_catalogs') {
      if (!businessId) return Response.json({ ok: false, error: 'La cuenta no está asociada a un Business Manager, no se pueden listar catálogos.' });
      const data = await graphGet(`${businessId}/owned_product_catalogs?fields=id,name,product_count&limit=25`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const catalogs = (data.data || []).map((c) => ({ catalog_id: c.id, name: c.name, product_count: c.product_count }));
      return Response.json({
        ok: true,
        action,
        business_id: businessId,
        catalogs,
        message: catalogs.length ? `Encontré ${catalogs.length} catálogo(s).` : 'No hay catálogos de productos en el Business. Crea uno en Commerce Manager y conéctalo al feed de WooCommerce para usar anuncios dinámicos.',
      });
    }

    // ── PRODUCTOS DE UN CATÁLOGO ──────────────────────────────────────────
    if (action === 'catalog_products') {
      if (!body.catalog_id) return Response.json({ ok: false, error: 'Falta catalog_id.' });
      const data = await graphGet(`${body.catalog_id}/products?fields=id,name,retailer_id,price,availability,image_url&limit=50`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const products = (data.data || []).map((p) => ({ id: p.id, name: p.name, sku: p.retailer_id, price: p.price, availability: p.availability, image_url: p.image_url }));
      return Response.json({ ok: true, action, catalog_id: body.catalog_id, count: products.length, products });
    }

    // ── CREAR CAMPAÑA DPA (Advantage+ Catalog Ads) ────────────────────────
    if (action === 'create_dpa') {
      if (!body.catalog_id) return Response.json({ ok: false, error: 'Falta catalog_id (el catálogo a promocionar).' });
      const dailyBudget = Math.round(Number(body.daily_budget_clp || 0));
      if (!dailyBudget || dailyBudget < 1000) return Response.json({ ok: false, error: 'daily_budget_clp inválido (mínimo ~$1.000 CLP).' });

      const t = encodeURIComponent(token);
      const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
      const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
      const pagesData = await pagesRes.json();
      if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
      const page = (pagesData.data || [])[0];
      if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
      const pageId = page.id;

      const campaignName = body.campaign_name || (body.retargeting ? 'PEYU | Catálogo Retargeting (DPA)' : 'PEYU | Catálogo Dinámico (DPA)');
      const retargetingDays = Number(body.retargeting_days) || 14;

      // 1 · Campaña ventas con product_catalog_id (la marca como catálogo).
      const camp = await graphPost(`${accountId}/campaigns`, {
        name: campaignName,
        objective: 'OUTCOME_SALES',
        status: 'PAUSED',
        special_ad_categories: JSON.stringify([]),
        daily_budget: String(dailyBudget),
        promoted_object: JSON.stringify({ product_catalog_id: body.catalog_id }),
      }, token);
      if (camp.error) return Response.json({ ok: false, step: 'campaign', ...diagnoseMetaError(camp.error) });
      const campaignId = camp.id;

      // 2 · Ad set con promoted_object = catálogo + pixel. Si retargeting,
      //     product_audience_specs apunta a quienes vieron productos (ViewContent).
      const promoted = { product_set_id: body.product_set_id || undefined, pixel_id: PEYU_PIXEL_ID, custom_event_type: 'PURCHASE' };
      const targeting = { geo_locations: { countries: Array.isArray(body.countries) && body.countries.length ? body.countries : ['CL'] } };
      if (body.retargeting) {
        targeting.product_audience_specs = [{ product_set_id: body.product_set_id || undefined, inclusions: [{ retention_seconds: retargetingDays * 86400, rule: { event: { eq: 'ViewContent' } } }] }];
        targeting.excluded_product_audience_specs = [{ product_set_id: body.product_set_id || undefined, exclusions: [{ retention_seconds: retargetingDays * 86400, rule: { event: { eq: 'Purchase' } } }] }];
      }
      const adset = await graphPost(`${accountId}/adsets`, {
        name: `${campaignName} · Ad Set`,
        campaign_id: campaignId,
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'OFFSITE_CONVERSIONS',
        promoted_object: JSON.stringify(promoted),
        targeting: JSON.stringify(targeting),
        status: 'PAUSED',
      }, token);
      if (adset.error) return Response.json({ ok: false, step: 'adset', campaign_id: campaignId, ...diagnoseMetaError(adset.error) });
      const adsetId = adset.id;

      // 3 · Creativo DINÁMICO de catálogo (template_data toma datos del producto).
      const primaryText = body.primary_text || 'Diseño consciente PEYU 🌿 Lleva el tuyo con envío a todo Chile 🐢';
      const creative = await graphPost(`${accountId}/adcreatives`, {
        name: `${campaignName} · Creative DPA`,
        object_story_spec: JSON.stringify({
          page_id: pageId,
          template_data: {
            link: 'https://peyuchile.cl/CatalogoNuevo',
            message: primaryText,
            name: '{{product.name}}',
            description: '{{product.price}}',
            call_to_action: { type: 'SHOP_NOW' },
          },
        }),
        product_set_id: body.product_set_id || undefined,
      }, token);
      if (creative.error) return Response.json({ ok: false, step: 'creative', campaign_id: campaignId, ...diagnoseMetaError(creative.error) });

      const ad = await graphPost(`${accountId}/ads`, {
        name: `${campaignName} · Anuncio dinámico`,
        adset_id: adsetId,
        creative: JSON.stringify({ creative_id: creative.id }),
        status: 'PAUSED',
      }, token);
      if (ad.error) return Response.json({ ok: false, step: 'ad', ...diagnoseMetaError(ad.error) });

      return Response.json({
        ok: true,
        action,
        tipo: body.retargeting ? 'Catálogo Retargeting (DPA)' : 'Catálogo Dinámico (DPA)',
        message: `Campaña de catálogo dinámico "${campaignName}" creada en PAUSADO. Meta mostrará automáticamente el producto correcto del catálogo a cada persona${body.retargeting ? ` que vio productos en los últimos ${retargetingDays} días (excluyendo compradores)` : ''}. Revísala y actívala cuando quieras.`,
        campaign_id: campaignId,
        adset_id: adsetId,
        ad_id: ad.id,
        catalog_id: body.catalog_id,
        retargeting: !!body.retargeting,
        status: 'PAUSED',
      });
    }

    // ── ELIMINAR UN PRODUCTO ──────────────────────────────────────────────
    if (action === 'delete_product') {
      if (!body.catalog_id || !body.product_id) return Response.json({ ok: false, error: 'Falta catalog_id y product_id.' });
      const data = await graphDelete(`${body.product_id}`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, message: `Producto ${body.product_id} eliminado del catálogo.` });
    }

    // ── ELIMINAR TODOS LOS PRODUCTOS ──────────────────────────────────────
    if (action === 'delete_all_products') {
      if (!body.catalog_id) return Response.json({ ok: false, error: 'Falta catalog_id.' });
      let deleted = 0;
      let batchErrors = 0;
      let hasMore = true;
      let iterations = 0;
      while (hasMore && iterations < 25) {
        iterations++;
        const data = await graphGet(`${body.catalog_id}/products?fields=id&limit=50`, token);
        if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
        const ids = (data.data || []).map((p) => p.id);
        if (!ids.length) { hasMore = false; break; }
        // Eliminar uno por uno (Graph API no soporta batch delete de productos).
        for (const pid of ids) {
          const delRes = await graphDelete(`${pid}`, token);
          if (delRes.error) { batchErrors++; } else { deleted++; }
        }
        hasMore = !!data.paging?.next;
      }
      return Response.json({ ok: true, action, deleted, batch_errors: batchErrors, message: `Eliminados ${deleted} productos del catálogo ${body.catalog_id}.` });
    }

    // ── ACTUALIZAR URL DE UN FEED ──────────────────────────────────────────
    if (action === 'update_feed') {
      if (!body.feed_id || !body.feed_url) return Response.json({ ok: false, error: 'Falta feed_id y feed_url.' });
      const update = await graphPost(`${body.feed_id}`, { url: body.feed_url, name: body.name || 'Feed PEYU (Base44)' }, token);
      if (update.error) return Response.json({ ok: false, ...diagnoseMetaError(update.error) });
      // Forzar un upload inmediato del nuevo feed.
      const upload = await graphPost(`${body.feed_id}/uploads`, { url: body.feed_url }, token);
      return Response.json({
        ok: true,
        action,
        feed_id: body.feed_id,
        upload_id: upload?.id || null,
        upload_error: upload?.error ? diagnoseMetaError(upload.error) : null,
        message: `Feed actualizado a ${body.feed_url}. ${upload?.id ? 'Upload iniciado.' : 'Upload pendiente (se sincronizará en el próximo schedule).'}`,
      });
    }

    // ── LISTAR FEEDS DEL CATÁLOGO ─────────────────────────────────────────
    if (action === 'list_feeds') {
      if (!body.catalog_id) return Response.json({ ok: false, error: 'Falta catalog_id.' });
      const data = await graphGet(`${body.catalog_id}/product_feeds?fields=id,name,schedule,url&limit=25`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      const feeds = (data.data || []).map((f) => ({ feed_id: f.id, name: f.name, url: f.url, schedule: f.schedule }));
      return Response.json({ ok: true, action, feeds });
    }

    // ── CONECTAR FEED RSS (scheduled fetch) ───────────────────────────────
    if (action === 'add_feed') {
      if (!body.catalog_id || !body.feed_url) return Response.json({ ok: false, error: 'Falta catalog_id y feed_url.' });
      const feedName = body.name || 'Feed PEYU (Base44)';
      const feed = await graphPost(`${body.catalog_id}/product_feeds`, {
        name: feedName,
        schedule: JSON.stringify({
          interval: 'HOURLY',
          hour: 0,
          minute: 0,
          timezone: 'America/Santiago',
        }),
      }, token);
      if (feed.error) return Response.json({ ok: false, ...diagnoseMetaError(feed.error) });
      // Subir el archivo de feed vía URL (upload).
      const upload = await graphPost(`${feed.id}/uploads`, {
        url: body.feed_url,
      }, token);
      if (upload.error) return Response.json({ ok: false, step: 'upload', feed_id: feed.id, ...diagnoseMetaError(upload.error) });
      return Response.json({
        ok: true,
        action,
        feed_id: feed.id,
        upload_id: upload.id,
        message: `Feed conectado al catálogo. Meta sincronizará los productos desde ${body.feed_url} cada hora.`,
      });
    }

    // ── ELIMINAR CATÁLOGO COMPLETO ────────────────────────────────────────
    if (action === 'delete_catalog') {
      if (!body.catalog_id) return Response.json({ ok: false, error: 'Falta catalog_id.' });
      const data = await graphDelete(`${body.catalog_id}`, token);
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      return Response.json({ ok: true, action, message: `Catálogo ${body.catalog_id} eliminado.` });
    }

    return Response.json({ ok: false, error: "action debe ser 'list_catalogs', 'catalog_products', 'create_dpa', 'delete_product', 'delete_all_products', 'list_feeds', 'add_feed' o 'delete_catalog'." });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
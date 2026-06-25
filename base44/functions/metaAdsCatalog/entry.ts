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
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: token }),
  });
  return res.json();
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`);
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

    return Response.json({ ok: false, error: "action debe ser 'list_catalogs', 'catalog_products' o 'create_dpa'." });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
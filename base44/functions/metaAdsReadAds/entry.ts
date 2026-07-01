import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsReadAds · LEE el CONTENIDO COMPLETO de anuncios existentes en Meta.
// ----------------------------------------------------------------------------
// Resuelve la limitación que frustraba al founder: el agente podía ver los IDs
// y nombres de los anuncios pero NO su "código fuente" (imagen/video, texto,
// titular, CTA, link). Con esto el agente LEE los anuncios y los DUPLICA.
//
// MEJORAS v2:
//   - action:'resolve' + resolve_id → auto-detecta si el ID es campaign/adset/ad
//     y devuelve su contenido. El agente NUNCA se queda atrapado con un ID ambiguo.
//   - effective_status filter al listar → incluye ads PAUSED, IN_REVIEW, etc.
//   - updated_adcreatives edge → detecta CAMBIOS SIN PUBLICAR (drafts) y los lee.
//
// Payload:
//   { campaign_id }         → todos los anuncios de la campaña
//   { adset_id }            → todos los anuncios de un ad set
//   { ad_id }               → un anuncio puntual ( + draft si tiene cambios sin publicar)
//   { action:'resolve', resolve_id } → auto-detecta el tipo de objeto y lo lee
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
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado. Regenera el token del System User con ads_read + ads_management.', detail: msg };
  if (code === 200 || code === 10 || code === 272) return { reason: 'sin_permiso', error: 'El System User no tiene permiso ads_read sobre la cuenta. Asigna la cuenta en Meta Business Settings.', detail: msg };
  if (code === 100) return { reason: 'no_encontrado', error: 'Recurso no encontrado. Revisa el campaign_id / adset_id / ad_id.', detail: msg };
  if (code === 17 || code === 4 || code === 80004) return { reason: 'rate_limit', error: 'Meta está limitando consultas. Reintenta en unos minutos.', detail: msg };
  return { reason: 'otro', error: msg, detail: msg };
}

function parseCarouselCards(link, afs) {
  const children = Array.isArray(link.child_attachments) ? link.child_attachments : [];
  if (children.length) {
    return children.map((c) => ({
      image_hash: c.image_hash || null,
      image_url: c.picture || c.image_url || '',
      headline: c.name || '',
      description: c.description || '',
      link: c.link || (c.call_to_action?.value?.link) || '',
      cta: c.call_to_action?.type || '',
    }));
  }
  const imgs = Array.isArray(afs.images) ? afs.images : [];
  if (imgs.length > 1) {
    return imgs.map((im, i) => ({
      image_hash: im.hash || null,
      image_url: im.url || '',
      headline: (Array.isArray(afs.titles) && (afs.titles[i] || afs.titles[0])?.text) || '',
      description: (Array.isArray(afs.descriptions) && (afs.descriptions[i] || afs.descriptions[0])?.text) || '',
      link: (Array.isArray(afs.link_urls) && (afs.link_urls[i] || afs.link_urls[0])?.website_url) || '',
      cta: (Array.isArray(afs.call_to_action_types) && afs.call_to_action_types[0]) || '',
    }));
  }
  return [];
}

function parseCreative(creative) {
  if (!creative) return null;
  const oss = creative.object_story_spec || {};
  const link = oss.link_data || {};
  const video = oss.video_data || {};
  const cta = (link.call_to_action || video.call_to_action || {}) || {};
  const afs = creative.asset_feed_spec || {};
  const cards = parseCarouselCards(link, afs);
  const is_carousel = cards.length >= 2;

  const primary_text = link.message || video.message
    || (Array.isArray(afs.bodies) && afs.bodies[0]?.text) || creative.body || '';
  const headline = link.name
    || (Array.isArray(afs.titles) && afs.titles[0]?.text) || creative.title || '';
  const description = link.description
    || (Array.isArray(afs.descriptions) && afs.descriptions[0]?.text) || '';
  const linkUrl = link.link || cta?.value?.link
    || (Array.isArray(afs.link_urls) && afs.link_urls[0]?.website_url) || creative.link_url || '';
  const image_url = link.picture || video.image_url || creative.image_url || creative.thumbnail_url || '';
  const image_hash = link.image_hash || (Array.isArray(afs.images) && afs.images[0]?.hash) || creative.image_hash || null;
  const video_id = video.video_id || (Array.isArray(afs.videos) && afs.videos[0]?.video_id) || null;

  return {
    primary_text, headline, description,
    cta: cta?.type || (Array.isArray(afs.call_to_action_types) && afs.call_to_action_types[0]) || '',
    link: linkUrl, image_url, image_hash, video_id,
    is_carousel, cards,
    page_id: oss.page_id || null,
    instagram_actor_id: oss.instagram_actor_id || creative.instagram_actor_id || null,
  };
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
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;
    const t = encodeURIComponent(token);

    const creativeFields = 'id,name,object_story_spec,asset_feed_spec,image_url,thumbnail_url,body,title,link_url,image_hash,instagram_actor_id';
    const adFields = `id,name,status,effective_status,adset_id,creative{${creativeFields}}`;

    // ── RESOLVE: auto-detecta el tipo de objeto (campaign | adset | ad) ──────
    // El agente a veces confunde IDs. Esta acción prueba el ID como campaña,
    // ad set y anuncio, y devuelve el tipo correcto + su contenido completo.
    if (body.action === 'resolve' || body.resolve_id) {
      const objId = body.resolve_id || body.ad_id;
      if (!objId) return Response.json({ ok: false, error: 'Falta resolve_id.' });

      // 1) ¿Es una campaña?
      const campRes = await fetch(`${base}/${objId}?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget&access_token=${t}`);
      const camp = await campRes.json();
      if (!camp.error && camp.objective !== undefined) {
        const adsetsRes = await fetch(`${base}/${objId}/adsets?fields=id,name,status,effective_status,daily_budget&limit=100&access_token=${t}`);
        const adsets = await adsetsRes.json();
        const adsRes = await fetch(`${base}/${objId}/ads?fields=${adFields}&limit=100&access_token=${t}`);
        const adsData = await adsRes.json();
        const parsedAds = (adsData.data || []).map(a => ({
          ad_id: a.id, ad_name: a.name, status: a.status, effective_status: a.effective_status,
          adset_id: a.adset_id, creative_id: a.creative?.id, content: parseCreative(a.creative),
        }));
        return Response.json({
          ok: true, resolved: true, type: 'campaign', id: objId,
          name: camp.name, status: camp.status, effective_status: camp.effective_status,
          objective: camp.objective,
          daily_budget_clp: camp.daily_budget ? Number(camp.daily_budget) : null,
          lifetime_budget_clp: camp.lifetime_budget ? Number(camp.lifetime_budget) : null,
          adsets: (adsets.data || []).map(a => ({ id: a.id, name: a.name, status: a.status, effective_status: a.effective_status, daily_budget_clp: a.daily_budget ? Number(a.daily_budget) : null })),
          ads: parsedAds, ad_count: parsedAds.length,
        });
      }

      // 2) ¿Es un ad set?
      const adsetRes = await fetch(`${base}/${objId}?fields=id,name,status,effective_status,daily_budget,campaign_id&access_token=${t}`);
      const adset = await adsetRes.json();
      if (!adset.error && (adset.campaign_id !== undefined || adset.daily_budget !== undefined)) {
        const adsRes = await fetch(`${base}/${objId}/ads?fields=${adFields}&limit=100&access_token=${t}`);
        const adsData = await adsRes.json();
        const parsedAds = (adsData.data || []).map(a => ({
          ad_id: a.id, ad_name: a.name, status: a.status, effective_status: a.effective_status,
          adset_id: a.adset_id, creative_id: a.creative?.id, content: parseCreative(a.creative),
        }));
        return Response.json({
          ok: true, resolved: true, type: 'adset', id: objId,
          name: adset.name, status: adset.status, effective_status: adset.effective_status,
          campaign_id: adset.campaign_id || null,
          daily_budget_clp: adset.daily_budget ? Number(adset.daily_budget) : null,
          ads: parsedAds, ad_count: parsedAds.length,
        });
      }

      // 3) ¿Es un anuncio? (con detección de cambios sin publicar)
      const adRes = await fetch(`${base}/${objId}?fields=${adFields}&access_token=${t}`);
      const adData = await adRes.json();
      if (!adData.error && (adData.creative !== undefined || adData.adset_id !== undefined)) {
        let draftContent = null;
        const draftRes = await fetch(`${base}/${objId}/updated_adcreatives?fields=${creativeFields}&access_token=${t}`);
        const draft = await draftRes.json();
        if (!draft.error && draft.data && draft.data.length > 0) {
          draftContent = parseCreative(draft.data[0]);
        }
        return Response.json({
          ok: true, resolved: true, type: 'ad', id: objId,
          ad_name: adData.name, status: adData.status, effective_status: adData.effective_status,
          adset_id: adData.adset_id, creative_id: adData.creative?.id,
          content: parseCreative(adData.creative),
          has_unpublished_changes: !!draftContent,
          draft_content: draftContent,
          nota: draftContent ? '⚠️ CAMBIOS SIN PUBLICAR: draft_content = borrador, content = publicado.' : null,
        });
      }

      // 4) No se pudo resolver
      return Response.json({
        ok: false, resolved: false,
        error: `No se pudo resolver el ID ${objId} como campaña, ad set ni anuncio. Posibles causas: ID incorrecto, objeto eliminado, o el System User no tiene permiso sobre el objeto.`,
        hint: 'Usa metaAdsManage(list_campaigns) o metaAdsManage(list_adsets) para encontrar el ID correcto.',
      });
    }

    let ads = [];

    // ── Leer un anuncio individual (con detección de drafts) ────────────────
    if (body.ad_id) {
      const res = await fetch(`${base}/${body.ad_id}?fields=${adFields}&access_token=${t}`);
      const data = await res.json();
      if (data.error) {
        return Response.json({
          ok: false, ...diagnoseMetaError(data.error),
          hint: `Si ${body.ad_id} no es un ad_id, usa action:'resolve' con resolve_id:'${body.ad_id}' para auto-detectar el tipo de objeto.`,
        });
      }
      // Verificar si tiene cambios sin publicar (updated_adcreatives)
      let draftContent = null;
      const draftRes = await fetch(`${base}/${body.ad_id}/updated_adcreatives?fields=${creativeFields}&access_token=${t}`);
      const draft = await draftRes.json();
      if (!draft.error && draft.data && draft.data.length > 0) {
        draftContent = parseCreative(draft.data[0]);
      }
      const parsed = [{
        ad_id: data.id,
        ad_name: data.name,
        status: data.status,
        effective_status: data.effective_status,
        adset_id: data.adset_id || null,
        creative_id: data.creative?.id || null,
        content: parseCreative(data.creative),
        has_unpublished_changes: !!draftContent,
        draft_content: draftContent,
      }];
      return Response.json({
        ok: true, count: parsed.length, ads: parsed,
        nota: draftContent
          ? '⚠️ CAMBIOS SIN PUBLICAR: draft_content = borrador, content = publicado. Usa draft_content para ver los cambios pendientes.'
          : 'content trae copy, titular, descripción, CTA, link e imagen/video. Sin cambios sin publicar.',
      });
    }

    // ── Listar anuncios de una campaña o ad set ─────────────────────────────
    // effective_status filter incluye TODOS los estados (no solo ACTIVE por defecto)
    const parent = body.adset_id || body.campaign_id;
    if (!parent) return Response.json({ ok: false, error: 'Indica campaign_id, adset_id, ad_id o action:"resolve" con resolve_id.' });
    const statusFilter = encodeURIComponent(JSON.stringify(['ACTIVE', 'PAUSED', 'CAMPAIGN_PAUSED', 'ADSET_PAUSED', 'IN_REVIEW', 'DISAPPROVED', 'ARCHIVED', 'DELETED']));
    const res = await fetch(`${base}/${parent}/ads?fields=${adFields}&limit=100&effective_status=${statusFilter}&access_token=${t}`);
    const data = await res.json();
    if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
    ads = data.data || [];

    const parsed = ads.map((a) => ({
      ad_id: a.id,
      ad_name: a.name,
      status: a.status,
      effective_status: a.effective_status,
      adset_id: a.adset_id || null,
      creative_id: a.creative?.id || null,
      content: parseCreative(a.creative),
    }));

    return Response.json({
      ok: true,
      count: parsed.length,
      ads: parsed,
      nota: 'content trae copy, titular, descripción, CTA, link e imagen/video de cada anuncio. Si content.is_carousel es true, content.cards[] trae cada tarjeta (image_hash, headline, description, link) — pásalas tal cual a metaAdsCreateCarousel para duplicar el carrusel. Anuncios simples se duplican con metaAdsCreateMultiAd.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
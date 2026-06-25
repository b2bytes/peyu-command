import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsReadAds · LEE el CONTENIDO COMPLETO de anuncios existentes en Meta.
// ----------------------------------------------------------------------------
// Resuelve la limitación que frustraba al founder: el agente podía ver los IDs
// y nombres de los anuncios (metaAdsDeepDive) pero NO su "código fuente" (la
// imagen/video, el texto principal, el titular, la descripción, el CTA y el
// link de destino). Con esto el agente puede LEER esos anuncios y luego
// DUPLICARLOS en una campaña nueva con otro objetivo (vía metaAdsCreateMultiAd).
//
// Payload:
//   { campaign_id: '123' }   → todos los anuncios de la campaña con su creativo
//   { adset_id: '456' }      → todos los anuncios de un ad set
//   { ad_id: '789' }         → un anuncio puntual
//
// Devuelve por cada anuncio: id, name, status, y un objeto `content` con
// { primary_text, headline, description, cta, link, image_url, video_id,
//   image_hash, page_id, instagram_actor_id } listo para re-crear el anuncio.
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

// Extrae el contenido reutilizable desde el object_story_spec / asset_feed_spec
// del creativo, contemplando los formatos típicos (link_data, video_data, y los
// nuevos asset_feed_spec de las campañas Advantage+).
// Lee las tarjetas de un carrusel (child_attachments en link_data, o el
// asset_feed_spec de los carruseles Advantage+). Devuelve [] si no es carrusel.
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
  // Carrusel armado vía asset_feed_spec: varias imágenes => varias tarjetas.
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

  // Texto principal: link_data.message → video.message → asset_feed_spec.bodies
  const primary_text = link.message || video.message
    || (Array.isArray(afs.bodies) && afs.bodies[0]?.text) || creative.body || '';
  // Titular: link_data.name → asset_feed_spec.titles
  const headline = link.name
    || (Array.isArray(afs.titles) && afs.titles[0]?.text) || creative.title || '';
  // Descripción
  const description = link.description
    || (Array.isArray(afs.descriptions) && afs.descriptions[0]?.text) || '';
  // Link de destino
  const linkUrl = link.link || cta?.value?.link
    || (Array.isArray(afs.link_urls) && afs.link_urls[0]?.website_url) || creative.link_url || '';
  // Imagen / video
  const image_url = link.picture || video.image_url || creative.image_url || creative.thumbnail_url || '';
  const image_hash = link.image_hash || (Array.isArray(afs.images) && afs.images[0]?.hash) || creative.image_hash || null;
  const video_id = video.video_id || (Array.isArray(afs.videos) && afs.videos[0]?.video_id) || null;

  return {
    primary_text,
    headline,
    description,
    cta: cta?.type || (Array.isArray(afs.call_to_action_types) && afs.call_to_action_types[0]) || '',
    link: linkUrl,
    image_url,
    image_hash,
    video_id,
    is_carousel,
    cards,                       // tarjetas del carrusel (vacío si no es carrusel)
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

    // Campos del creativo que contienen el contenido reutilizable del anuncio.
    const creativeFields = 'id,name,object_story_spec,asset_feed_spec,image_url,thumbnail_url,body,title,link_url,image_hash,instagram_actor_id';
    const adFields = `id,name,status,effective_status,adset_id,creative{${creativeFields}}`;

    let ads = [];

    if (body.ad_id) {
      const res = await fetch(`${base}/${body.ad_id}?fields=${adFields}&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      ads = [data];
    } else {
      const parent = body.adset_id || body.campaign_id;
      if (!parent) return Response.json({ ok: false, error: 'Indica campaign_id, adset_id o ad_id.' });
      const res = await fetch(`${base}/${parent}/ads?fields=${adFields}&limit=100&access_token=${t}`);
      const data = await res.json();
      if (data.error) return Response.json({ ok: false, ...diagnoseMetaError(data.error) });
      ads = data.data || [];
    }

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
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsCreateCarousel · Crea un anuncio de CARRUSEL (secuencia de fotos
// deslizable) dentro de un AD SET EXISTENTE. Cada tarjeta del carrusel puede
// tener su propia imagen, título, descripción y link. El anuncio nace PAUSADO.
//
// Es la capacidad que le faltaba al agente: agrupar varias imágenes en UN solo
// creativo de carrusel (no anuncios individuales sueltos).
//
// Payload:
//   {
//     adset_id: '123',                  // ad set destino (obligatorio)
//     name?: 'Carrusel Carcasas',
//     primary_text: string,             // texto principal del anuncio (arriba)
//     cta?: 'SHOP_NOW' | 'LEARN_MORE' | ...,
//     link: string,                     // link por defecto de las tarjetas
//     see_more_url?: string,            // link de la tarjeta final "Ver más"
//     cards: [                          // 2 a 10 tarjetas
//       { image_url?, image_hash?, headline?, description?, link? },
//       ...
//     ]
//   }
// Notas:
//   - Cada tarjeta necesita una imagen: image_url (se sube para obtener hash) o
//     image_hash (de un anuncio leído con metaAdsReadAds).
//   - Si una tarjeta no trae headline/link, hereda el del anuncio.
// ============================================================================

const GRAPH_VERSION = 'v21.0';

function fmtAccountId(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  return s.startsWith('act_') ? s : `act_${s.replace(/\D/g, '')}`;
}

function diagnoseMetaError(err) {
  const code = err?.code;
  const msg = [err?.message, err?.error_user_title, err?.error_user_msg].filter(Boolean).join(' · ') || 'Error desconocido de Meta.';
  if (code === 190) return { reason: 'token_invalido', error: 'Token de Meta inválido o expirado.', detail: msg };
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para crear anuncios o gestionar la Página.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido (revisa link, imágenes o adset_id): ' + msg, detail: msg };
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

// Sube una imagen al ad account por URL y devuelve su image_hash.
async function uploadImageByUrl(accountId, url, token) {
  const data = await graphPost(`${accountId}/adimages`, { url }, token);
  if (data.error) return { error: data.error };
  // La respuesta es { images: { "<bytes>": { hash, url } } } — tomamos el primer hash.
  const images = data.images || {};
  const first = Object.values(images)[0];
  return { hash: first?.hash };
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
    const adsetId = body.adset_id;
    if (!adsetId) return Response.json({ ok: false, error: 'Falta adset_id (el ad set donde crear el carrusel).' });
    if (!body.primary_text || !body.link) {
      return Response.json({ ok: false, error: 'El carrusel necesita primary_text y link.' });
    }
    const cards = Array.isArray(body.cards) ? body.cards : [];
    if (cards.length < 2 || cards.length > 10) {
      return Response.json({ ok: false, error: 'Un carrusel necesita entre 2 y 10 tarjetas (cards).' });
    }
    if (cards.some((c) => !c.image_url && !c.image_hash)) {
      return Response.json({ ok: false, error: 'Cada tarjeta necesita una imagen (image_url o image_hash).' });
    }

    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    // Página de Facebook asociada.
    const pagesRes = await fetch(`${base}/me/accounts?fields=id,name&limit=10&access_token=${t}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return Response.json({ ok: false, ...diagnoseMetaError(pagesData.error) });
    const page = (pagesData.data || [])[0];
    if (!page) return Response.json({ ok: false, reason: 'sin_pagina', error: 'No hay Página de Facebook asignada al System User.' });
    const pageId = page.id;

    const cta = body.cta || 'SHOP_NOW';
    const adName = body.name || `Carrusel ${new Date().toISOString().slice(0, 10)}`;

    // Resolver image_hash de cada tarjeta (subiendo las que vengan por URL).
    const childAttachments = [];
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      let hash = c.image_hash;
      if (!hash && c.image_url) {
        const up = await uploadImageByUrl(accountId, c.image_url, token);
        if (up.error) return Response.json({ ok: false, step: `upload_card_${i + 1}`, ...diagnoseMetaError(up.error) });
        hash = up.hash;
      }
      if (!hash) return Response.json({ ok: false, error: `No se pudo resolver la imagen de la tarjeta ${i + 1}.` });
      const cardLink = c.link || body.link;
      childAttachments.push({
        link: cardLink,
        image_hash: hash,
        name: c.headline || body.headline || '',
        description: c.description || '',
        call_to_action: { type: cta, value: { link: cardLink } },
      });
    }

    // Carrusel = link_data con child_attachments. multi_share_optimized deja que
    // Meta ordene las tarjetas por rendimiento; end_card opcional con see_more_url.
    const linkData = {
      link: body.link,
      message: body.primary_text,
      multi_share_optimized: true,
      multi_share_end_card: true,
      child_attachments: childAttachments,
    };
    if (body.see_more_url) linkData.caption = body.see_more_url;

    const creative = await graphPost(`${accountId}/adcreatives`, {
      name: `${adName} · Creative`,
      object_story_spec: { page_id: pageId, link_data: linkData },
    }, token);
    if (creative.error) return Response.json({ ok: false, step: 'creative', ...diagnoseMetaError(creative.error) });

    const ad = await graphPost(`${accountId}/ads`, {
      name: adName,
      adset_id: adsetId,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: 'PAUSED',
    }, token);
    if (ad.error) return Response.json({ ok: false, step: 'ad', creative_id: creative.id, ...diagnoseMetaError(ad.error) });

    return Response.json({
      ok: true,
      ad_id: ad.id,
      creative_id: creative.id,
      adset_id: adsetId,
      name: adName,
      cards: childAttachments.length,
      status: 'PAUSED',
      message: `Carrusel "${adName}" creado con ${childAttachments.length} tarjetas en el ad set ${adsetId}, en PAUSADO.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsUpdateAdCreative · EDITA el creativo de un anuncio YA CREADO sin tener
// que borrarlo y recrearlo. Cierra la brecha que el agente reportaba: cambiar
// texto principal, titular, descripción, CTA o link de destino de un anuncio
// existente con un solo comando.
//
// Cómo funciona (forma correcta en Meta): los creativos son INMUTABLES, así que
// se LEE el creativo actual del anuncio, se fusionan los cambios pedidos, se
// crea un creativo NUEVO y se RE-ASIGNA al mismo ad (POST /<ad_id> creative).
// El anuncio conserva su id, ad set, historial y estadísticas — solo cambia el
// contenido. Soporta anuncios de imagen, video y CARRUSEL (child_attachments).
//
// Payload:
//   {
//     ad_id: '123',                    // anuncio a editar (obligatorio)
//     primary_text?, headline?, description?,   // textos a cambiar
//     cta?: 'LEARN_MORE'|'SHOP_NOW'|... ,       // nuevo CTA
//     link?: string,                            // nuevo link de destino
//   }
// Solo se cambia lo que venga en el payload; el resto se conserva del original.
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
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para editar este anuncio o gestionar la Página.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido (revisa ad_id, link o CTA): ' + msg, detail: msg };
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
    const adId = body.ad_id;
    if (!adId) return Response.json({ ok: false, error: 'Falta ad_id (el anuncio a editar).' });

    const noChanges = ['primary_text', 'headline', 'description', 'cta', 'link'].every((k) => body[k] == null);
    if (noChanges) return Response.json({ ok: false, error: 'Indica al menos un campo a cambiar: primary_text, headline, description, cta o link.' });

    const t = encodeURIComponent(token);
    const base = `https://graph.facebook.com/${GRAPH_VERSION}`;

    // 1) Leer el creativo actual del anuncio (para conservar imagen/video/spec).
    const creativeFields = 'id,name,object_story_spec';
    const adRes = await fetch(`${base}/${adId}?fields=id,name,adset_id,creative{${creativeFields}}&access_token=${t}`);
    const adData = await adRes.json();
    if (adData.error) return Response.json({ ok: false, step: 'read_ad', ...diagnoseMetaError(adData.error) });

    const oss = adData.creative?.object_story_spec;
    if (!oss) return Response.json({ ok: false, error: 'Este anuncio no tiene un object_story_spec editable (puede ser Advantage+ con asset_feed_spec). En ese caso recréalo con los textos nuevos.' });

    const pageId = oss.page_id;
    // Clonar el spec actual y aplicar solo los cambios pedidos.
    const newOss = JSON.parse(JSON.stringify(oss));

    const applyCta = (ctaObj, link) => {
      if (body.cta) ctaObj.type = body.cta;
      if (body.link) ctaObj.value = { ...(ctaObj.value || {}), link: body.link };
      return ctaObj;
    };

    if (newOss.link_data) {
      const ld = newOss.link_data;
      if (body.primary_text != null) ld.message = body.primary_text;
      if (body.link != null) ld.link = body.link;
      // Carrusel: child_attachments. Cambios de texto/CTA/link se propagan a cada tarjeta.
      if (Array.isArray(ld.child_attachments) && ld.child_attachments.length) {
        ld.child_attachments = ld.child_attachments.map((c) => {
          const card = { ...c };
          if (body.headline != null) card.name = body.headline;
          if (body.description != null) card.description = body.description;
          if (body.link != null) card.link = body.link;
          card.call_to_action = applyCta({ ...(card.call_to_action || {}) }, body.link || card.link);
          return card;
        });
      } else {
        // Anuncio de imagen simple.
        if (body.headline != null) ld.name = body.headline;
        if (body.description != null) ld.description = body.description;
        ld.call_to_action = applyCta({ ...(ld.call_to_action || {}) }, body.link || ld.link);
      }
    } else if (newOss.video_data) {
      const vd = newOss.video_data;
      if (body.primary_text != null) vd.message = body.primary_text;
      if (body.headline != null) vd.title = body.headline;
      if (body.description != null) vd.link_description = body.description;
      vd.call_to_action = applyCta({ ...(vd.call_to_action || {}) }, body.link);
    } else {
      return Response.json({ ok: false, error: 'Formato de creativo no editable por esta vía. Recrea el anuncio con los textos nuevos.' });
    }

    // 2) Crear un creativo NUEVO con el spec fusionado.
    const newName = `${adData.name || 'Ad'} · edit ${new Date().toISOString().slice(0, 16)}`;
    const creative = await graphPost(`${accountId}/adcreatives`, {
      name: newName,
      object_story_spec: newOss,
    }, token);
    if (creative.error) return Response.json({ ok: false, step: 'creative', ...diagnoseMetaError(creative.error) });

    // 3) Re-asignar el creativo nuevo al MISMO anuncio (conserva id, ad set y stats).
    const upd = await graphPost(`${adId}`, {
      creative: JSON.stringify({ creative_id: creative.id }),
    }, token);
    if (upd.error) return Response.json({ ok: false, step: 'reassign', creative_id: creative.id, ...diagnoseMetaError(upd.error) });

    const cambios = ['primary_text', 'headline', 'description', 'cta', 'link'].filter((k) => body[k] != null);
    return Response.json({
      ok: true,
      ad_id: adId,
      new_creative_id: creative.id,
      changed: cambios,
      message: `Anuncio ${adId} actualizado (${cambios.join(', ')}) conservando su id e historial. El anuncio no cambia de estado.`,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
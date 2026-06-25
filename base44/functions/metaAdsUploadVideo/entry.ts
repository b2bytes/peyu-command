import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// metaAdsUploadVideo · SUBE un video al ad account de Meta desde una URL pública
// y devuelve su video_id (lo que faltaba para poder hacer anuncios de video).
// ----------------------------------------------------------------------------
// El founder tiene sus propios videos. Hasta ahora el agente solo podía usar un
// video_id si YA existía en Meta. Esta función toma un video por URL (un video
// generado con agentGenerateMedia, o un MP4 subido por el founder con UploadFile)
// y lo registra en la cuenta publicitaria → entrega el video_id reutilizable en
// metaAdsCreateAd / metaAdsCreateMultiAd.
//
// Opcionalmente sube también la miniatura (foto del producto) para tenerla lista
// como thumbnail del anuncio de video.
//
// Payload:
//   {
//     video_url: string,        // URL pública del video (mp4/mov) — obligatorio
//     title?: string,           // nombre del video en la biblioteca de Meta
//     thumbnail_url?: string,   // opcional: miniatura por URL → devuelve su image_hash
//     wait_ready?: boolean,     // si true, espera a que Meta termine de procesar
//   }
// Devuelve: { ok, video_id, status, thumbnail_url?, thumbnail_hash? }
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
  if (code === 200 || code === 10 || code === 272 || code === 294) return { reason: 'sin_permiso', error: 'El System User no tiene permiso para subir videos a la cuenta.', detail: msg };
  if (code === 100) return { reason: 'parametro_invalido', error: 'Parámetro inválido (revisa video_url): ' + msg, detail: msg };
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

async function uploadImageByUrl(accountId, url, token) {
  const data = await graphPost(`${accountId}/adimages`, { url }, token);
  if (data.error) return { error: data.error };
  const first = Object.values(data.images || {})[0];
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
    if (!body.video_url) return Response.json({ ok: false, error: 'Falta video_url (la URL pública del video a subir).' });

    // 1 · Subir el video por URL al ad account (Meta lo descarga y procesa).
    const up = await graphPost(`${accountId}/advideos`, {
      file_url: body.video_url,
      ...(body.title ? { title: body.title, name: body.title } : {}),
    }, token);
    if (up.error) return Response.json({ ok: false, step: 'upload', ...diagnoseMetaError(up.error) });
    const videoId = up.id;
    if (!videoId) return Response.json({ ok: false, step: 'upload', error: 'Meta no devolvió un video_id.' });

    // 2 · Miniatura opcional (foto del producto) → image_hash listo para usar.
    let thumbnailHash = null;
    if (body.thumbnail_url) {
      const thumb = await uploadImageByUrl(accountId, body.thumbnail_url, token);
      if (thumb.hash) thumbnailHash = thumb.hash;
    }

    // 3 · Estado de procesamiento. Si wait_ready, sondeamos hasta ~30s y
    //     devolvemos la miniatura auto-generada por Meta cuando esté lista.
    let status = 'processing';
    let autoThumb = null;
    if (body.wait_ready) {
      for (let i = 0; i < 10; i++) {
        const info = await graphGet(`${videoId}?fields=status,picture`, token);
        status = info?.status?.video_status || status;
        if (status === 'ready') { autoThumb = info.picture || null; break; }
        if (status === 'error') break;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return Response.json({
      ok: true,
      video_id: videoId,
      status,
      thumbnail_hash: thumbnailHash,
      thumbnail_url: autoThumb,
      message: `Video subido a Meta (video_id ${videoId}, estado ${status}). Úsalo en metaAdsCreateAd con video_id + thumbnail_hash (la foto del producto) para crear el anuncio de video.`,
      nota: 'Un video recién subido puede tardar unos segundos/minutos en quedar "ready". Si el anuncio falla por miniatura, pasa thumbnail_hash de una foto del producto traída con metaAdsLibraryImages.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});
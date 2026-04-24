// ============================================================================
// autoIndexOnPublish — Notifica motores de búsqueda cuando publicamos algo nuevo
// ----------------------------------------------------------------------------
// Se invoca desde automations de entidad (Producto, BlogPost) al crear/activar.
// Flujo:
//   1. Construye la URL canónica pública.
//   2. Hace ping a Google (sitemap re-submit).
//   3. Hace ping a IndexNow (Bing/Yandex/Seznam/DuckDuckGo).
//   4. Registra todo en IndexationLog.
//
// Payload desde automation:
//   { event: { type, entity_name, entity_id }, data: {...} }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_HOST = 'peyuchile.cl';
const SITE_URL = `https://${SITE_HOST}/`;
const SITEMAP_URL = `${SITE_URL}sitemap.xml`;
// Key IndexNow — debe existir un archivo {INDEXNOW_KEY}.txt en la raíz del sitio.
// Si no existe aún, el ping fallará con 403 pero no rompe el flujo.
const INDEXNOW_KEY = Deno.env.get('INDEXNOW_KEY') || 'peyu-indexnow-key-2026';

function buildCanonicalUrl(entityName, data) {
  if (entityName === 'Producto') {
    const id = data?.id;
    if (!id) return null;
    return `${SITE_URL}producto/${id}`;
  }
  if (entityName === 'BlogPost') {
    const slug = data?.slug;
    if (!slug) return null;
    return `${SITE_URL}blog/${slug}`;
  }
  return null;
}

function shouldNotify(entityName, data, oldData, eventType) {
  // Producto: notificar cuando se crea activo, o cuando cambia de inactivo→activo
  if (entityName === 'Producto') {
    if (eventType === 'create') return data?.activo === true;
    if (eventType === 'update') return data?.activo === true && oldData?.activo !== true;
  }
  // BlogPost: notificar cuando se publica (estado/publicado)
  if (entityName === 'BlogPost') {
    const wasPublished = oldData?.estado === 'publicado' || oldData?.publicado === true;
    const isPublished = data?.estado === 'publicado' || data?.publicado === true;
    if (eventType === 'create') return isPublished;
    if (eventType === 'update') return isPublished && !wasPublished;
  }
  return false;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();
  const { event, data, old_data } = payload || {};

  if (!event || !data) {
    return Response.json({ skipped: true, reason: 'no event/data in payload' });
  }

  const entityName = event.entity_name;
  const eventType = event.type;

  if (!shouldNotify(entityName, data, old_data, eventType)) {
    return Response.json({ skipped: true, reason: `${entityName} ${eventType} does not require indexing notification` });
  }

  const canonicalUrl = buildCanonicalUrl(entityName, data);
  if (!canonicalUrl) {
    return Response.json({ skipped: true, reason: 'could not build canonical url' });
  }

  const results = { canonical_url: canonicalUrl, google_ping: null, indexnow: null };

  // 1. Google ping — solicita re-crawl del sitemap
  try {
    const gRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    results.google_ping = { ok: gRes.ok, status: gRes.status };
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'google_ping',
      site_url: SITE_URL,
      target_url: canonicalUrl,
      sitemap_url: SITEMAP_URL,
      status: gRes.ok ? 'success' : 'error',
      http_code: gRes.status,
      response_summary: `Auto-ping Google tras ${entityName} ${eventType} → ${gRes.status}`,
    });
  } catch (e) {
    results.google_ping = { ok: false, error: e.message };
  }

  // 2. IndexNow — Bing, Yandex, Seznam, DuckDuckGo
  try {
    const inRes = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: [canonicalUrl],
      }),
    });
    results.indexnow = { ok: inRes.ok, status: inRes.status };
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'indexnow_ping',
      site_url: SITE_URL,
      target_url: canonicalUrl,
      status: inRes.ok ? 'success' : 'error',
      http_code: inRes.status,
      pages_submitted: 1,
      response_summary: `Auto-IndexNow tras ${entityName} ${eventType} → ${inRes.status}`,
    });
  } catch (e) {
    results.indexnow = { ok: false, error: e.message };
  }

  return Response.json({ success: true, ...results });
});
// ============================================================================
// PEYU · syncToMerchantCenter
// ----------------------------------------------------------------------------
// Empuja TODOS los productos elegibles a Google Merchant Center y otros
// motores de búsqueda en una sola operación:
//
//   1. Ping a Google con el feed XML → fuerza crawl del catálogo entero.
//   2. Re-submit del sitemap a Google Search Console (productos están ahí).
//   3. IndexNow blast (Bing/Yandex/Seznam/DuckDuckGo) con TODAS las URLs
//      de producto en un solo POST (la API acepta hasta 10.000 URLs).
//   4. Log completo en IndexationLog con conteo de elegibles vs total.
//
// Admin-only. Llamar desde el panel de productos con un click.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_HOST = 'peyuchile.cl';
const SITE_URL = `https://${SITE_HOST}/`;
const SITEMAP_URL = `${SITE_URL}sitemap.xml`;
const INDEXNOW_KEY = Deno.env.get('INDEXNOW_KEY') || 'peyu-indexnow-key-2026';

// Mismos criterios que googleMerchantFeed para mantener consistencia.
function esElegible(p) {
  if (!p) return false;
  if (p.activo === false) return false;
  if (p.canal === 'B2B Exclusivo') return false;
  if (!p.precio_b2c || p.precio_b2c <= 0) return false;
  if (!p.nombre || p.nombre.length < 3) return false;
  if (!p.id) return false;
  // Al menos una imagen (igual que el feed XML real)
  const galeria = Array.isArray(p.galeria_urls) ? p.galeria_urls : [];
  const hasImg = galeria.length > 0 || p.imagen_promo_url || p.imagen_url;
  if (!hasImg) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 🔒 Admin-only: este endpoint dispara crawls masivos
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Recolectar elegibles
    const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
    const elegibles = (productos || []).filter(esElegible);
    const urls = elegibles.map(p => `${SITE_URL}producto/${p.id}`);

    const results = {
      total_products: productos?.length || 0,
      eligible: elegibles.length,
      skipped: (productos?.length || 0) - elegibles.length,
      google_ping: null,
      gsc_sitemap: null,
      indexnow: null,
    };

    // 2. Google ping del sitemap (esto le dice a Google "vení a buscar el feed")
    try {
      const gRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
      results.google_ping = { ok: gRes.ok, status: gRes.status };
    } catch (e) {
      results.google_ping = { ok: false, error: e.message };
    }

    // 3. GSC sitemap re-submit (vía connector autorizado, si está conectado)
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
      const gscRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );
      results.gsc_sitemap = { ok: gscRes.ok, status: gscRes.status };
    } catch (e) {
      results.gsc_sitemap = { ok: false, error: e.message };
    }

    // 4. IndexNow blast — un POST con todas las URLs (Bing/Yandex/etc.)
    if (urls.length > 0) {
      try {
        const inRes = await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: SITE_HOST,
            key: INDEXNOW_KEY,
            keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
            urlList: urls,
          }),
        });
        results.indexnow = { ok: inRes.ok, status: inRes.status, urls_sent: urls.length };
      } catch (e) {
        results.indexnow = { ok: false, error: e.message };
      }
    } else {
      results.indexnow = { ok: false, error: 'No eligible URLs to submit' };
    }

    // 5. Log único consolidado
    const allOk = results.google_ping?.ok && results.indexnow?.ok;
    try {
      await base44.asServiceRole.entities.IndexationLog.create({
        action_type: 'sitemap_submit',
        site_url: SITE_URL,
        sitemap_url: SITEMAP_URL,
        status: allOk ? 'success' : 'partial',
        pages_submitted: urls.length,
        response_summary: `Merchant Center sync · ${elegibles.length} productos elegibles enviados (Google ping ${results.google_ping?.status || 'ERR'}, IndexNow ${results.indexnow?.status || 'ERR'}, GSC ${results.gsc_sitemap?.status || 'skip'})`,
        notes: `Skipped: ${results.skipped} (inactivos/B2B exclusivo/sin imagen/sin precio)`,
      });
    } catch (e) {
      console.warn('IndexationLog insert failed:', e.message);
    }

    return Response.json({
      success: true,
      feed_url: `${SITE_URL}googleMerchantFeed`,
      ...results,
    });
  } catch (err) {
    console.error('syncToMerchantCenter error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
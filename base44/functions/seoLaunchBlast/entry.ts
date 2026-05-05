// ============================================================================
// PEYU · seoLaunchBlast
// ----------------------------------------------------------------------------
// One-click SEO launch: orquesta TODA la indexación de peyuchile.cl en una
// sola llamada. Pensado para el día del lanzamiento.
//
// Fases (todas en paralelo donde es posible):
//   1. Generar sitemap fresco (sitemap.xml) — uploaded
//   2. Submit sitemap a GSC (peyuchile.cl)
//   3. Ping a Google y Bing webmaster tools
//   4. IndexNow blast (Bing/Yandex/Seznam) si se provee key
//   5. Submit GSC para peyuchile.lat (si aplica)
//
// Body: { indexnow_key?: string, also_lat?: boolean }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';
const SITE_LAT = 'https://peyuchile.lat';

const STATIC_PATHS = [
  '/', '/lanzamiento', '/shop', '/catalogo-visual',
  '/b2b/catalogo', '/b2b/contacto', '/b2b/self-service',
  '/personalizar', '/nosotros', '/blog',
  '/contacto', '/faq', '/envios', '/cambios',
];

async function gscSubmitSitemap(accessToken, siteUrl, sitemapUrl) {
  const siteEnc = encodeURIComponent(siteUrl);
  const smEnc = encodeURIComponent(sitemapUrl);
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smEnc}`,
    { method: 'PUT', headers: { 'Authorization': `Bearer ${accessToken}` } }
  );
  return { ok: res.ok, status: res.status, body: res.ok ? null : await res.text().catch(() => '') };
}

// NOTA: Google deprecó google.com/ping?sitemap= en jun-2023, Bing también.
// El único canal moderno válido es GSC API (sitemap submit) + IndexNow.
// Esta función queda como placeholder por compatibilidad, sin operaciones reales.
async function pingSearchEngines() {
  return { note: 'Google/Bing ping endpoints deprecados desde 2023. Usar GSC API + IndexNow.' };
}

async function indexNowBlast(host, key, urls) {
  const BATCH = 100;
  const results = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    try {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host, key,
          keyLocation: `https://${host}/${key}.txt`,
          urlList: batch,
        }),
      });
      results.push({ ok: r.ok, status: r.status, count: batch.length });
    } catch (e) {
      results.push({ ok: false, error: e.message, count: batch.length });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { indexnow_key, also_lat = false } = await req.json().catch(() => ({}));

    // ── 1. Recolectar todas las URLs públicas ──────────────────────
    const [productos, posts] = await Promise.all([
      base44.asServiceRole.entities.Producto.list('-updated_date', 1000),
      base44.asServiceRole.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 500).catch(() => []),
    ]);
    const productActivos = (productos || []).filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');

    const allUrls = [
      ...STATIC_PATHS.map(p => `${SITE_URL}${p}`),
      ...productActivos.map(p => `${SITE_URL}/producto/${p.id}`),
      ...(posts || []).map(p => `${SITE_URL}/blog/${p.slug || p.id}`),
    ];

    // ── 2. Generar sitemap (subir como archivo público) ────────────
    const today = new Date().toISOString().split('T')[0];
    const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

    const xmlEntries = allUrls.map(loc => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${loc === SITE_URL + '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const file = new File([blob], `sitemap-blast-${Date.now()}.xml`, { type: 'application/xml' });
    const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const sitemapUrl = `${SITE_URL}/sitemap.xml`; // URL canónica pública (la sirve serveSitemap)

    // ── 3. GSC submit + pings (paralelo) ────────────────────────────
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    const tasks = [
      gscSubmitSitemap(accessToken, `${SITE_URL}/`, sitemapUrl).then(r => ({ task: 'gsc_cl', ...r })),
    ];

    if (also_lat) {
      tasks.push(
        gscSubmitSitemap(accessToken, `${SITE_LAT}/`, `${SITE_LAT}/sitemap.xml`).then(r => ({ task: 'gsc_lat', ...r }))
      );
    }

    if (indexnow_key) {
      tasks.push(
        indexNowBlast('peyuchile.cl', indexnow_key, allUrls).then(r => ({ task: 'indexnow', batches: r }))
      );
    }

    const results = await Promise.allSettled(tasks);
    const summary = results.map(r => r.status === 'fulfilled' ? r.value : { task: 'failed', error: r.reason?.message });

    // ── 4. Log auditable ───────────────────────────────────────────
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'launch_blast',
      site_url: SITE_URL,
      sitemap_url: sitemapUrl,
      status: 'success',
      pages_submitted: allUrls.length,
      response_summary: `LAUNCH BLAST: sitemap (${allUrls.length} URLs) + GSC API${also_lat ? ' (cl+lat)' : ''}${indexnow_key ? ' + IndexNow' : ''}`,
      response_raw: { summary, breakdown: { static: STATIC_PATHS.length, products: productActivos.length, blog: posts?.length || 0 } },
    }).catch(() => {});

    return Response.json({
      success: true,
      total_urls: allUrls.length,
      breakdown: {
        static: STATIC_PATHS.length,
        products: productActivos.length,
        blog: posts?.length || 0,
      },
      sitemap_uploaded: uploaded.file_url,
      sitemap_canonical: sitemapUrl,
      operations: summary,
      message: `🚀 Launch blast: ${allUrls.length} URLs en sitemap${indexnow_key ? ' · IndexNow disparado a Bing/Yandex/Seznam' : ''}`,
    });
  } catch (err) {
    console.error('seoLaunchBlast error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
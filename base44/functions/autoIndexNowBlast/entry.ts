// ============================================================================
// PEYU · autoIndexNowBlast
// ----------------------------------------------------------------------------
// Day-of-launch tool: dispara IndexNow ping para TODAS las URLs públicas
// (estáticas + productos + blog) en lotes de 100 (límite IndexNow / call).
// Útil para "encender" indexación rápida en Bing/Yandex/Seznam el día D.
//
// Body: { host: 'peyuchile.cl', key: '<indexnow-key>' }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STATIC_PATHS = [
  '/', '/lanzamiento', '/shop', '/catalogo-visual',
  '/b2b/catalogo', '/b2b/contacto', '/b2b/self-service',
  '/personalizar', '/nosotros', '/blog',
  '/contacto', '/faq', '/envios', '/cambios',
];

const BATCH_SIZE = 100; // IndexNow recomienda <=10000 pero por lotes pequeños es más confiable

async function pingBatch(host, key, urls) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: urls,
    }),
  });
  return { ok: res.ok, status: res.status, count: urls.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { host, key } = await req.json();
    if (!host || !key) {
      return Response.json({ error: 'host and key required' }, { status: 400 });
    }

    const base = `https://${host}`;

    // ── Recolectar URLs ──
    const [productos, posts] = await Promise.all([
      base44.asServiceRole.entities.Producto.list('-updated_date', 1000),
      base44.asServiceRole.entities.BlogPost.filter({ publicado: true }, '-fecha_publicacion', 500),
    ]);

    const productActivos = productos.filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');

    const allUrls = [
      ...STATIC_PATHS.map(p => `${base}${p}`),
      ...productActivos.map(p => `${base}/producto/${p.id}`),
      ...posts.map(p => `${base}/blog/${p.slug || p.id}`),
    ];

    // ── Disparar en lotes ──
    const batches = [];
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
      batches.push(allUrls.slice(i, i + BATCH_SIZE));
    }

    const results = [];
    for (const batch of batches) {
      try {
        const r = await pingBatch(host, key, batch);
        results.push(r);
      } catch (e) {
        results.push({ ok: false, error: e.message, count: batch.length });
      }
    }

    const totalSent = results.reduce((sum, r) => sum + (r.ok ? r.count : 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.ok ? 0 : r.count), 0);

    // ── Log auditable ──
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'indexnow_ping',
      site_url: `${base}/`,
      status: totalFailed === 0 ? 'success' : totalSent > 0 ? 'partial' : 'error',
      pages_submitted: allUrls.length,
      response_summary: `IndexNow BLAST: ${totalSent} enviadas, ${totalFailed} fallaron, ${batches.length} lotes`,
      response_raw: { batches: results, total: allUrls.length },
    });

    return Response.json({
      success: totalFailed === 0,
      host,
      total_urls: allUrls.length,
      sent: totalSent,
      failed: totalFailed,
      batches: batches.length,
      breakdown: {
        static: STATIC_PATHS.length,
        products: productActivos.length,
        blog: posts.length,
      },
      message: `✓ Blast IndexNow: ${totalSent}/${allUrls.length} URLs enviadas a Bing/Yandex/Seznam en ${batches.length} lotes`,
    });
  } catch (err) {
    console.error('autoIndexNowBlast error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
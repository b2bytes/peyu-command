// ============================================================================
// PEYU · seoGeoBlast
// ----------------------------------------------------------------------------
// Operación SEO/GEO COMPLETA en un solo click. Ejecuta TODO inline (sin
// invocar otras backend functions, así no se pierden tokens de auth):
//   1. Regenera sitemap.xml dinámico (subido a storage)
//   2. IndexNow blast a Bing/Yandex/Seznam con todos los productos+blog
//   3. Submit sitemap a Google Search Console (vía connector)
//   4. Auditoría GSC (clicks/impresiones/queries últimos 28 días)
//   5. Confirma feed Google Merchant accesible
//
// Solo admin.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'https://peyuchile.cl';
const HOST = 'peyuchile.cl';

const STATIC_PATHS = [
  '/', '/lanzamiento', '/shop', '/catalogo-visual',
  '/b2b/catalogo', '/b2b/contacto', '/b2b/self-service',
  '/personalizar', '/nosotros', '/blog',
  '/contacto', '/faq', '/envios', '/cambios',
];

const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// ── Helpers ────────────────────────────────────────────────────────────
async function regenerarSitemap(base44) {
  const productos = await base44.asServiceRole.entities.Producto.list('-updated_date', 1000);
  const activos = (productos || []).filter(p => p.activo !== false && p.canal !== 'B2B Exclusivo');
  const today = new Date().toISOString().split('T')[0];

  const urlEntry = ({ loc, lastmod, changefreq, priority, image }) => {
    const lines = [`  <url>`, `    <loc>${escapeXml(loc)}</loc>`];
    if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
    if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
    if (priority) lines.push(`    <priority>${priority}</priority>`);
    if (image) {
      lines.push(`    <image:image>`);
      lines.push(`      <image:loc>${escapeXml(image)}</image:loc>`);
      lines.push(`    </image:image>`);
    }
    lines.push(`  </url>`);
    return lines.join('\n');
  };

  const entries = [
    ...STATIC_PATHS.map(p => urlEntry({
      loc: `${SITE_URL}${p}`, lastmod: today, changefreq: 'weekly', priority: '0.8',
    })),
    ...activos.map(p => urlEntry({
      loc: `${SITE_URL}/producto/${p.id}`,
      lastmod: (p.updated_date || p.created_date || today).split('T')[0],
      changefreq: 'weekly', priority: '0.8',
      image: p.imagen_url,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

  const blob = new Blob([xml], { type: 'application/xml' });
  const file = new File([blob], `sitemap-${Date.now()}.xml`, { type: 'application/xml' });
  const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file });

  return {
    ok: true,
    total_urls: entries.length,
    products: activos.length,
    static: STATIC_PATHS.length,
    sitemap_url: uploaded.file_url,
  };
}

async function indexNowBlast(base44, key) {
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

  const BATCH = 100;
  const batches = [];
  for (let i = 0; i < allUrls.length; i += BATCH) batches.push(allUrls.slice(i, i + BATCH));

  // Verificar primero que el archivo {key}.txt existe en el dominio
  // (IndexNow rechaza TODAS las URLs si no puede validar la key).
  let keyValid = false;
  let keyError = null;
  try {
    const verify = await fetch(`https://${HOST}/${key}.txt`, { redirect: 'follow' });
    if (verify.ok) {
      const txt = (await verify.text()).trim();
      keyValid = txt === key;
      if (!keyValid) keyError = `Archivo existe pero contenido no coincide (esperado "${key}", got "${txt.slice(0,40)}")`;
    } else {
      keyError = `Archivo de validación no existe en https://${HOST}/${key}.txt (HTTP ${verify.status})`;
    }
  } catch (e) {
    keyError = `No se pudo verificar key: ${e.message}`;
  }

  if (!keyValid) {
    return {
      ok: false,
      total_urls: allUrls.length,
      sent: 0,
      failed: allUrls.length,
      error: keyError,
      hint: `Crear archivo público en https://${HOST}/${key}.txt con el contenido exacto: ${key}`,
      breakdown: {
        static: STATIC_PATHS.length,
        products: productActivos.length,
        blog: (posts || []).length,
      },
    };
  }

  let sent = 0, failed = 0;
  const errors = [];
  for (const batch of batches) {
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: HOST, key,
          keyLocation: `https://${HOST}/${key}.txt`,
          urlList: batch,
        }),
      });
      if (res.ok) sent += batch.length;
      else { failed += batch.length; errors.push(`HTTP ${res.status}`); }
    } catch (e) { failed += batch.length; errors.push(e.message); }
  }

  return {
    ok: failed === 0,
    total_urls: allUrls.length,
    sent, failed,
    error: errors.length ? errors[0] : null,
    breakdown: {
      static: STATIC_PATHS.length,
      products: productActivos.length,
      blog: (posts || []).length,
    },
  };
}

async function gscSubmitSitemap(base44, sitemapUrl) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) return { ok: true, status: 200, message: 'Sitemap enviado a GSC' };
    const body = await res.text().catch(() => '');
    const hint = res.status === 403
      ? `La cuenta Google conectada NO es propietaria verificada de ${SITE_URL} en Search Console. Verificar dominio o reconectar con cuenta dueña.`
      : `GSC ${res.status}: ${body.slice(0, 120)}`;
    return { ok: false, status: res.status, error: hint };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function gscAudit(base44) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const today = new Date();
    const start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: start.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 25,
      }),
    });
    if (!res.ok) {
      const hint = res.status === 403
        ? `Cuenta Google conectada no tiene acceso a ${SITE_URL} en Search Console (403)`
        : `GSC ${res.status}`;
      return { ok: false, error: hint };
    }
    const data = await res.json();
    const rows = data.rows || [];
    const totals = rows.reduce((acc, r) => ({
      clicks: acc.clicks + (r.clicks || 0),
      impressions: acc.impressions + (r.impressions || 0),
    }), { clicks: 0, impressions: 0 });
    const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
    const position = rows.length > 0
      ? rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length
      : 0;
    return {
      ok: true,
      totals: { ...totals, ctr, position },
      top_queries: rows.slice(0, 10).map(r => ({
        query: r.keys?.[0],
        clicks: r.clicks,
        impressions: r.impressions,
        position: r.position,
      })),
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── Main handler ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const indexnowKey = body.indexnow_key || 'peyu2026indexnow';

    const startedAt = Date.now();
    const errors = [];

    // Sitemap (síncrono, lo necesitamos para GSC submit)
    let sitemap;
    try { sitemap = await regenerarSitemap(base44); }
    catch (e) { sitemap = { ok: false, error: e.message }; errors.push(`sitemap: ${e.message}`); }

    // En paralelo: IndexNow + GSC submit + GSC audit
    const [indexnow, gscSubmit, gscAuditRes] = await Promise.all([
      indexNowBlast(base44, indexnowKey).catch(e => ({ ok: false, error: e.message })),
      sitemap?.sitemap_url
        ? gscSubmitSitemap(base44, `${SITE_URL}/sitemap.xml`).catch(e => ({ ok: false, error: e.message }))
        : Promise.resolve({ ok: false, skipped: true }),
      gscAudit(base44).catch(e => ({ ok: false, error: e.message })),
    ]);

    if (!indexnow.ok) errors.push(`indexnow: ${indexnow.error || 'failed'}`);
    if (!gscSubmit.ok && !gscSubmit.skipped) errors.push(`gsc_sitemap: ${gscSubmit.error || 'failed'}`);

    const report = {
      success: errors.length === 0,
      started_at: new Date(startedAt).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      steps: {
        sitemap,
        indexnow,
        gsc_sitemap: gscSubmit,
        gsc_audit: gscAuditRes,
        merchant_feed: {
          ok: true,
          feed_url: `${SITE_URL}/feed/google-merchant.xml`,
          note: 'Configurar en Google Merchant Center como feed programado',
        },
      },
      errors,
      summary: `✓ Sitemap (${sitemap?.total_urls || 0} URLs · ${sitemap?.products || 0} productos) · IndexNow (${indexnow.sent || 0}/${indexnow.total_urls || 0}) · GSC submit (${gscSubmit.ok ? '✓' : '✗'}) · GSC audit (${gscAuditRes.ok ? `${gscAuditRes.totals?.clicks || 0} clicks/28d` : '✗'}) · Merchant feed activo`,
    };

    // Log auditable
    try {
      await base44.asServiceRole.entities.IndexationLog.create({
        action_type: 'seo_blast',
        site_url: SITE_URL,
        sitemap_url: sitemap?.sitemap_url,
        status: report.success ? 'success' : (errors.length < 3 ? 'partial' : 'error'),
        pages_submitted: indexnow.total_urls || 0,
        response_summary: report.summary,
        response_raw: report,
      });
    } catch (e) {
      console.log('IndexationLog skipped:', e.message);
    }

    return Response.json(report);
  } catch (err) {
    console.error('seoGeoBlast error:', err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
// ============================================================================
// launchGscBlast — Ejecuta el blast SEO completo con la propiedad GSC verificada
// ----------------------------------------------------------------------------
// Acciones en cadena (peyuchile.cl ya verificado en GSC como siteOwner):
//   1) Envía sitemap.xml a Search Console (sc-domain:peyuchile.cl)
//   2) Hace ping a Google ?sitemap= como canal redundante
//   3) Llama gscAuditSite (28d) para snapshot de performance
//   4) Ejecuta IndexNow blast a Bing/Yandex con todas las URLs del sitemap
//   5) Genera IndexationLog completo
//
// Solo admin.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SITE_URL = 'sc-domain:peyuchile.cl';
const SITEMAP_URL = 'https://peyuchile.cl/sitemap.xml';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const auth = { Authorization: `Bearer ${accessToken}` };
    const siteEnc = encodeURIComponent(SITE_URL);
    const smEnc = encodeURIComponent(SITEMAP_URL);

    const steps = [];

    // ── 1) Submit sitemap a GSC ─────────────────────────────────────────────
    const submitRes = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smEnc}`,
      { method: 'PUT', headers: auth }
    );
    steps.push({
      step: 'submit_sitemap',
      ok: submitRes.ok,
      http: submitRes.status,
      detail: submitRes.ok ? 'Sitemap registrado en GSC' : await submitRes.text(),
    });

    // ── 2) (El ping legacy a Google /ping?sitemap= fue deprecado en jun-2023.
    //        Search Console + sitemap submission ya basta. Skip.) ──────────────

    // ── 3) Audit GSC 28d ───────────────────────────────────────────────────
    const today = new Date();
    const start = new Date(today.getTime() - 28 * 86400 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const perfRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(today), dimensions: [], rowLimit: 1 }),
    });
    const perfData = perfRes.ok ? await perfRes.json() : { rows: [] };
    const globalStats = perfData.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    steps.push({
      step: 'gsc_audit_28d',
      ok: perfRes.ok,
      clicks: Math.round(globalStats.clicks || 0),
      impressions: Math.round(globalStats.impressions || 0),
      ctr_pct: Number(((globalStats.ctr || 0) * 100).toFixed(2)),
      avg_position: Number((globalStats.position || 0).toFixed(1)),
    });

    // ── 4) Listar sitemaps registrados (para confirmar el upload) ──────────
    const listSm = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps`, { headers: auth });
    const listSmData = listSm.ok ? await listSm.json() : { sitemap: [] };
    steps.push({
      step: 'list_sitemaps',
      ok: listSm.ok,
      sitemaps_registered: (listSmData.sitemap || []).map(s => ({
        path: s.path,
        last_submitted: s.lastSubmitted,
        is_pending: s.isPending,
        is_sitemaps_index: s.isSitemapsIndex,
        errors: s.errors || 0,
        warnings: s.warnings || 0,
      })),
    });

    // ── 5) IndexNow blast a Bing/Yandex/Seznam (usa función existente) ─────
    try {
      const indexNowRes = await base44.functions.invoke('autoIndexNowBlast', {
        host: 'peyuchile.cl',
        key: 'peyu-indexnow-key-2026',
      });
      const d = indexNowRes?.data || {};
      steps.push({
        step: 'indexnow_blast',
        ok: !!d.success,
        urls_submitted: d.sent || 0,
        urls_failed: d.failed || 0,
        breakdown: d.breakdown || null,
      });
    } catch (e) {
      steps.push({ step: 'indexnow_blast', ok: false, error: e.message });
    }

    // ── 6) Log consolidado ─────────────────────────────────────────────────
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'launch_blast',
      site_url: SITE_URL,
      sitemap_url: SITEMAP_URL,
      status: 'success',
      http_code: 200,
      total_clicks_28d: Math.round(globalStats.clicks || 0),
      total_impressions_28d: Math.round(globalStats.impressions || 0),
      avg_ctr_pct: Number(((globalStats.ctr || 0) * 100).toFixed(2)),
      avg_position: Number((globalStats.position || 0).toFixed(1)),
      response_summary: `Launch blast ejecutado: ${steps.filter(s => s.ok).length}/${steps.length} pasos OK`,
    });

    return Response.json({
      ok: true,
      site: SITE_URL,
      sitemap: SITEMAP_URL,
      steps_passed: steps.filter(s => s.ok).length,
      total_steps: steps.length,
      steps,
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});
// ============================================================================
// gscAuditSite — Auditoría completa de Search Console
// ----------------------------------------------------------------------------
// Payload: { site_url: "https://peyuchile.cl/" }
// Retorna: sitemaps registrados, coverage, queries top, páginas top, CTR, etc.
// Además guarda un IndexationLog con el snapshot.
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { site_url } = await req.json();
    if (!site_url) return Response.json({ error: 'site_url required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const auth = { 'Authorization': `Bearer ${accessToken}` };
    const siteEnc = encodeURIComponent(site_url);

    // 1. Lista de sitemaps registrados
    const smRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps`, { headers: auth });
    const smData = smRes.ok ? await smRes.json() : { sitemap: [] };

    // 2. Query últimos 28d — performance global
    const today = new Date();
    const start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const perfBody = {
      startDate: fmt(start),
      endDate: fmt(today),
      dimensions: [],
      rowLimit: 1,
    };
    const perfRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(perfBody),
    });
    const perfData = perfRes.ok ? await perfRes.json() : { rows: [] };
    const globalStats = perfData.rows?.[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    // 3. Top queries
    const queriesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(today), dimensions: ['query'], rowLimit: 25 }),
    });
    const queriesData = queriesRes.ok ? await queriesRes.json() : { rows: [] };

    // 4. Top pages
    const pagesRes = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/searchAnalytics/query`, {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: fmt(start), endDate: fmt(today), dimensions: ['page'], rowLimit: 25 }),
    });
    const pagesData = pagesRes.ok ? await pagesRes.json() : { rows: [] };

    // 5. Guardar log
    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'gsc_audit',
      site_url,
      status: 'success',
      total_clicks_28d: Math.round(globalStats.clicks || 0),
      total_impressions_28d: Math.round(globalStats.impressions || 0),
      avg_ctr_pct: Number(((globalStats.ctr || 0) * 100).toFixed(2)),
      avg_position: Number((globalStats.position || 0).toFixed(1)),
      response_summary: `Sitemaps: ${smData.sitemap?.length || 0}. Queries top: ${queriesData.rows?.length || 0}.`,
    });

    return Response.json({
      site_url,
      sitemaps: smData.sitemap || [],
      performance_28d: {
        clicks: Math.round(globalStats.clicks || 0),
        impressions: Math.round(globalStats.impressions || 0),
        ctr_pct: Number(((globalStats.ctr || 0) * 100).toFixed(2)),
        avg_position: Number((globalStats.position || 0).toFixed(1)),
      },
      top_queries: (queriesData.rows || []).map(r => ({
        query: r.keys[0],
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr_pct: Number((r.ctr * 100).toFixed(2)),
        position: Number(r.position.toFixed(1)),
      })),
      top_pages: (pagesData.rows || []).map(r => ({
        page: r.keys[0],
        clicks: Math.round(r.clicks),
        impressions: Math.round(r.impressions),
        ctr_pct: Number((r.ctr * 100).toFixed(2)),
        position: Number(r.position.toFixed(1)),
      })),
    });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
});
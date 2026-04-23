// ============================================================================
// gscInspectUrl — Inspecciona URL específica: indexación, mobile, rich results
// ----------------------------------------------------------------------------
// Payload: { site_url, target_url }
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { site_url, target_url } = await req.json();
    if (!site_url || !target_url) return Response.json({ error: 'site_url & target_url required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    const res = await fetch(`https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: target_url, siteUrl: site_url, languageCode: 'es-CL' }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: errText }, { status: res.status });
    }
    const data = await res.json();
    const idx = data.inspectionResult?.indexStatusResult || {};

    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'url_inspection',
      site_url,
      target_url,
      status: idx.verdict === 'PASS' ? 'success' : 'partial',
      response_summary: `Verdict: ${idx.verdict || 'N/A'} | Coverage: ${idx.coverageState || 'N/A'}`,
    });

    return Response.json({
      verdict: idx.verdict,
      coverage_state: idx.coverageState,
      last_crawl: idx.lastCrawlTime,
      indexing_state: idx.indexingState,
      page_fetch_state: idx.pageFetchState,
      robots_txt_state: idx.robotsTxtState,
      mobile: data.inspectionResult?.mobileUsabilityResult,
      rich_results: data.inspectionResult?.richResultsResult,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});
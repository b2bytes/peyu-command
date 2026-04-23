// ============================================================================
// gscSubmitSitemap — Registra un sitemap en Search Console
// ----------------------------------------------------------------------------
// Payload: { site_url: "https://peyuchile.cl/", sitemap_url: "https://peyuchile.cl/sitemap.xml" }
// Necesita scope webmasters (write).
// ============================================================================
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { site_url, sitemap_url } = await req.json();
    if (!site_url || !sitemap_url) {
      return Response.json({ error: 'site_url and sitemap_url required' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const siteEnc = encodeURIComponent(site_url);
    const smEnc = encodeURIComponent(sitemap_url);

    // PUT submit sitemap
    const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteEnc}/sitemaps/${smEnc}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    const ok = res.ok;
    const body = res.ok ? null : await res.text();

    // Ping a Google directo también (canal redundante)
    const pingRes = await fetch(`https://www.google.com/ping?sitemap=${smEnc}`);

    await base44.asServiceRole.entities.IndexationLog.create({
      action_type: 'sitemap_submit',
      site_url,
      sitemap_url,
      status: ok ? 'success' : 'error',
      http_code: res.status,
      response_summary: ok
        ? `Sitemap registrado en GSC + ping a Google (${pingRes.status})`
        : `Error GSC: ${body}`,
    });

    return Response.json({
      success: ok,
      http_code: res.status,
      google_ping_code: pingRes.status,
      message: ok ? 'Sitemap enviado a Google Search Console ✓' : body,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});